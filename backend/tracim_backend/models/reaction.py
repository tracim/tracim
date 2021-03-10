from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy import Unicode
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import Integer

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin


class Reaction(CreationDateMixin, DeclarativeBase):
    __tablename__ = "reaction"
    __table_args__ = (UniqueConstraint("author_id", "content_id", "value"),)
    MAX_REACTION_VALUE_LENGTH = 255

    reaction_id = Column(
        Integer, Sequence("seq__reaction__reaction_id"), autoincrement=True, primary_key=True
    )
    content_id = Column(
        Integer, ForeignKey("content.id", onupdate="CASCADE", ondelete="CASCADE",), nullable=False,
    )
    value = Column(Unicode(MAX_REACTION_VALUE_LENGTH), nullable=False)
    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    author = relationship("User", remote_side=[User.user_id])

    def __repr__(self):
        return "<Reaction(author_id=%s, content_id=%s, value=%s)>" % (
            repr(self.author_id),
            repr(self.content_id),
            repr(self.value),
        )
