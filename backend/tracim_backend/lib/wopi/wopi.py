import typing

from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.lib.utils.utils import wopi_convert_file_name_to_display
from tracim_backend.lib.wopi.models import WopiCheckFileInfo
from tracim_backend.lib.wopi.models import WopiLastModifiedTime
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.roles import WorkspaceRoles


class WopiLib(object):
    """
    Manager providing methods to allow support of WOPI protocol
    """

    def __init__(self, current_user: typing.Optional[User], session: Session, config: CFG) -> None:
        self._session = session
        self._user = current_user
        self._config = config

    def check_file_info(self, content: Content) -> WopiCheckFileInfo:
        size = 0
        if content.depot_file.file:
            size = content.depot_file.file.content_length
        user_can_write = bool(
            content.workspace.get_user_role(self._user) >= WorkspaceRoles.CONTRIBUTOR.level
        )
        return WopiCheckFileInfo(
            last_modified_time=content.updated,
            base_file_name=wopi_convert_file_name_to_display(content.file_name),
            size=size,
            owner_id=content.owner_id,
            user_id=self._user.user_id,
            user_friendly_name=self._user.display_name,
            user_can_write=user_can_write,
            version=content.revision_id,
            user_can_not_write_relative=True,
        )

    def last_modified_time(self, content: Content) -> WopiLastModifiedTime:
        return WopiLastModifiedTime(last_modified_time=content.updated)
