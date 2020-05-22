from datetime import datetime
import typing

from sqlalchemy import event
from sqlalchemy import inspect
from sqlalchemy import null
from sqlalchemy.orm import joinedload

from tracim_backend.config import CFG
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceRoles
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import Message
from tracim_backend.models.event import OperationType
from tracim_backend.models.event import ReadStatus
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import EventSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema

_USER_FIELD = "user"
_AUTHOR_FIELD = "author"
_WORKSPACE_FIELD = "workspace"
_CONTENT_FIELD = "content"
_ROLE_FIELD = "role"


RQ_QUEUE_NAME = "event"


class EventApi:
    """Api to query event & messages"""

    def __init__(self, current_user: User, session: TracimSession, config: CFG) -> None:
        self._current_user = current_user
        self._session = session
        self._config = config

    def get_messages_for_user(self, user_id: int, read_status: ReadStatus) -> typing.List[Message]:
        query = (
            self._session.query(Message)
            .filter(Message.receiver_id == user_id)
            .options(joinedload(Message.event))
        )
        if read_status == ReadStatus.READ:
            query = query.filter(Message.read != null())
        elif read_status == ReadStatus.UNREAD:
            query = query.filter(Message.read == null())
        else:
            # ALL doesn't need any filtering an is the only other handled case
            assert read_status == ReadStatus.ALL
        return query.all()


class EventBuilder:
    """Create Event objects from the database crud hooks."""

    _user_schema = UserSchema()
    _workspace_schema = WorkspaceSchema()
    _content_schema = ContentSchema()
    _event_schema = EventSchema()

    def __init__(self, config: CFG) -> None:
        self._config = config
        self._current_user = None  # type: typing.Optional[User]

    @hookimpl
    def on_current_user_set(self, user: User) -> None:
        self._current_user = user

    @hookimpl
    def on_request_session_created(self, request: TracimRequest, session: TracimSession) -> None:
        event.listen(session, "pending_to_persistent", self._publish_event)

    @hookimpl
    def on_request_finished(self) -> None:
        self._current_user = None

    # User events
    @hookimpl
    def on_user_created(self, user: User, db_session: TracimSession) -> None:
        self._create_user_event(OperationType.CREATED, user, db_session)

    @hookimpl
    def on_user_modified(self, user: User, db_session: TracimSession) -> None:
        if self._has_just_been_deleted(user):
            self._create_user_event(OperationType.DELETED, user, db_session)
        elif self._has_just_been_undeleted(user):
            self._create_user_event(OperationType.UNDELETED, user, db_session)
        else:
            self._create_user_event(OperationType.MODIFIED, user, db_session)

    def _create_user_event(
        self, operation: OperationType, user: User, db_session: TracimSession
    ) -> None:
        user_api = UserApi(self._current_user, db_session, self._config, show_deleted=True)
        fields = {
            _AUTHOR_FIELD: self._user_schema.dump(
                user_api.get_user_with_context(self._current_user)
            ).data,
            _USER_FIELD: self._user_schema.dump(user_api.get_user_with_context(user)).data,
        }
        event = Event(entity_type=EntityType.USER, operation=operation, fields=fields)
        db_session.add(event)

    # Workspace events
    @hookimpl
    def on_workspace_created(self, workspace: Workspace, db_session: TracimSession) -> None:
        self._create_workspace_event(OperationType.CREATED, workspace, db_session)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, db_session: TracimSession) -> None:
        if self._has_just_been_deleted(workspace):
            self._create_workspace_event(OperationType.DELETED, workspace, db_session)
        elif self._has_just_been_undeleted(workspace):
            self._create_workspace_event(OperationType.UNDELETED, workspace, db_session)
        else:
            self._create_workspace_event(OperationType.MODIFIED, workspace, db_session)

    def _create_workspace_event(
        self, operation: OperationType, workspace: Workspace, db_session: TracimSession
    ) -> None:
        api = WorkspaceApi(db_session, self._current_user, self._config)
        user_api = UserApi(self._current_user, db_session, self._config, show_deleted=True)
        workspace_in_context = api.get_workspace_with_context(workspace)
        fields = {
            _AUTHOR_FIELD: self._user_schema.dump(
                user_api.get_user_with_context(self._current_user)
            ).data,
            _WORKSPACE_FIELD: self._workspace_schema.dump(workspace_in_context).data,
        }
        event = Event(entity_type=EntityType.WORKSPACE, operation=operation, fields=fields)
        db_session.add(event)

    # Content events
    @hookimpl
    def on_content_created(self, content: Content, db_session: TracimSession) -> None:
        self._create_content_event(OperationType.CREATED, content, db_session)

    @hookimpl
    def on_content_modified(self, content: Content, db_session: TracimSession) -> None:
        if self._has_just_been_deleted(content.current_revision):
            self._create_content_event(OperationType.DELETED, content, db_session)
        elif self._has_just_been_undeleted(content.current_revision):
            self._create_content_event(OperationType.UNDELETED, content, db_session)
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
        user_api = UserApi(self._current_user, db_session, self._config, show_deleted=True)
        fields = {
            _AUTHOR_FIELD: self._user_schema.dump(
                user_api.get_user_with_context(self._current_user)
            ).data,
            _CONTENT_FIELD: self._content_schema.dump(content_in_context).data,
            _WORKSPACE_FIELD: self._workspace_schema.dump(workspace_in_context).data,
        }
        event = Event(entity_type=EntityType.CONTENT, operation=operation, fields=fields)
        db_session.add(event)

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
        user_api = UserApi(self._current_user, db_session, self._config, show_deleted=True)

        try:
            user_field = self._user_schema.dump(
                user_api.get_user_with_context(user_api.get_one(role.user_id))
            ).data
        except UserDoesNotExist:
            # It is possible to have an already deleted user when deleting his roles.
            user_field = None

        fields = {
            _AUTHOR_FIELD: self._user_schema.dump(
                user_api.get_user_with_context(self._current_user)
            ).data,
            _USER_FIELD: user_field,
            _WORKSPACE_FIELD: self._workspace_schema.dump(workspace_in_context).data,
            _ROLE_FIELD: WorkspaceRoles.get_role_from_level(role.role).label,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE_USER_ROLE, operation=operation, fields=fields
        )
        db_session.add(event)

    def _publish_event(self, db_session: TracimSession, instance: object) -> None:
        if not isinstance(instance, Event):
            return
        event = typing.cast(Event, instance)
        LiveMessageBuilder.session = db_session
        LiveMessageBuilder.config = self._config
        # TODO - G.M - 2020-05-15 - this parameter should be renamed, it's not email-related anymore
        if self._config.EMAIL__PROCESSING_MODE == self._config.CST.ASYNC:
            redis_connection = get_redis_connection(self._config)
            queue = get_rq_queue(redis_connection, RQ_QUEUE_NAME)
            logger.debug(self, "publish event {} to RQ queue {}".format(event, RQ_QUEUE_NAME))
            queue.enqueue(LiveMessageBuilder.publish_messages_for_event, event.event_id)
        else:
            logger.debug(self, "publish event {} synchronously".format(event))
            LiveMessageBuilder.publish_messages_for_event(event.event_id)

    def _has_just_been_deleted(self, obj: typing.Union[User, Workspace, ContentRevisionRO]) -> bool:
        """Check that an object has been deleted since it has been queried from database."""
        if obj.is_deleted:
            history = inspect(obj).attrs.is_deleted.history
            return history.has_changes()
        return False

    def _has_just_been_undeleted(
        self, obj: typing.Union[User, Workspace, ContentRevisionRO]
    ) -> bool:
        """Check whether an object has been undeleted since queried from database."""
        if not obj.is_deleted:
            history = inspect(obj).attrs.is_deleted.history
            return history.has_changes()
        return False


class LiveMessageBuilder:

    _event_schema = EventSchema()
    session = None
    config = None

    @classmethod
    def _session(cls) -> TracimSession:
        # TODO S.G 2020-05-07: acquire this from the RQ worker's context
        assert cls.session
        return cls.session

    @classmethod
    def _config(cls) -> CFG:
        # TODO SG 2020-05-07: acquire this from the RQ worker's context
        assert cls.config
        return cls.config

    @classmethod
    def publish_messages_for_event(cls, event_id: int) -> None:
        event = cls._session().query(Event).filter(Event.event_id == event_id).one()
        if event.entity_type == EntityType.USER:
            receiver_ids = cls._get_user_event_receiver_ids(event)
        elif event.entity_type == EntityType.WORKSPACE:
            receiver_ids = cls._get_workspace_event_receiver_ids(event)
        elif event.entity_type == EntityType.CONTENT:
            receiver_ids = cls._get_workspace_event_receiver_ids(event)
        elif event.entity_type == EntityType.WORKSPACE_USER_ROLE:
            receiver_ids = cls._get_user_event_receiver_ids(event)

        messages = [
            Message(
                receiver_id=receiver_id,
                event=event,
                event_id=event.event_id,
                sent=datetime.utcnow(),
            )
            for receiver_id in receiver_ids
        ]
        cls._session().add_all(messages)
        live_message_lib = LiveMessagesLib(cls.config)
        for message in messages:
            live_message_lib.publish_message_to_user(message)

    @classmethod
    def _get_user_event_receiver_ids(cls, event: Event) -> typing.Set[int]:
        user_api = UserApi(current_user=None, session=cls._session(), config=cls._config())
        receiver_ids = set(user_api.get_user_ids_from_profile(Profile.ADMIN))
        if event.user:
            receiver_ids.add(event.user["user_id"])
        return receiver_ids

    @classmethod
    def _get_workspace_event_receiver_ids(cls, event: Event) -> typing.Set[int]:
        user_api = UserApi(current_user=None, session=cls._session(), config=cls._config())
        administrators = user_api.get_user_ids_from_profile(Profile.ADMIN)
        role_api = RoleApi(current_user=None, session=cls._session(), config=cls._config())
        workspace_members = role_api.get_workspace_member_ids(event.workspace["workspace_id"])
        return set(administrators + workspace_members)
