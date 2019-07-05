import typing

from sqlalchemy.orm import Session

from tracim_backend import CFG
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User


class ContentApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(
        self,
        current_user: typing.Optional[User] = None,
        show_active: bool = True,
        show_deleted: bool = False,
        show_archived: bool = False,
    ) -> ContentApi:
        return ContentApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
            show_active=show_active,
            show_deleted=show_deleted,
            show_archived=show_archived,
        )


class WorkspaceApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(
        self, current_user: typing.Optional[User] = None, show_deleted: bool = False
    ) -> WorkspaceApi:
        return WorkspaceApi(
            session=self.session,
            config=self.app_config,
            show_deleted=show_deleted,
            current_user=current_user or self.admin_user,
        )


class GroupApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> GroupApi:
        return GroupApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class RoleApiFactory(object):
    def __init__(self, session: Session, app_config: CFG, admin_user: User):
        self.session = session
        self.app_config = app_config
        self.admin_user = admin_user

    def get(self, current_user: typing.Optional[User] = None) -> RoleApi:
        return RoleApi(
            session=self.session,
            config=self.app_config,
            current_user=current_user or self.admin_user,
        )


class ApplicationApiFactory(object):
    def __init__(self, app_list):
        self.app_list = app_list

    def get(self):
        return ApplicationApi(self.app_list)
