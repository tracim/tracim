from datetime import datetime
import typing

from sqlalchemy.orm import Session

from tracim_backend.applications.share.models import ContentShare
from tracim_backend.config import CFG
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import UserInContext


class ContentShareInContext(object):
    def __init__(
        self, content_share: ContentShare, dbsession: Session, config: CFG, user: User = None
    ) -> None:
        self.content_share = content_share
        self.dbsession = dbsession
        self.config = config
        self._user = user

    @property
    def share_token(self) -> str:
        return self.content_share.share_token

    @property
    def content_id(self) -> int:
        return self.content_share.content_id

    @property
    def share_id(self) -> int:
        return self.content_share.share_id

    @property
    def share_group_id(self) -> str:
        return self.content_share.share_group_id

    @property
    def email(self) -> str:
        return self.content_share.email

    @property
    def has_password(self) -> bool:
        if self.content_share.password:
            return True
        return False

    @property
    def created(self) -> datetime:
        return self.content_share.created

    @property
    def is_disabled(self) -> bool:
        return not self.content_share.enabled

    @property
    def disabled(self) -> typing.Optional[datetime]:
        return self.content_share.disabled

    @property
    def type(self) -> str:
        return self.content_share.type.value

    @property
    def author_id(self) -> int:
        return self.content_share.author_id

    @property
    def url(self) -> str:
        # TODO - G.M - 2019-07-31 - import here to avoid recursive import.
        from tracim_backend.applications.share.lib import ShareLib

        api = ShareLib(config=self.config, session=self.dbsession, current_user=self._user)
        return api.frontend_url(self.content_share)

    @property
    def direct_url(self) -> str:
        # TODO - G.M - 2019-07-31 - import here to avoid recursive import.
        from tracim_backend.applications.share.lib import ShareLib

        api = ShareLib(config=self.config, session=self.dbsession, current_user=self._user)
        return api.direct_api_url(self.content_share)

    @property
    def content(self) -> ContentInContext:
        # TODO - G.M - 2019-07-31 - import here to avoid recursive import.
        from tracim_backend.lib.core.content import ContentApi

        content_api = ContentApi(config=self.config, session=self.dbsession, current_user=None)
        return content_api.get_content_in_context(self.content_share.content)

    @property
    def content_size(self) -> int:
        return self.content.size

    @property
    def content_label(self) -> str:
        """
        :return: label of content
        """
        return self.content.label

    @property
    def content_filename(self) -> str:
        """
        :return: label of content
        """
        return self.content.filename

    @property
    def content_file_extension(self) -> str:
        """
        :return: file extension with "." at the beginning, example : .txt
        """
        return self.content.file_extension

    @property
    def author(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession, config=self.config, user=self.content_share.author
        )
