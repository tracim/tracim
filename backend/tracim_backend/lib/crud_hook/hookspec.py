from tracim_backend.lib.core.plugins import hookspec
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.tracim_session import TracimSession


class DatabaseCrudHookSpec:
    """Hook specifications for crud operations on tracim entities:
    - User
    - Content
    - Workspace
    - UserRoleInWorkspace
    """

    @hookspec
    def on_user_created(self, user: User, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_user_modified(self, user: User, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_user_deleted(self, user: User, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_workspace_created(self, workspace: Workspace, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_workspace_modified(self, workspace: Workspace, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_workspace_deleted(self, workspace: Workspace, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        ...

    @hookspec
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        ...

    @hookspec
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        ...

    @hookspec
    def on_content_created(self, content: Content, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_content_modified(self, content: Content, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_content_deleted(self, content: Content, db_session: TracimSession) -> None:
        ...

    @hookspec
    def on_content_revision_created(self, content: Content, db_session: TracimSession) -> None:
        ...
