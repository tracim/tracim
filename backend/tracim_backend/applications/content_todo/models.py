# coding=utf-8
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy.orm import relationship
from sqlalchemy.types import Integer

from tracim_backend.models.data import Content
from tracim_backend.models.data import User
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin


class Todo(CreationDateMixin, DeclarativeBase):
    MAX_TAG_NAME_LENGTH = 255
    MIN_TAG_NAME_LENGTH = 1

    __tablename__ = "todo"

    todo_id = Column(Integer, Sequence("seq__todo__todo_id"), autoincrement=True, primary_key=True)
    content_id = Column(
        Integer, ForeignKey("content.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False,
    )
    assignee_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    content = relationship("Content", remote_side=[Content.id], lazy="joined")
    assignee = relationship("User", remote_side=[User.user_id])

    def __repr__(self):
        return "<Todo(content_id=%s, assignee_id=%s)>" % (
            repr(self.content_id),
            repr(self.assignee_id),
        )
