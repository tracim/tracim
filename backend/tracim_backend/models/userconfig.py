from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.types import Integer

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase


class UserConfig(DeclarativeBase):
    """
    User Config definition.
    This table stores parameters for Tracim clients (including the Tracim frontend)
    """

    __tablename__ = "user_configs"

    user_id = Column(
        Integer,
        ForeignKey(
            "users.user_id",
            name="fk_userconfig_user_id_users",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        nullable=False,
        primary_key=True,
    )

    user = relationship("User", remote_side=[User.user_id])

    fields = Column(JSON, nullable=False, default={})

    def __repr__(self):
        return "<UserConfig(user_id=%s, fields=%s)>" % (repr(self.user_id), repr(self.fields),)
