from typing import Optional

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

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, primary_key=True)
    user = relationship("User", remote_side=[User.user_id])

    fields = Column(JSON, nullable=False, default={})

    def __init__(self, user: User, fields: Optional[JSON] = None):
        self.user_id = user.user_id
        self.fields = fields or {}

    def __repr__(self):
        return "<UserConfig(user_id=%s, fields=%s)>" % (repr(self.user_id), repr(self.fields),)
