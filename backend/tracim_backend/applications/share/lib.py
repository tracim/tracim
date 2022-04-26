from datetime import datetime
from smtplib import SMTPException
from smtplib import SMTPRecipientsRefused
import typing
from urllib.parse import quote
import uuid

from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.share.email_manager import ShareEmailManager
from tracim_backend.applications.share.models import ContentShare
from tracim_backend.applications.share.models import ContentShareType
from tracim_backend.applications.share.models_in_context import ContentShareInContext
from tracim_backend.config import CFG
from tracim_backend.exceptions import ContentShareNotFound
from tracim_backend.exceptions import NotificationSendingFailed
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.utils import core_convert_file_name_to_display
from tracim_backend.lib.utils.utils import get_frontend_ui_base_url
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.views import BASE_PUBLIC_API

FRONTEND_SHARED_CONTENT_LINK_PATTERN = "{frontend_ui_base_url}guest-download/{share_token}"
PUBLIC_API_SHARED_CONTENT_LINK_PATTERN = (
    "{api_base_url}{base_public_api}guest-download/{share_token}/{filename}"
)


class ShareLib(object):
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
        base_query = self._session.query(ContentShare)
        if not self.show_disabled:
            base_query = base_query.filter(ContentShare.enabled == True)  # noqa: E712
        return base_query

    def share_content(
        self,
        content: Content,
        emails: typing.List[str],
        password: typing.Optional[str] = None,
        do_notify: bool = False,
    ) -> typing.List[ContentShare]:
        content_shares = []
        created = datetime.now()
        share_group_uuid = str(uuid.uuid4())
        for email in emails:
            content_share = ContentShare(
                author=self._user,
                content_id=content.content_id,
                email=email.lower(),
                share_token=str(uuid.uuid4()),
                password=password,
                type=ContentShareType.EMAIL,
                created=created,
                share_group_uuid=share_group_uuid,
                enabled=True,
            )
            self.save(content_share)
            content_shares.append(content_share)
            self._session.flush()

        if do_notify:
            api = ContentApi(config=self._config, session=self._session, current_user=self._user)
            content_in_context = api.get_content_in_context(content)
            try:
                email_manager = self._get_email_manager(self._config, self._session)
                email_manager.notify__share__content(
                    emitter=self._user,
                    shared_content=content_in_context,
                    content_share_receivers=self.get_content_shares_in_context(content_shares),
                    share_password=password,
                )
            # FIXME - G.M - 2018-11-02 - hack: accept bad recipient user creation
            # this should be fixed to find a solution to allow "fake" email but
            # also have clear error case for valid mail.
            except SMTPRecipientsRefused:
                logger.warning(
                    self,
                    "Share initied by user {} but "
                    "SMTP server refuse to send notification ".format(self._user.login),
                )
            except SMTPException as exc:
                raise NotificationSendingFailed(
                    "Notification for shared file can't be send " "(SMTP error)."
                ) from exc
        return content_shares

    def _get_email_manager(self, config: CFG, session: Session) -> ShareEmailManager:
        """
        :return: EmailManager instance
        """
        smtp_config = SmtpConfiguration(
            config.EMAIL__NOTIFICATION__SMTP__SERVER,
            config.EMAIL__NOTIFICATION__SMTP__PORT,
            config.EMAIL__NOTIFICATION__SMTP__USER,
            config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
            config.EMAIL__NOTIFICATION__SMTP__ENCRYPTION,
            config.EMAIL__NOTIFICATION__SMTP__AUTHENTICATION,
        )

        return ShareEmailManager(config=config, smtp_config=smtp_config, session=session)

    def get_content_shares(self, content: Content) -> typing.List[ContentShare]:
        return self.base_query().filter(ContentShare.content_id == content.content_id).all()

    def get_content_share_in_context(self, content_share: ContentShare) -> ContentShareInContext:
        return ContentShareInContext(content_share, self._session, self._config, self._user)

    def get_content_shares_in_context(
        self, content_shares: typing.List[ContentShare]
    ) -> typing.List[ContentShareInContext]:
        content_shares_in_context = []
        for content_share in content_shares:
            content_shares_in_context.append(self.get_content_share_in_context(content_share))
        return content_shares_in_context

    def get_content_share_by_token(self, share_token: str) -> ContentShare:
        try:
            return self.base_query().filter(ContentShare.share_token == share_token).one()
        except NoResultFound as exc:
            raise ContentShareNotFound(
                'Content Share with token "{}" not found in database'.format(share_token)
            ) from exc

    def check_password(self, content_share: ContentShare, password: typing.Optional[str]) -> None:
        """
        Check password if content_share has password. If there is a content_share password, it
        will check and raise WrongSharePassword Exception in case password given
        doesn't match content_check one.
        :param content_share: contentShare to check.
        :param password: cleartext password
        :return: None
        """
        if content_share.password:
            if not password or not content_share.validate_password(password):
                raise WrongSharePassword(
                    'given password for  Share "{}" of content "{}" is incorrect'.format(
                        content_share.share_id, content_share.content_id
                    )
                )

    def get_content_share(self, content: Content, share_id: int) -> ContentShare:
        try:
            return (
                self.base_query()
                .filter(ContentShare.content_id == content.content_id)
                .filter(ContentShare.share_id == share_id)
                .one()  # type: ContentShare
            )  # INFO - GM - 2020-04-02 - do not put typing here, black error : https://github.com/psf/black/issues/1329
        except NoResultFound as exc:
            raise ContentShareNotFound(
                'Content Share "{}" not found in database'.format(share_id)
            ) from exc

    def disable_content_share(self, content: Content, share_id: int) -> ContentShare:
        content_share_to_disable = self.get_content_share(content, share_id)
        content_share_to_disable.disabled = datetime.now()
        content_share_to_disable.enabled = False
        self.save(content_share=content_share_to_disable)
        return content_share_to_disable

    def frontend_url(self, content_share: ContentShare) -> str:
        frontend_ui_base_url = get_frontend_ui_base_url(config=self._config)
        return FRONTEND_SHARED_CONTENT_LINK_PATTERN.format(
            frontend_ui_base_url=frontend_ui_base_url, share_token=content_share.share_token
        )

    def direct_api_url(self, content_share: ContentShare) -> str:
        content_api = ContentApi(
            config=self._config, session=self._session, current_user=self._user
        )
        content = content_api.get_one(
            content_id=content_share.content_id, content_type=content_type_list.Any_SLUG
        )

        return PUBLIC_API_SHARED_CONTENT_LINK_PATTERN.format(
            api_base_url=self._config.WEBSITE__BASE_URL,
            base_public_api=BASE_PUBLIC_API,
            share_token=content_share.share_token,
            filename=quote(core_convert_file_name_to_display(content.file_name)),
        )

    def save(self, content_share: ContentShare) -> ContentShare:
        self._session.add(content_share)
        return content_share
