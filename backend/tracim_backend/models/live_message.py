# -*- coding: utf-8 -*-
"""
Live messages/events related model.

It's perfectly fine to re-use this definition in the tracim application,
though.
"""
from datetime import datetime
import enum

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.types import DateTime
from sqlalchemy.types import Enum
from sqlalchemy.types import Integer

from tracim_backend.models.meta import DeclarativeBase


class OperationType(enum.Enum):
    CREATED = "created"
    MODIFIED = "modified"
    DELETED = "deleted"


class EntityType(enum.Enum):
    USER = "user"
    WORKSPACE = "workspace"
    WORKSPACE_USER_ROLE = "workspace_user_role"
    CONTENT = "content"
    AGENDA = "agenda"


ALLOWED_ENTITY_OPERATION_COMBINATIONS = (
    (EntityType.USER, OperationType.CREATED),
    (EntityType.USER, OperationType.MODIFIED),
    (EntityType.USER, OperationType.DELETED),
    (EntityType.WORKSPACE, OperationType.CREATED),
    (EntityType.WORKSPACE, OperationType.MODIFIED),
    (EntityType.WORKSPACE, OperationType.DELETED),
    (EntityType.WORKSPACE_USER_ROLE, OperationType.CREATED),
    (EntityType.WORKSPACE_USER_ROLE, OperationType.MODIFIED),
    (EntityType.WORKSPACE_USER_ROLE, OperationType.DELETED),
)


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

    @property
    def event_type(self) -> str:
        return "{}.{}".format(self.entity_type.value, self.operation.value)

    def __repr__(self):
        return "<Event: type=%s, created_date=%s, fields=%s>" % (
            repr(self.event_type),
            repr(self.created),
            repr(self.fields),
        )


class Message(DeclarativeBase):
    """
    Message definition.
    """

    __tablename__ = "messages"

    event_id = Column(Integer, ForeignKey("events.event_id"), primary_key=True)
    receiver_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    sent = Column(DateTime)
    read = Column(DateTime)

    event = relationship(Event)
