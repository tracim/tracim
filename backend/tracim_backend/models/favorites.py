from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Unicode
from sqlalchemy.orm import relationship
from sqlalchemy.types import Integer

from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin


class FavoriteContent(CreationDateMixin, DeclarativeBase):
    __tablename__ = "favorite_contents"

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, primary_key=True)
    user = relationship("User", remote_side=[User.user_id], foreign_keys=[user_id])
    content_id = Column(
        Integer,
        ForeignKey("content.id", onupdate="CASCADE", ondelete="CASCADE",),
        nullable=False,
        primary_key=True,
    )
    content = relationship("Content", remote_side=[Content.id])

    # INFO - G.M - same type as ContentRevisionRO label, type field
    original_label = Column(Unicode(1024), unique=False, nullable=False)
    original_type = Column(Unicode(32), unique=False, nullable=False)

    def __repr__(self):
        return "<FavoriteContent(user_id=%s, content_id=%s)>" % (
            repr(self.user_id),
            repr(self.content_id),
        )
