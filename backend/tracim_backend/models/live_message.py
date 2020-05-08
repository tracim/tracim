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
from sqlalchemy.ext.indexable import index_property
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
