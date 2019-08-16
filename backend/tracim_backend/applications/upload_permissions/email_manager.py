from email.message import Message
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
import typing

from tracim_backend.applications.upload_permissions.models_in_context import (
    UploadPermissionInContext,
)
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.mail_notifier.notifier import EmailManager
from tracim_backend.lib.mail_notifier.sender import EmailSender
from tracim_backend.lib.mail_notifier.sender import send_email_through
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.utils import EmailUser
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.context_models import WorkspaceInContext
from tracim_backend.models.data import Workspace


class UploadPermissionEmailManager(EmailManager):
    def notify_new_upload(
        self,
        uploader_username,
        uploader_email,
        workspace_in_context: WorkspaceInContext,
        uploaded_contents: typing.List[ContentInContext],
    ) -> None:
        email_sender = EmailSender(
            self.config, self._smtp_config, self.config.EMAIL__NOTIFICATION__ACTIVATED
        )
        notifiable_roles = WorkspaceApi(
            current_user=None, session=self.session, config=self.config
        ).get_notifiable_roles(workspace_in_context.workspace, force_notify=True)

        for role in notifiable_roles:
            logger.info(
                self,
                'Generating new upload notification in workspace "{}" from "{}" to "{}"'.format(
                    workspace_in_context.workspace_id, uploader_username, role.user.email
                ),
            )
            translator = Translator(app_config=self.config, default_lang=role.user.lang)
            uploader = EmailUser(username=uploader_username, user_email=uploader_email)
            message = self._notify_new_upload(
                workspace_in_context=workspace_in_context,
                receiver=role.user,
                uploader=uploader,
                translator=translator,
                uploaded_contents=uploaded_contents,
            )
            send_email_through(
                config=self.config, sendmail_callable=email_sender.send_mail, message=message
            )

    def _notify_new_upload(
        self,
        workspace_in_context: WorkspaceInContext,
        receiver: UserInContext,
        uploader: EmailUser,
        uploaded_contents: typing.List[ContentInContext],
        translator: Translator,
    ) -> Message:
        logger.info(
            self,
            'preparing email to user "{}" about new upload on workspace "{}" info created'.format(
                receiver.user_id, workspace_in_context.workspace_id
            ),
        )
        message = MIMEMultipart("alternative")
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__SUBJECT
        )
        message["Subject"] = translated_subject.format(
            website_title=self.config.WEBSITE__TITLE,
            uploader_username=uploader.username,
            nb_uploaded_contents=len(uploaded_contents),
            workspace_name=workspace_in_context.label,
        )
        message["From"] = self._get_sender()
        to_addr = formataddr((receiver.display_name, receiver.email))
        message["To"] = to_addr
        html_template_file_path = self.config.EMAIL__NOTIFICATION__NEW_UPLOAD_EVENT__TEMPLATE__HTML

        context = {
            "receiver": receiver,
            "workspace": workspace_in_context,
            "uploader": uploader,
            "uploaded_contents": uploaded_contents,
        }
        body_html = self._render_template(
            mako_template_filepath=html_template_file_path, context=context, translator=translator
        )

        part2 = MIMEText(body_html, "html", "utf-8")
        # Attach parts into message container.
        # According to RFC 2046, the last part of a multipart message,
        # in this case the HTML message, is best and preferred.
        message.attach(part2)
        return message

    def notify_upload_permission(
        self,
        emitter: UserInContext,
        workspace_in_context: WorkspaceInContext,
        upload_permission_receivers: typing.List[UploadPermissionInContext],
        upload_permission_password: str,
    ) -> None:
        """
        Send mails to notify users for sharing content
        :param emitter: User emitter of the sharing
        :param workspace_in_context: workspace where receivers can now upload file
        :param upload_permission_receivers: list of upload_permission
        :param upload_permission_password: cleartext password of the sharing
        """

        email_sender = EmailSender(
            self.config, self._smtp_config, self.config.EMAIL__NOTIFICATION__ACTIVATED
        )
        upload_permission_password_enabled = False
        if upload_permission_password:
            upload_permission_password_enabled = True
        translator = Translator(self.config, default_lang=emitter.lang)
        message = self._notify_emitter(
            emitter=emitter,
            workspace_in_context=workspace_in_context,
            upload_permission_receivers=upload_permission_receivers,
            upload_permission_password=upload_permission_password,
            translator=translator,
        )
        send_email_through(
            config=self.config, sendmail_callable=email_sender.send_mail, message=message
        )
        emails_receivers_list = [
            upload_permission.email for upload_permission in upload_permission_receivers
        ]
        logger.info(
            self,
            'Generating upload permission mail from user "{}" to "{}"'.format(
                emitter.user_id, "".join(emails_receivers_list)
            ),
        )
        for upload_permission in upload_permission_receivers:
            message = self._notify_receiver(
                emitter=emitter,
                workspace=workspace_in_context,
                upload_permission=upload_permission,
                upload_permission_password_enabled=upload_permission_password_enabled,
                translator=translator,
            )
            send_email_through(
                config=self.config, sendmail_callable=email_sender.send_mail, message=message
            )

    def _notify_emitter(
        self,
        emitter: UserInContext,
        workspace_in_context: WorkspaceInContext,
        upload_permission_receivers: typing.List[UploadPermissionInContext],
        upload_permission_password: str,
        translator: Translator,
    ) -> Message:
        logger.info(
            self,
            'preparing email to user "{}" about upload_permission on workspace "{}" info created'.format(
                emitter.user_id, workspace_in_context.workspace_id
            ),
        )
        message = MIMEMultipart("alternative")
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__SUBJECT
        )
        message["Subject"] = translated_subject.format(
            website_title=self.config.WEBSITE__TITLE,
            nb_receivers=len(upload_permission_receivers),
            workspace_name=workspace_in_context.label,
        )
        message["From"] = self._get_sender()
        to_addr = formataddr((emitter.display_name, emitter.email))
        message["To"] = to_addr
        html_template_file_path = (
            self.config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_EMITTER__TEMPLATE__HTML
        )
        context = {
            "emitter": emitter,
            "workspace": workspace_in_context,
            "upload_permission_receivers": upload_permission_receivers,
            "upload_permission_password": upload_permission_password,
        }
        body_html = self._render_template(
            mako_template_filepath=html_template_file_path, context=context, translator=translator
        )

        part2 = MIMEText(body_html, "html", "utf-8")
        # Attach parts into message container.
        # According to RFC 2046, the last part of a multipart message,
        # in this case the HTML message, is best and preferred.
        message.attach(part2)
        return message

    def _notify_receiver(
        self,
        emitter: User,
        workspace: Workspace,
        upload_permission: UploadPermissionInContext,
        upload_permission_password_enabled: bool,
        translator: Translator,
    ) -> Message:
        logger.info(
            self,
            'preparing email from user "{}" for the upload permission on workspace "{}" to "{}"'.format(
                emitter.user_id, workspace.workspace_id, upload_permission.email
            ),
        )
        message = MIMEMultipart("alternative")
        translated_subject = translator.get_translation(
            self.config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__SUBJECT
        )
        message["Subject"] = translated_subject.format(
            website_title=self.config.WEBSITE__TITLE,
            emitter_name=emitter.display_name,
            workspace_name=workspace.label,
        )
        message["From"] = self._get_sender()
        message["To"] = upload_permission.email
        html_template_file_path = (
            self.config.EMAIL__NOTIFICATION__UPLOAD_PERMISSION_TO_RECEIVER__TEMPLATE__HTML
        )
        receiver = EmailUser(user_email=upload_permission.email)
        context = {
            "emitter": emitter,
            "workspace": workspace,
            "upload_permission": upload_permission,
            "receiver": receiver,
            "upload_permission_password_enabled": upload_permission_password_enabled,
        }
        body_html = self._render_template(
            mako_template_filepath=html_template_file_path, context=context, translator=translator
        )

        part2 = MIMEText(body_html, "html", "utf-8")
        # Attach parts into message container.
        # According to RFC 2046, the last part of a multipart message,
        # in this case the HTML message, is best and preferred.
        message.attach(part2)
        return message
