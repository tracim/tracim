import abc
import contextlib
from datetime import datetime
from typing import Any
from typing import Callable
from typing import Dict
from typing import Generator
from typing import Iterable
from typing import List
from typing import Optional
from typing import Set
from typing import Union

from sqlakeyset import Page
from sqlakeyset import get_page
from sqlalchemy import and_
from sqlalchemy import cast
from sqlalchemy import event as sqlalchemy_event
from sqlalchemy import inspect
from sqlalchemy import not_
from sqlalchemy import null
from sqlalchemy import or_
from sqlalchemy.orm import Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.expression import text
from sqlalchemy.types import String

from tracim_backend.app_models.contents import COMMENT_TYPE
from tracim_backend.app_models.contents import FILE_TYPE
from tracim_backend.app_models.contents import FOLDER_TYPE
from tracim_backend.app_models.contents import HTML_DOCUMENTS_TYPE
from tracim_backend.app_models.contents import THREAD_TYPE
from tracim_backend.config import CFG
from tracim_backend.exceptions import MessageDoesNotExist
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.lib.rq.worker import worker_context
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.lib.utils.utils import DEFAULT_NB_ITEM_PAGINATION
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.data import WorkspaceSubscription
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import EventTypeDatabaseParameters
from tracim_backend.models.event import Message
from tracim_backend.models.event import OperationType
from tracim_backend.models.event import ReadStatus
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.views.core_api.schemas import CommentSchema
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import EventSchema
from tracim_backend.views.core_api.schemas import FileContentSchema
from tracim_backend.views.core_api.schemas import TextBasedContentSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema
from tracim_backend.views.core_api.schemas import WorkspaceSubscriptionSchema

RQ_QUEUE_NAME = "event"

JsonDict = Dict[str, Any]


class EventApi:
    """Api to query event & messages"""

    user_schema = UserSchema()
    workspace_schema = WorkspaceSchema()
    content_schemas = {
        COMMENT_TYPE: CommentSchema(),
        HTML_DOCUMENTS_TYPE: TextBasedContentSchema(),
        FILE_TYPE: FileContentSchema(),
        FOLDER_TYPE: TextBasedContentSchema(),
        THREAD_TYPE: TextBasedContentSchema(),
    }
    event_schema = EventSchema()
    workspace_user_role_schema = WorkspaceMemberDigestSchema()
    workspace_subscription_schema = WorkspaceSubscriptionSchema()

    def __init__(self, current_user: Optional[User], session: TracimSession, config: CFG) -> None:
        self._current_user = current_user
        self._session = session
        self._config = config

    def _filter_event_types(
        self, query: Query, event_types: Optional[List[EventTypeDatabaseParameters]], exclude: bool
    ) -> Query:
        if event_types:
            event_type_filters = []
            for event_type in event_types:
                if event_type.subtype:
                    event_type_filter = and_(
                        Event.entity_type == event_type.entity,
                        Event.operation == event_type.operation,
                        Event.entity_subtype == event_type.subtype,
                    )
                else:
                    event_type_filter = and_(
                        Event.entity_type == event_type.entity,
                        Event.operation == event_type.operation,
                    )

                event_type_filters.append(event_type_filter)

            if len(event_type_filters) > 1:
                f = or_(*event_type_filters)
            else:
                f = event_type_filters[0]

            if exclude:
                f = not_(f)

            return query.filter(f)

        return query

    def _base_query(
        self,
        read_status: ReadStatus = ReadStatus.ALL,
        event_id: Optional[int] = None,
        user_id: Optional[int] = None,
        include_event_types: List[EventTypeDatabaseParameters] = None,
        exclude_event_types: List[EventTypeDatabaseParameters] = None,
        exclude_author_ids: Optional[List[int]] = None,
        after_event_id: int = 0,
        workspace_ids: Optional[List[str]] = None,
        include_not_sent=False,
    ) -> Query:
        query = self._session.query(Message).join(Event)
        if workspace_ids:
            query = query.filter(
                Event.fields[Event.WORKSPACE_FIELD]["workspace_id"].as_integer().in_(workspace_ids)
            )
        if not include_not_sent:
            query = query.filter(Message.sent != None)  # noqa: E711
        if event_id:
            query = query.filter(Message.event_id == event_id)
        if user_id:
            query = query.filter(Message.receiver_id == user_id)
        if read_status == ReadStatus.READ:
            query = query.filter(Message.read != null())
        elif read_status == ReadStatus.UNREAD:
            query = query.filter(Message.read == null())
        else:
            # ALL doesn't need any filtering and is the only other handled case
            assert read_status == ReadStatus.ALL

        query = self._filter_event_types(query, include_event_types, False)
        query = self._filter_event_types(query, exclude_event_types, True)

        if exclude_event_types:
            event_type_filters = []
            for event_type in exclude_event_types:
                if event_type.subtype:
                    event_type_filter = or_(
                        Event.entity_type != event_type.entity,
                        Event.operation != event_type.operation,
                        Event.entity_subtype != event_type.subtype,
                    )
                else:
                    event_type_filter = or_(
                        Event.entity_type != event_type.entity,
                        Event.operation != event_type.operation,
                    )

                event_type_filters.append(event_type_filter)

            if len(event_type_filters) > 1:
                query = query.filter(and_(*event_type_filters))
            else:
                query = query.filter(event_type_filters[0])

        if exclude_author_ids:
            for author_id in exclude_author_ids:
                # RJ & SG - 2020-09-11 - HACK
                # We wanted to use Event.fields["author"] == JSON.NULL instead of this
                # soup involving a cast and a get out of my way text("'null'") to
                # know whether a JSON field is null. However, this does not work on
                # PostgreSQL. See https://github.com/sqlalchemy/sqlalchemy/issues/5575

                query = query.filter(
                    or_(
                        cast(Event.fields["author"], String) == text("'null'"),
                        Event.fields["author"]["user_id"].as_integer() != author_id,
                    )
                )

        if after_event_id:
            query = query.filter(Message.event_id > after_event_id)
        return query

    def get_one_message(self, event_id: int, user_id: int) -> Message:
        try:
            return self._base_query(event_id=event_id, user_id=user_id).one()
        except NoResultFound as exc:
            raise MessageDoesNotExist(
                'Message for user {} with event id "{}" not found in database'.format(
                    user_id, event_id
                )
            ) from exc

    def mark_user_message_as_read(self, event_id: int, user_id: int) -> Message:
        message = self.get_one_message(event_id, user_id)
        message.read = datetime.utcnow()
        self._session.add(message)
        self._session.flush()
        return message

    def mark_user_message_as_unread(self, event_id: int, user_id: int) -> Message:
        message = self.get_one_message(event_id, user_id)
        message.read = None
        self._session.add(message)
        self._session.flush()
        return message

    def mark_user_messages_as_read(self, user_id: int) -> List[Message]:
        unread_messages = self._base_query(read_status=ReadStatus.UNREAD, user_id=user_id).all()
        for message in unread_messages:
            message.read = datetime.utcnow()
            self._session.add(message)
        self._session.flush()
        return unread_messages

    def get_messages_for_user(self, user_id: int, after_event_id: int = 0) -> List[Message]:
        query = self._base_query(user_id=user_id, after_event_id=after_event_id,)
        return query.all()

    def get_paginated_messages_for_user(
        self,
        user_id: int,
        read_status: ReadStatus,
        exclude_author_ids: List[int] = None,
        include_event_types: List[EventTypeDatabaseParameters] = None,
        exclude_event_types: List[EventTypeDatabaseParameters] = None,
        count: Optional[int] = DEFAULT_NB_ITEM_PAGINATION,
        page_token: Optional[int] = None,
        workspace_ids: Optional[List[str]] = None,
        include_not_sent: bool = False,
    ) -> Page:
        query = self._base_query(
            user_id=user_id,
            read_status=read_status,
            include_event_types=include_event_types,
            exclude_event_types=exclude_event_types,
            exclude_author_ids=exclude_author_ids,
            workspace_ids=workspace_ids,
            include_not_sent=include_not_sent,
        ).order_by(Message.event_id.desc())
        return get_page(query, per_page=count, page=page_token or False)

    def get_messages_count(
        self,
        user_id: int,
        read_status: ReadStatus,
        include_event_types: List[EventTypeDatabaseParameters] = None,
        exclude_event_types: List[EventTypeDatabaseParameters] = None,
        exclude_author_ids: List[int] = None,
        workspace_ids: Optional[List[str]] = None,
        include_not_sent=False,
    ) -> int:
        return self._base_query(
            user_id=user_id,
            include_event_types=include_event_types,
            exclude_event_types=exclude_event_types,
            read_status=read_status,
            exclude_author_ids=exclude_author_ids,
            include_not_sent=include_not_sent,
        ).count()

    def create_event(
        self,
        entity_type: EntityType,
        operation: OperationType,
        additional_fields: Dict[str, JsonDict],
        context: TracimContext,
        entity_subtype: Optional[str] = None,
    ) -> Event:
        current_user = context.safe_current_user()
        user_api = UserApi(
            current_user=current_user,
            session=context.dbsession,
            config=self._config,
            show_deleted=True,
        )
        if current_user:
            author = self.user_schema.dump(user_api.get_user_with_context(current_user)).data
        else:
            author = None
        fields = {
            Event.AUTHOR_FIELD: author,
            Event.CLIENT_TOKEN_FIELD: context.client_token,
        }
        fields.update(additional_fields)
        event = Event(
            entity_type=entity_type,
            operation=operation,
            entity_subtype=entity_subtype,
            fields=fields,
        )
        context.dbsession.add(event)
        context.pending_events.append(event)
        return event

    @classmethod
    def get_content_schema_for_type(cls, content_type: str) -> ContentSchema:
        try:
            return cls.content_schemas[content_type]
        except KeyError:
            logger.error(
                cls,
                (
                    "Cannot dump proper content for content-type '{}' in generated event "
                    "as it is unknown, falling back to generic content schema"
                ).format(content_type),
            )
            return ContentSchema()


class EventPublisher:
    """Publish events added in context when the corresponding db session is flushed/commited."""

    # pluggy uses this attribute to name the plugin
    __name__ = "EventPublisher"

    def __init__(self, config: CFG) -> None:
        self._config = config

    @hookimpl
    def on_context_session_created(self, db_session: TracimSession, context: TracimContext) -> None:
        """Listen for db session events (flush/commit) to publish TLMs
        for events added during the given context."""
        commit_event = "after_flush"
        if self._config.JOBS__PROCESSING_MODE == CFG.CST.ASYNC:
            # We need after commit event when processing in async
            # Otherwise we can't be sure that events will be visible
            # to the RQ worker when it queries the database.
            commit_event = "after_commit"

        processing_mode = self._config.JOBS__PROCESSING_MODE

        def publish(session: TracimSession, flush_context=None) -> None:
            EventPublisher._publish_pending_events_of_context(processing_mode, context.dbsession)

        sqlalchemy_event.listen(db_session, commit_event, publish)

    @staticmethod
    def _publish_pending_events_of_context(
        processing_mode: CFG.CST, session: TracimSession
    ) -> None:
        """Publish TLMs for events added in this session/context.

        Only events which have been flushed to the database (thus having an id) are published.
        """

        # NOTE SGD 2020-06-30: do not keep a reference on the context
        # as this would lead to keep all of them in memory
        context = session.context

        if processing_mode == CFG.CST.ASYNC:
            message_builder = AsyncLiveMessageBuilder(
                context=context
            )  # type: BaseLiveMessageBuilder
        else:
            message_builder = SyncLiveMessageBuilder(context=context)

        # We only publish events that have an event_id from the DB.
        # we can have `new` events here as we add events in the session
        # in a `after_flush` sqlalchemy event and `_publish_events` is also
        # called during the same `after_flush` event (when PROCESSING_MODE is `sync`).
        new_events = []
        for event in context.pending_events:
            if event.event_id:
                message_builder.publish_messages_for_event(event.event_id)
            else:
                new_events.append(event)
        context.pending_events = new_events


class EventBuilder:
    """Create Event objects from the database crud hooks."""

    # pluggy uses this attribute to name the plugin
    __name__ = "EventBuilder"

    def __init__(self, config: CFG) -> None:
        self._config = config

    # User events
    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        self._create_user_event(OperationType.CREATED, user, context)

    @hookimpl
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        if self._has_just_been_deleted(user):
            self._create_user_event(OperationType.DELETED, user, context)
        elif self._has_just_been_undeleted(user):
            self._create_user_event(OperationType.UNDELETED, user, context)
        else:
            self._create_user_event(OperationType.MODIFIED, user, context)

    def _create_user_event(
        self, operation: OperationType, user: User, context: TracimContext
    ) -> None:
        current_user = context.safe_current_user()
        user_api = UserApi(
            current_user=current_user,
            session=context.dbsession,
            config=self._config,
            show_deleted=True,
        )
        fields = {
            Event.USER_FIELD: EventApi.user_schema.dump(user_api.get_user_with_context(user)).data
        }
        event_api = EventApi(current_user, context.dbsession, self._config)
        event_api.create_event(
            entity_type=EntityType.USER,
            operation=operation,
            additional_fields=fields,
            context=context,
        )

    # Workspace events
    @hookimpl
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        self._create_workspace_event(OperationType.CREATED, workspace, context)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:
        if self._has_just_been_deleted(workspace):
            self._create_workspace_event(OperationType.DELETED, workspace, context)
        elif self._has_just_been_undeleted(workspace):
            self._create_workspace_event(OperationType.UNDELETED, workspace, context)
        else:
            self._create_workspace_event(OperationType.MODIFIED, workspace, context)

    def _create_workspace_event(
        self, operation: OperationType, workspace: Workspace, context: TracimContext
    ) -> None:
        current_user = context.safe_current_user()
        api = WorkspaceApi(
            current_user=current_user, session=context.dbsession, config=self._config
        )
        workspace_in_context = api.get_workspace_with_context(workspace)
        fields = {Event.WORKSPACE_FIELD: EventApi.workspace_schema.dump(workspace_in_context).data}
        event_api = EventApi(current_user, context.dbsession, self._config)
        event_api.create_event(
            entity_type=EntityType.WORKSPACE,
            operation=operation,
            additional_fields=fields,
            context=context,
        )

    # Content events
    @hookimpl
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        self._create_content_event(OperationType.CREATED, content, context)

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        if content.current_revision.revision_type == ActionDescription.DELETION:
            self._create_content_event(OperationType.DELETED, content, context)
        elif content.current_revision.revision_type == ActionDescription.UNDELETION:
            self._create_content_event(OperationType.UNDELETED, content, context)
        else:
            self._create_content_event(OperationType.MODIFIED, content, context)

    def _create_content_event(
        self, operation: OperationType, content: Content, context: TracimContext
    ) -> None:
        current_user = context.safe_current_user()
        content_api = ContentApi(context.dbsession, current_user, self._config)
        content_in_context = content_api.get_content_in_context(content)
        content_schema = EventApi.get_content_schema_for_type(content.type)
        content_dict = content_schema.dump(content_in_context).data

        workspace_api = WorkspaceApi(
            context.dbsession, current_user, self._config, show_deleted=True
        )
        workspace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(content_in_context.workspace.workspace_id)
        )
        fields = {
            Event.CONTENT_FIELD: content_dict,
            Event.WORKSPACE_FIELD: EventApi.workspace_schema.dump(workspace_in_context).data,
        }
        event_api = EventApi(current_user, context.dbsession, self._config)
        event_api.create_event(
            entity_type=EntityType.CONTENT,
            operation=operation,
            additional_fields=fields,
            entity_subtype=content.type,
            context=context,
        )

    # UserRoleInWorkspace events
    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self._create_role_event(OperationType.CREATED, role, context)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self._create_role_event(OperationType.MODIFIED, role, context)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self._create_role_event(OperationType.DELETED, role, context)

    def _create_role_event(
        self, operation: OperationType, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        current_user = context.safe_current_user()
        workspace_api = WorkspaceApi(
            session=context.dbsession,
            config=self._config,
            show_deleted=True,
            # INFO - G.M - 2020-17-09 - we do explicitly don't set user here to not
            # have filter on workspace, in some case we do want user create event on workspace
            # he doesn't have access: when he remove itself from workspace for example
            current_user=None,
        )
        workspace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(role.workspace_id)
        )
        user_api = UserApi(current_user, context.dbsession, self._config, show_deleted=True)
        role_api = RoleApi(
            current_user=current_user, session=context.dbsession, config=self._config
        )
        try:
            user_field = EventApi.user_schema.dump(
                user_api.get_user_with_context(user_api.get_one(role.user_id))
            ).data
        except UserDoesNotExist:
            # It is possible to have an already deleted user when deleting his roles.
            user_field = None

        role_in_context = role_api.get_user_role_workspace_with_context(role)
        fields = {
            Event.USER_FIELD: user_field,
            Event.WORKSPACE_FIELD: EventApi.workspace_schema.dump(workspace_in_context).data,
            Event.MEMBER_FIELD: EventApi.workspace_user_role_schema.dump(role_in_context).data,
        }
        event_api = EventApi(current_user, context.dbsession, self._config)
        event_api.create_event(
            entity_type=EntityType.WORKSPACE_MEMBER,
            operation=operation,
            additional_fields=fields,
            context=context,
        )

    # WorkspaceSubscription events
    @hookimpl
    def on_workspace_subscription_created(
        self, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        self._create_subscription_event(OperationType.CREATED, subscription, context)

    @hookimpl
    def on_workspace_subscription_modified(
        self, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        self._create_subscription_event(OperationType.MODIFIED, subscription, context)

    @hookimpl
    def on_workspace_subscription_deleted(
        self, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        self._create_subscription_event(OperationType.DELETED, subscription, context)

    def _create_subscription_event(
        self, operation: OperationType, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        current_user = context.safe_current_user()
        workspace_api = WorkspaceApi(
            session=context.dbsession, config=self._config, current_user=None,
        )
        workspace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(subscription.workspace_id)
        )
        user_api = UserApi(current_user, context.dbsession, self._config, show_deleted=True)
        subscription_author_in_context = user_api.get_user_with_context(subscription.author)
        fields = {
            Event.WORKSPACE_FIELD: EventApi.workspace_schema.dump(workspace_in_context).data,
            Event.SUBSCRIPTION_FIELD: EventApi.workspace_subscription_schema.dump(
                subscription
            ).data,
            Event.USER_FIELD: EventApi.user_schema.dump(subscription_author_in_context).data,
        }
        event_api = EventApi(current_user, context.dbsession, self._config)
        event_api.create_event(
            entity_type=EntityType.WORKSPACE_SUBSCRIPTION,
            operation=operation,
            additional_fields=fields,
            context=context,
        )

    def _has_just_been_deleted(self, obj: Union[User, Workspace, ContentRevisionRO]) -> bool:
        """Check that an object has been deleted since it has been queried from database."""
        if obj.is_deleted:
            history = inspect(obj).attrs.is_deleted.history
            was_changed = not history.unchanged and (history.deleted or history.added)
            return was_changed
        return False

    def _has_just_been_undeleted(self, obj: Union[User, Workspace, ContentRevisionRO]) -> bool:
        """Check whether an object has been undeleted since queried from database."""
        if not obj.is_deleted:
            history = inspect(obj).attrs.is_deleted.history
            was_changed = not history.unchanged and (history.deleted or history.added)
            return was_changed
        return False


def _get_user_event_receiver_ids(event: Event, session: TracimSession, config: CFG) -> Set[int]:
    user_api = UserApi(current_user=event.user, session=session, config=config)
    receiver_ids = user_api.get_user_ids_from_profile(Profile.ADMIN)
    try:
        receiver_ids.append(event.user["user_id"])
        same_workspaces_user_ids = user_api.get_users_ids_in_same_workpaces(event.user["user_id"])
        receiver_ids = set(receiver_ids + same_workspaces_user_ids)
    except AttributeError:
        # no user in event
        pass
    return receiver_ids


def _get_members_and_administrators_ids(
    event: Event, session: TracimSession, config: CFG
) -> Set[int]:
    """
    Return administrators + members of the event's workspace + user subject of the action if there is one
    """
    user_api = UserApi(current_user=None, session=session, config=config)
    administrators = user_api.get_user_ids_from_profile(Profile.ADMIN)
    role_api = RoleApi(current_user=None, session=session, config=config)
    workspace_members = role_api.get_workspace_member_ids(event.workspace["workspace_id"])
    receiver_ids = set(administrators + workspace_members)
    try:
        receiver_ids.add(event.user["user_id"])
    except AttributeError:
        # no user in event
        pass
    return receiver_ids


def _get_workspace_event_receiver_ids(
    event: Event, session: TracimSession, config: CFG
) -> Set[int]:
    # Two cases: if workspace is accessible every user should get a message
    # If not, only administrators + members + user subject of the action (for user role events)
    if WorkspaceAccessType(event.workspace["access_type"]) in Workspace.ACCESSIBLE_TYPES:
        user_api = UserApi(current_user=None, session=session, config=config)
        receiver_ids = set(user.user_id for user in user_api.get_all())
    else:
        receiver_ids = _get_members_and_administrators_ids(event, session, config)
    return receiver_ids


def _get_workspace_subscription_event_receiver_ids(
    event: Event, session: TracimSession, config: CFG
) -> Set[int]:
    user_api = UserApi(current_user=None, session=session, config=config)
    administrators = user_api.get_user_ids_from_profile(Profile.ADMIN)
    author = event.subscription["author"]["user_id"]
    role_api = RoleApi(current_user=None, session=session, config=config)
    workspace_managers = role_api.get_workspace_member_ids(
        event.workspace["workspace_id"], min_role=WorkspaceRoles.WORKSPACE_MANAGER
    )
    return set(administrators + workspace_managers + [author])


def _get_content_event_receiver_ids(event: Event, session: TracimSession, config: CFG) -> Set[int]:
    role_api = RoleApi(current_user=None, session=session, config=config)
    workspace_members = role_api.get_workspace_member_ids(event.workspace["workspace_id"])
    return set(workspace_members)


GetReceiverIdsCallable = Callable[[Event, TracimSession, CFG], Iterable[int]]


class BaseLiveMessageBuilder(abc.ABC):
    """"Base class for message building with most implementation."""

    _event_schema = EventSchema()

    _get_receiver_ids_callables = {
        EntityType.USER: _get_user_event_receiver_ids,
        EntityType.WORKSPACE: _get_workspace_event_receiver_ids,
        EntityType.WORKSPACE_MEMBER: _get_members_and_administrators_ids,
        EntityType.CONTENT: _get_content_event_receiver_ids,
        EntityType.WORKSPACE_SUBSCRIPTION: _get_workspace_subscription_event_receiver_ids,
    }  # type: Dict[str, GetReceiverIdsCallable]

    def __init__(self, config: CFG) -> None:
        self._config = config

    @classmethod
    def register_entity_type(
        cls, entity_type: EntityType, get_receiver_ids_callable: GetReceiverIdsCallable
    ) -> None:
        """Register a function used to get receiver user ids for a given entity type."""
        cls._get_receiver_ids_callables[entity_type] = get_receiver_ids_callable

    @contextlib.contextmanager
    @abc.abstractmethod
    def context(self) -> Generator[TracimContext, None, None]:
        pass

    @abc.abstractmethod
    def publish_messages_for_event(self, event_id: int) -> None:
        pass

    def _publish_messages_for_event(self, event_id: int) -> None:
        with self.context() as context:
            session = context.dbsession
            event = session.query(Event).filter(Event.event_id == event_id).one()
            receiver_ids = self._get_receiver_ids(event, session)

            messages = [
                Message(
                    receiver_id=receiver_id,
                    event=event,
                    event_id=event.event_id,
                    sent=datetime.utcnow(),
                )
                for receiver_id in receiver_ids
            ]
            session.add_all(messages)
            live_message_lib = LiveMessagesLib(self._config)
            for message in messages:
                live_message_lib.publish_message_to_user(message)

    def _get_receiver_ids(self, event: Event, session: Session) -> Iterable[int]:
        try:
            get_receiver_ids = self._get_receiver_ids_callables[event.entity_type]
            return get_receiver_ids(event, session, self._config)
        except KeyError:
            raise ValueError("Unknown entity type {}".format(event.entity_type))


class AsyncLiveMessageBuilder(BaseLiveMessageBuilder):
    """"Live message building + sending executed in a RQ job."""

    def __init__(self, context: TracimContext) -> None:
        super().__init__(context.app_config)

    @contextlib.contextmanager
    def context(self) -> Generator[TracimContext, None, None]:
        with worker_context() as context:
            yield context

    def publish_messages_for_event(self, event_id: int) -> None:
        redis_connection = get_redis_connection(self._config)
        queue = get_rq_queue(redis_connection, RQ_QUEUE_NAME)
        logger.debug(
            self,
            "publish event(id={}) asynchronously to RQ queue {}".format(event_id, RQ_QUEUE_NAME),
        )
        queue.enqueue(self._publish_messages_for_event, event_id)


class SyncLiveMessageBuilder(BaseLiveMessageBuilder):
    """"Live message building + sending executed in tracim web application."""

    def __init__(self, context: TracimContext) -> None:
        super().__init__(context.app_config)
        self._context = context

    @contextlib.contextmanager
    def context(self) -> Generator[TracimContext, None, None]:
        yield self._context

    def publish_messages_for_event(self, event_id: int) -> None:
        logger.debug(self, "publish event(id={}) synchronously".format(event_id))
        self._publish_messages_for_event(event_id)
