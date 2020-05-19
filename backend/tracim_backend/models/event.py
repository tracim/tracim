# -*- coding: utf-8 -*-
"""Live messages/events related models."""

from datetime import datetime
import enum
import typing

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy.ext.indexable import index_property
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.types import DateTime
from sqlalchemy.types import Enum
from sqlalchemy.types import Integer

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase


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
    WORKSPACE_USER_ROLE = "workspace_user_role"
    CONTENT = "content"

    def __str__(self) -> str:
        return self.value

    @classmethod
    def values(cls) -> typing.List[str]:
        return [e.value for e in cls]


class ReadStatus(enum.Enum):
    ALL = "all"
    READ = "read"
    UNREAD = "unread"

    def __str__(self) -> str:
        return self.value

    @classmethod
    def values(cls) -> typing.List[str]:
        return [e.value for e in cls]


class Event(DeclarativeBase):
    """
    Event definition.
    """

    __tablename__ = "events"

    event_id = Column(Integer, autoincrement=True, primary_key=True)
    operation = Column(Enum(OperationType), nullable=False)
    entity_type = Column(Enum(EntityType), nullable=False)
    created = Column(DateTime, nullable=False, default=datetime.utcnow)
    fields = Column(JSON, nullable=False)

    # easier access to values stored in fields
    author = index_property("fields", "author")
    workspace = index_property("fields", "workspace")
    user = index_property("fields", "user")
    content = index_property("fields", "content")
    role = index_property("fields", "role")

    @property
    def event_type(self) -> str:
        return "{}.{}".format(self.entity_type.value, self.operation.value)

    def __repr__(self):
        return "<Event(event_id=%s, type=%s, created_date=%s, fields=%s)>" % (
            repr(self.event_id),
            repr(self.event_type),
            repr(self.created),
            repr(self.fields),
        )


class Message(DeclarativeBase):
    """
    Message definition.
    """

    __tablename__ = "messages"

    receiver_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    event_id = Column(Integer, ForeignKey("events.event_id"), primary_key=True)
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
