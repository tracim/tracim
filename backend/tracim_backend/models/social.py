from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy.orm import relationship

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase


class UserFollower(DeclarativeBase):
    __tablename__ = "user_followers"

    follower_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, primary_key=True)
    follower = relationship("User", remote_side=[User.user_id], foreign_keys=[follower_id])
    leader_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, primary_key=True)
    leader = relationship("User", remote_side=[User.user_id], foreign_keys=[leader_id])
    created_date = Column(DateTime, unique=False, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return "<UserFollower: follower_id=%s, leader_id=%s>".format(
            self.follower_id, self.leader_id
        )
