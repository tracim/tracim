import cgi
from datetime import datetime
from smtplib import SMTPException
from smtplib import SMTPRecipientsRefused
import typing
import uuid

from babel.dates import format_date
from babel.dates import format_time
from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound
import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.upload_permissions.email_manager import (
    UploadPermissionEmailManager,
)
from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.applications.upload_permissions.models import UploadPermissionType
from tracim_backend.applications.upload_permissions.models_in_context import (
    UploadPermissionInContext,
)
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import NotificationSendingFailed
from tracim_backend.exceptions import UploadPermissionNotFound
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.utils import get_frontend_ui_base_url
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import WorkspaceInContext
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision

FRONTEND_UPLOAD_PERMISSION_LINK_PATTERN = (
    "{frontend_ui_base_url}guest-upload/{upload_permission_token}"
)


class UploadPermissionLib(object):
    def __init__(
        self,
        session: Session,
        current_user: typing.Optional[User],
        config: CFG,
        show_disabled: bool = False,
    ) -> None:
        self._user = current_user
        self._session = session
        self._config = config
        self.show_disabled = show_disabled

    def base_query(self) -> Query:
        base_query = self._session.query(UploadPermission)
        if not self.show_disabled:
            base_query = base_query.filter(UploadPermission.enabled == True)  # noqa: E712
        return base_query

    def add_permission_to_workspace(
        self,
        workspace: Workspace,
        emails: typing.List[str],
        password: typing.Optional[str] = None,
        do_notify=False,
    ) -> typing.List[UploadPermission]:
        upload_permissions = []
        created = datetime.utcnow()
        upload_permission_group_uuid = str(uuid.uuid4().hex)
        for email in emails:
            upload_permission = UploadPermission(
                author=self._user,
                workspace_id=workspace.workspace_id,
                email=email.lower(),
                token=str(uuid.uuid4()),
                password=password,
                type=UploadPermissionType.EMAIL,
                created=created,
                upload_permission_group_uuid=upload_permission_group_uuid,
                enabled=True,
            )
            self.save(upload_permission)
            upload_permissions.append(upload_permission)
            self._session.flush()

        if do_notify:
            userlib = UserApi(config=self._config, current_user=self._user, session=self._session)
            workspace_lib = WorkspaceApi(
                config=self._config, current_user=self._user, session=self._session
            )
            try:
                email_manager = self._get_email_manager(self._config, self._session)
                email_manager.notify_upload_permission(
                    emitter=userlib.get_user_with_context(self._user),
                    workspace_in_context=workspace_lib.get_workspace_with_context(workspace),
                    upload_permission_receivers=self.get_upload_permissions_in_context(
                        upload_permissions
                    ),
                    upload_permission_password=password,
                )
            # FIXME - G.M - 2018-11-02 - hack: accept bad recipient user creation
            # this should be fixed to find a solution to allow "fake" email but
            # also have clear error case for valid mail.
            except SMTPRecipientsRefused:
                logger.warning(
                    self,
                    "Upload Permission initied by user {} but SMTP "
                    "server refuse to send notification".format(self._user.login),
                )
            except SMTPException as exc:
                raise NotificationSendingFailed(
                    "Notification for Upload Permission can't be send " "(SMTP error)."
                ) from exc
        return upload_permissions

    def _get_email_manager(self, config: CFG, session: Session) -> UploadPermissionEmailManager:
        """
        :return: EmailManager instance
        """
        smtp_config = SmtpConfiguration(
            config.EMAIL__NOTIFICATION__SMTP__SERVER,
            config.EMAIL__NOTIFICATION__SMTP__PORT,
            config.EMAIL__NOTIFICATION__SMTP__USER,
            config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
            config.EMAIL__NOTIFICATION__SMTP__CONNECT_METHOD,
            config.EMAIL__NOTIFICATION__SMTP__ANONYMOUS,
        )

        return UploadPermissionEmailManager(config=config, smtp_config=smtp_config, session=session)

    def get_upload_permissions(self, workspace: Workspace) -> typing.List[UploadPermission]:
        return (
            self.base_query().filter(UploadPermission.workspace_id == workspace.workspace_id).all()
        )

    def get_upload_permission_in_context(
        self, upload_permission: UploadPermission
    ) -> UploadPermissionInContext:
        return UploadPermissionInContext(upload_permission, self._session, self._config, self._user)

    def get_upload_permissions_in_context(
        self, upload_permissions: typing.List[UploadPermission]
    ) -> typing.List[UploadPermissionInContext]:
        upload_permissions_in_context = []
        for upload_permission in upload_permissions:
            upload_permissions_in_context.append(
                self.get_upload_permission_in_context(upload_permission)
            )
        return upload_permissions_in_context

    def get_upload_permission_by_token(self, upload_permission_token: str) -> UploadPermission:
        try:
            return self.base_query().filter(UploadPermission.token == upload_permission_token).one()
        except NoResultFound as exc:
            raise UploadPermissionNotFound(
                'Upload permission with token "{}" not found in database'.format(
                    upload_permission_token
                )
            ) from exc

    def check_password(
        self, upload_permission: UploadPermission, password: typing.Optional[str]
    ) -> None:
        """
        Check password if upload_permission has password. If there is a upload_permission password, it
        will check and raise WrongSharePassword Exception in case password given
        doesn't match content_check one.
        :param upload_permission: UploadPermission to check.
        :param password: cleartext password
        :return: None
        """
        if upload_permission.password:
            if not password or not upload_permission.validate_password(password):
                raise WrongSharePassword(
                    'given password for  Upload Permission "{}" of workspace "{}" is incorrect'.format(
                        upload_permission.upload_permission_id,
                        upload_permission.workspace.workspace_id,
                    )
                )

    def get_upload_permission(
        self, workspace: Workspace, upload_permission_id: int
    ) -> UploadPermission:
        try:
            return (
                self.base_query()
                .filter(UploadPermission.workspace_id == workspace.workspace_id)
                .filter(UploadPermission.upload_permission_id == upload_permission_id)
                .one()  # type: UploadPermission
            )  # INFO - GM - 2020-04-02 - do not put typing here, black error : https://github.com/psf/black/issues/1329
        except NoResultFound as exc:
            raise UploadPermissionNotFound(
                'Upload permission "{}" not found in database'.format(upload_permission_id)
            ) from exc

    def disable_upload_permission(
        self, workspace: Workspace, upload_permission_id: int
    ) -> UploadPermission:
        upload_permission_to_disable = self.get_upload_permission(workspace, upload_permission_id)
        upload_permission_to_disable.disabled = datetime.utcnow()
        upload_permission_to_disable.enabled = False
        self.save(upload_permission=upload_permission_to_disable)
        return upload_permission_to_disable

    def frontend_url(self, upload_permission: UploadPermission) -> str:
        frontend_ui_base_url = get_frontend_ui_base_url(config=self._config)
        return FRONTEND_UPLOAD_PERMISSION_LINK_PATTERN.format(
            frontend_ui_base_url=frontend_ui_base_url,
            upload_permission_token=upload_permission.token,
        )

    def save(self, upload_permission: UploadPermission) -> UploadPermission:
        self._session.add(upload_permission)
        return upload_permission

    def _notify_uploaded_contents(
        self,
        uploader_username: str,
        uploader_email: str,
        uploader_message: typing.Optional[str],
        workspace_in_context: WorkspaceInContext,
        uploaded_contents: typing.List[ContentInContext],
    ):
        email_manager = self._get_email_manager(self._config, self._session)
        # TODO - G.M - 2019-08-12 - handle exceptions there
        email_manager.notify_new_upload(
            uploaded_contents=uploaded_contents,
            uploader_username=uploader_username,
            uploader_message=uploader_message,
            workspace_in_context=workspace_in_context,
            uploader_email=uploader_email,
        )

    def upload_files(
        self,
        upload_permission: UploadPermission,
        uploader_username: str,
        message: typing.Optional[str],
        files: typing.List[cgi.FieldStorage],
        do_notify: bool = False,
    ) -> typing.List[ContentInContext]:
        content_api = ContentApi(
            config=self._config,
            current_user=upload_permission.author,
            session=self._session,
            namespaces_filter=[ContentNamespaces.UPLOAD],
        )
        translator = Translator(app_config=self._config)
        _ = translator.get_translation
        current_datetime = datetime.utcnow()
        folder_label = _("Files uploaded by {username} on {date} at {time}").format(
            username=uploader_username,
            date=format_date(current_datetime, locale=translator.default_lang),
            time=format_time(current_datetime, locale=translator.default_lang),
        )

        try:
            upload_folder = content_api.create(
                content_type_slug=content_type_list.Folder.slug,
                workspace=upload_permission.workspace,
                label=folder_label,
                do_notify=False,
                do_save=True,
                content_namespace=ContentNamespaces.UPLOAD,
            )
        except ContentFilenameAlreadyUsedInFolder:
            upload_folder = content_api.get_one_by_filename(
                filename=folder_label, workspace=upload_permission.workspace
            )

        created_contents = []
        if message:
            comment_message = _("Message from {username}: {message}").format(
                username=uploader_username, message=message
            )
        else:
            comment_message = _("Uploaded by {username}.").format(username=uploader_username)

        for _file in files:
            content = content_api.create(
                filename=_file.filename,
                content_type_slug=content_type_list.File.slug,
                workspace=upload_permission.workspace,
                parent=upload_folder,
                do_notify=False,
                content_namespace=ContentNamespaces.UPLOAD,
            )
            content_api.save(content, ActionDescription.CREATION)
            with new_revision(session=self._session, tm=transaction.manager, content=content):
                content_api.update_file_data(
                    content,
                    new_filename=_file.filename,
                    new_mimetype=_file.type,
                    new_content=_file.file,
                )
            content_api.create_comment(
                parent=content, content=comment_message, do_save=True, do_notify=False
            )
            created_contents.append(content_api.get_content_in_context(content))

        if do_notify:
            workspace_lib = WorkspaceApi(
                config=self._config, current_user=upload_permission.author, session=self._session
            )
            self._notify_uploaded_contents(
                uploader_username=uploader_username,
                workspace_in_context=workspace_lib.get_workspace_with_context(
                    upload_permission.workspace
                ),
                uploader_message=message,
                uploaded_contents=created_contents,
                uploader_email=upload_permission.email,
            )

        return created_contents
