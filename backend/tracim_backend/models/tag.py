from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy import Unicode
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.types import Integer

from tracim_backend.models.data import Content
from tracim_backend.models.data import User
from tracim_backend.models.data import Workspace
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin


class Tag(CreationDateMixin, DeclarativeBase):
    MAX_TAG_NAME_LENGTH = 255
    MIN_TAG_NAME_LENGTH = 1

    __tablename__ = "tag"
    __table_args__ = (UniqueConstraint("workspace_id", "tag_name"),)

    tag_id = Column(Integer, Sequence("seq__tag__tag_id"), autoincrement=True, primary_key=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.workspace_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    tag_name = Column(Unicode(length=MAX_TAG_NAME_LENGTH), nullable=False)

    workspace = relationship("Workspace", remote_side=[Workspace.workspace_id], lazy="joined")

    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    author = relationship("User", remote_side=[User.user_id])

    def __repr__(self):
        return "<Tag(workspace_id=%s, tag_name=%s)>" % (
            repr(self.workspace_id),
            repr(self.tag_name),
        )


class TagOnContent(CreationDateMixin, DeclarativeBase):
    __tablename__ = "content_tag"
    __table_args__ = (UniqueConstraint("tag_id", "content_id"),)

    tag_id = Column(
        Integer,
        ForeignKey("tag.tag_id", onupdate="CASCADE", ondelete="CASCADE",),
        primary_key=True,
    )

    content_id = Column(
        Integer,
        ForeignKey("content.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )

    author_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    author = relationship("User", remote_side=[User.user_id])

    content = relationship("Content", remote_side=[Content.id], lazy="joined", backref="tags")
    tag = relationship("Tag", remote_side=[Tag.tag_id], lazy="joined")

    def __repr__(self):
        return "<TagOnContent(tag_id=%s, content_id=%s)>" % (
            repr(self.tag_id),
            repr(self.content_id),
        )
