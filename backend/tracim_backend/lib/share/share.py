from datetime import datetime
import typing
import uuid

from sqlalchemy.orm import Query
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.exceptions import WrongSharePassword
from tracim_backend.lib.utils.utils import get_frontend_ui_base_url
from tracim_backend.models.auth import User
from tracim_backend.models.content_share import ContentShare
from tracim_backend.models.content_share import ContentShareType
from tracim_backend.models.context_models import ContentShareInContext
from tracim_backend.models.data import Content
from tracim_backend.views import BASE_PUBLIC_API_V2

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
        self, content: Content, emails: typing.List[str], password: typing.Optional[str] = None
    ) -> typing.List[ContentShare]:
        content_shares = []
        created = datetime.now()
        share_group_id = str(uuid.uuid4())
        for email in emails:
            content_share = ContentShare(
                author=self._user,
                content_id=content.content_id,
                email=email,
                share_token=str(uuid.uuid4()),
                password=password,
                type=ContentShareType.EMAIL,
                created=created,
                share_group_id=share_group_id,
                enabled=True,
            )
            self.save(content_share)
            content_shares.append(content_share)
            self._session.flush()
        return content_shares

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

    def get_content_share_by_token(self, share_token: str):
        return (
            self._session.query(ContentShare).filter(ContentShare.share_token == share_token).one()
        )

    def check_password(self, content_share: ContentShare, password: typing.Optional[str]) -> None:
        if content_share.password:
            if not password or not content_share.validate_password(password):
                raise WrongSharePassword(
                    'given password for  Share "{}" of content "{}" is incorrect'.format(
                        content_share.share_id, content_share.content.content_id
                    )
                )

    def get_content_share(self, content: Content, share_id: int) -> ContentShare:
        return (
            self.base_query()
            .filter(ContentShare.content_id == content.content_id)
            .filter(ContentShare.share_id == share_id)
            .one()
        )  # type: ContentShare

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
        return PUBLIC_API_SHARED_CONTENT_LINK_PATTERN.format(
            api_base_url=self._config.WEBSITE__BASE_URL,
            base_public_api=BASE_PUBLIC_API_V2,
            share_token=content_share.share_token,
            filename=content_share.content.file_name,
        )

    def save(self, content_share: ContentShare) -> ContentShare:
        self._session.add(content_share)
        return content_share
