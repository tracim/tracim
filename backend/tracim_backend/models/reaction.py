from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy import Unicode
from sqlalchemy import UniqueConstraint
from sqlalchemy.types import Integer

from tracim_backend.models.auth import OwnerMixin
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin


class Reaction(OwnerMixin, CreationDateMixin, DeclarativeBase):
    __tablename__ = "reaction"
    __table_args__ = (UniqueConstraint("owner_id", "content_id", "value"),)
    MAX_REACTION_VALUE_LENGTH = 255

    reaction_id = Column(
        Integer, Sequence("seq__reaction__reaction_id"), autoincrement=True, primary_key=True
    )
    content_id = Column(
        Integer,
        ForeignKey("content.id", onupdate="CASCADE", ondelete="CASCADE",),
        nullable=False,
        primary_key=True,
    )
    value = Column(Unicode(MAX_REACTION_VALUE_LENGTH), nullable=False)

    def __repr__(self):
        return "<Reaction(owner_id=%s, content_id=%s, value=%s)>" % (
            repr(self.owner_id),
            repr(self.content_id),
            repr(self.value),
        )
