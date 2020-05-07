import typing

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.models.auth import User
from tracim_backend.models.data import Workspace
from tracim_backend.models.live_message import EntityType
from tracim_backend.models.live_message import Event
from tracim_backend.models.live_message import OperationType
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema


class EventBuilder:

    _user_schema = UserDigestSchema()
    _workspace_schema = WorkspaceDigestSchema()

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
        self._on_user_op(OperationType.CREATED, user, db_session)

    @hookimpl
    def on_user_modified(self, user: User, db_session: TracimSession) -> None:
        if user.is_deleted:
            self._on_user_op(OperationType.DELETED, user, db_session)
        else:
            self._on_user_op(OperationType.MODIFIED, user, db_session)

    def _on_user_op(self, operation: OperationType, user: User, db_session: TracimSession) -> None:
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
        self._on_workspace_op(OperationType.CREATED, workspace, db_session)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, db_session: TracimSession) -> None:
        if workspace.is_deleted:
            self._on_workspace_op(OperationType.DELETED, workspace, db_session)
        else:
            self._on_workspace_op(OperationType.MODIFIED, workspace, db_session)

    def _on_workspace_op(
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

    def _publish_event(self, event: Event) -> None:
        # TODO S.G 20200507: add the RQ job(s) here
        logger.debug(self, "publish event {}".format(event))
