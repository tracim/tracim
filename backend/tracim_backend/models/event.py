# -*- coding: utf-8 -*-
"""Live messages/events related models."""

from datetime import datetime
import enum
import typing

from marshmallow import ValidationError
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Index
from sqlalchemy import Sequence
from sqlalchemy.ext.indexable import index_property
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.types import DateTime
from sqlalchemy.types import Enum
from sqlalchemy.types import Integer
from sqlalchemy.types import String

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin

ANY_OPERATION_SYMBOL = "*"


class OperationType(enum.Enum):
    CREATED = "created"
    MODIFIED = "modified"
    DELETED = "deleted"
    UNDELETED = "undeleted"

    def __str__(self) -> str:
        return self.value

    @classmethod
    def values(cls) -> typing.List[str]:
        return [e.value for e in cls]


class EntityType(enum.Enum):
    USER = "user"
    WORKSPACE = "workspace"
    WORKSPACE_MEMBER = "workspace_member"
    WORKSPACE_SUBSCRIPTION = "workspace_subscription"
    CONTENT = "content"
    MENTION = "mention"
    REACTION = "reaction"

    def __str__(self) -> str:
        return self.value

    @classmethod
    def values(cls) -> typing.List[str]:
        return [e.value for e in cls]


class EventTypeDatabaseParameters:
    def __init__(
        self,
        entity: EntityType,
        operation: typing.Optional[OperationType],
        subtype: typing.Optional[str],
    ) -> None:
        self.entity = entity
        self.operation = operation
        self.subtype = subtype

    @staticmethod
    def from_event_type(event_type: str) -> "EventTypeDatabaseParameters":
        """
        Helper to convert event_type string as real used parameters in
        database
        """
        event_type_data = event_type.split(".")
        if len(event_type_data) > 3:
            raise ValidationError("event_type should have 1, 2 to 3 part")
        if len(event_type_data) < 2:
            event_type_data.append(None)
        if len(event_type_data) < 3:
            event_type_data.append(None)
        entity_str = event_type_data[0]
        operation_str = event_type_data[1]
        subtype = event_type_data[2]

        try:
            entity = EntityType(entity_str)
        except ValueError as e:
            raise ValidationError(
                'entity "{}" is not a valid entity type'.format(entity_str)
            ) from e

        operation = None
        if operation_str and operation_str != ANY_OPERATION_SYMBOL:
            try:
                operation = OperationType(operation_str)
            except ValueError as e:
                raise ValidationError(
                    'operation "{}" is not a valid operation type'.format(operation_str)
                ) from e

        return EventTypeDatabaseParameters(entity, operation, subtype)


class ReadStatus(enum.Enum):
    ALL = "all"
    READ = "read"
    UNREAD = "unread"

    def __str__(self) -> str:
        return self.value

    @classmethod
    def values(cls) -> typing.List[str]:
        return [e.value for e in cls]


class Event(CreationDateMixin, DeclarativeBase):
    """
    Event definition.
    """

    USER_FIELD = "user"
    AUTHOR_FIELD = "author"
    CLIENT_TOKEN_FIELD = "client_token"
    WORKSPACE_FIELD = "workspace"
    CONTENT_FIELD = "content"
    MEMBER_FIELD = "member"
    SUBSCRIPTION_FIELD = "subscription"
    REACTION_FIELD = "reaction"

    _ENTITY_SUBTYPE_LENGTH = 100
    __tablename__ = "events"

    event_id = Column(
        Integer, Sequence("seq__events__event_id"), autoincrement=True, primary_key=True
    )
    operation = Column(Enum(OperationType), nullable=False)
    entity_type = Column(Enum(EntityType), nullable=False)
    entity_subtype = Column(String(length=_ENTITY_SUBTYPE_LENGTH), nullable=True, default=None)
    fields = Column(JSON, nullable=False)

    # easier access to values stored in fields
    author = index_property("fields", AUTHOR_FIELD)
    workspace = index_property("fields", WORKSPACE_FIELD)
    user = index_property("fields", USER_FIELD)
    content = index_property("fields", CONTENT_FIELD)
    member = index_property("fields", MEMBER_FIELD)
    subscription = index_property("fields", SUBSCRIPTION_FIELD)
    client_token = index_property("fields", CLIENT_TOKEN_FIELD)
    reaction = index_property("fields", REACTION_FIELD)

    # INFO - SG - 2021-05-05
    # duplicated from fields.workspace.workspace_id to ease indexing of this value
    workspace_id = Column(Integer, default=None)

    @property
    def event_type(self) -> str:
        type_ = "{}.{}".format(self.entity_type.value, self.operation.value)
        if self.entity_subtype:
            type_ = "{}.{}".format(type_, self.entity_subtype)
        return type_

    def __repr__(self):
        return "<Event(event_id=%s, type=%s, created_date=%s, fields=%s)>" % (
            repr(self.event_id),
            repr(self.event_type),
            repr(self.created),
            repr(self.fields),
        )


Index("ix__events__event_id__workspace_id", Event.event_id, Event.workspace_id)


class Message(DeclarativeBase):
    """
    Message definition.
    """

    __tablename__ = "messages"

    receiver_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    event_id = Column(Integer, ForeignKey("events.event_id", ondelete="CASCADE"), primary_key=True)
    sent = Column(DateTime)
    read = Column(DateTime)

    event = relationship(Event)
    receiver = relationship(User)

    @property
    def fields(self) -> typing.Dict[str, typing.Any]:
        return self.event.fields

    @property
    def event_type(self) -> str:
        return self.event.event_type

    @property
    def created(self) -> datetime:
        return self.event.created
