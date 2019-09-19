from datetime import datetime
import typing

from sqlalchemy.orm import Session

from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.config import CFG
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.utils import EmailUser
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.context_models import WorkspaceInContext


class UploadPermissionInContext(object):
    def __init__(
        self,
        upload_permission: UploadPermission,
        dbsession: Session,
        config: CFG,
        user: User = None,
    ) -> None:
        self.upload_permission = upload_permission
        self.dbsession = dbsession
        self.config = config
        self._user = user

    @property
    def email_user(self) -> EmailUser:
        return EmailUser(user_email=self.upload_permission.email)

    @property
    def workspace_id(self) -> int:
        return self.upload_permission.workspace_id

    @property
    def upload_permission_id(self) -> int:
        return self.upload_permission.upload_permission_id

    @property
    def upload_permission_group_uuid(self) -> str:
        return self.upload_permission.upload_permission_group_uuid

    @property
    def email(self) -> str:
        return self.upload_permission.email

    @property
    def token(self) -> str:
        return self.upload_permission.token

    @property
    def has_password(self) -> bool:
        if self.upload_permission.password:
            return True
        return False

    @property
    def created(self) -> datetime:
        return self.upload_permission.created

    @property
    def is_disabled(self) -> bool:
        return not self.upload_permission.enabled

    @property
    def disabled(self) -> typing.Optional[datetime]:
        return self.upload_permission.disabled

    @property
    def type(self) -> str:
        return self.upload_permission.type.value

    @property
    def author_id(self) -> int:
        return self.upload_permission.author_id

    @property
    def url(self) -> str:
        # TODO - G.M - 2019-07-31 - import here to avoid recursive import.
        from tracim_backend.applications.upload_permissions.lib import UploadPermissionLib

        api = UploadPermissionLib(
            config=self.config, session=self.dbsession, current_user=self._user
        )
        return api.frontend_url(self.upload_permission)

    @property
    def workspace(self) -> WorkspaceInContext:
        workspace_api = WorkspaceApi(config=self.config, session=self.dbsession, current_user=None)
        return workspace_api.get_workspace_with_context(self.upload_permission.workspace)

    @property
    def author(self) -> UserInContext:
        return UserInContext(
            dbsession=self.dbsession, config=self.config, user=self.upload_permission.author
        )
