import typing

from tracim_backend.config import CFG
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceRoles
from tracim_backend.models.live_message import EntityType
from tracim_backend.models.live_message import Event
from tracim_backend.models.live_message import OperationType
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema


class EventBuilder:
    """Create Event objects from the database crud hooks."""

    _user_schema = UserDigestSchema()
    _workspace_schema = WorkspaceDigestSchema()
    _content_schema = ContentDigestSchema()

    def __init__(self, config: CFG) -> None:
        self._config = config
        self._current_user: typing.Optional[User] = None

    @hookimpl
    def on_current_user_set(self, user: User) -> None:
        self._current_user = user

    @hookimpl
    def on_request_finished(self) -> None:
        self._current_user = None

    # User events
    @hookimpl
    def on_user_created(self, user: User, db_session: TracimSession) -> None:
        self._create_user_event(OperationType.CREATED, user, db_session)

    @hookimpl
    def on_user_modified(self, user: User, db_session: TracimSession) -> None:
        if user.is_deleted:
            self._create_user_event(OperationType.DELETED, user, db_session)
        else:
            self._create_user_event(OperationType.MODIFIED, user, db_session)

    def _create_user_event(
        self, operation: OperationType, user: User, db_session: TracimSession
    ) -> None:
        fields = {
            "user": self._user_schema.dump(user).data,
            "author": self._user_schema.dump(self._current_user).data,
        }
        event = Event(entity_type=EntityType.USER, operation=operation, fields=fields)
        db_session.add(event)
        self._publish_event(event)

    # Workspace events
    @hookimpl
    def on_workspace_created(self, workspace: Workspace, db_session: TracimSession) -> None:
        self._create_workspace_event(OperationType.CREATED, workspace, db_session)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, db_session: TracimSession) -> None:
        if workspace.is_deleted:
            self._create_workspace_event(OperationType.DELETED, workspace, db_session)
        else:
            self._create_workspace_event(OperationType.MODIFIED, workspace, db_session)

    def _create_workspace_event(
        self, operation: OperationType, workspace: Workspace, db_session: TracimSession
    ) -> None:
        api = WorkspaceApi(db_session, self._current_user, self._config)
        workspace_in_context = api.get_workspace_with_context(workspace)
        fields = {
            "author": self._user_schema.dump(self._current_user).data,
            "workspace": self._workspace_schema.dump(workspace_in_context).data,
        }
        event = Event(entity_type=EntityType.WORKSPACE, operation=operation, fields=fields)
        db_session.add(event)
        self._publish_event(event)

    # Content events
    @hookimpl
    def on_content_created(self, content: Content, db_session: TracimSession) -> None:
        self._create_content_event(OperationType.CREATED, content, db_session)

    @hookimpl
    def on_content_modified(self, content: Content, db_session: TracimSession) -> None:
        if content.is_deleted:
            self._create_content_event(OperationType.DELETED, content, db_session)
        else:
            self._create_content_event(OperationType.MODIFIED, content, db_session)

    def _create_content_event(
        self, operation: OperationType, content: Content, db_session: TracimSession
    ) -> None:
        content_api = ContentApi(db_session, self._current_user, self._config)
        content_in_context = content_api.get_content_in_context(content)

        workspace_api = WorkspaceApi(db_session, self._current_user, self._config)
        workspace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(content_in_context.workspace_id)
        )
        fields = {
            "author": self._user_schema.dump(self._current_user).data,
            "content": self._content_schema.dump(content_in_context).data,
            "workspace": self._workspace_schema.dump(workspace_in_context).data,
        }
        event = Event(entity_type=EntityType.CONTENT, operation=operation, fields=fields)
        db_session.add(event)
        self._publish_event(event)

    # UserRoleInWorkspace events
    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        self._create_role_event(OperationType.CREATED, role, db_session)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        self._create_role_event(OperationType.MODIFIED, role, db_session)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        self._create_role_event(OperationType.DELETED, role, db_session)

    def _create_role_event(
        self, operation: OperationType, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        workspace_api = WorkspaceApi(db_session, self._current_user, self._config)
        workspace_in_context = workspace_api.get_workspace_with_context(role.workspace)
        user_api = UserApi(self._current_user, db_session, self._config)
        fields = {
            "author": self._user_schema.dump(self._current_user).data,
            "user": self._user_schema.dump(user_api.get_one(role.user_id)).data,
            "workspace": self._workspace_schema.dump(workspace_in_context).data,
            "role": WorkspaceRoles.get_role_from_level(role.role).label,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE_USER_ROLE, operation=operation, fields=fields
        )
        db_session.add(event)
        self._publish_event(event)

    def _publish_event(self, event: Event) -> None:
        # TODO S.G 20200507: add the RQ job(s) creation here
        logger.debug(self, "publish event {}".format(event))
