import enum
import typing

from sqlalchemy import Column
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import Sequence
from sqlalchemy import String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from tracim_backend.models.auth import User
from tracim_backend.models.meta import DeclarativeBase
from tracim_backend.models.mixins import CreationDateMixin
from tracim_backend.models.mixins import UpdateDateMixin


class UserCallProvider(enum.Enum):
    NONE = ""
    JITSI = "jitsi"


class UserCallState(enum.Enum):

    # Initial state
    IN_PROGRESS = "in_progress"

    # Callee state changes
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    DECLINED = "declined"
    POSTPONED = "postponed"

    # Caller state changes
    CANCELLED = "cancelled"
    UNANSWERED = "unanswered"


class UserCall(CreationDateMixin, UpdateDateMixin, DeclarativeBase):
    __tablename__ = "user_calls"
    id = Column(Integer, Sequence("seq__usercall__id"), autoincrement=True, primary_key=True)
    caller_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    caller = relationship(User, remote_side=[User.user_id], foreign_keys=[caller_id])
    callee_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    callee = relationship(User, remote_side=[User.user_id], foreign_keys=[callee_id])
    state = Column(
        Enum(UserCallState), nullable=False, server_default=UserCallState.IN_PROGRESS.name,
    )
    url = Column(String, nullable=False)

    @hybrid_property
    def user_ids(self) -> typing.Tuple[int, int]:
        return (self.caller_id, self.callee_id)

    def __repr__(self):
        return "<UserCall: caller_id=%s, callee_id=%s, state=%s, url=%s>".format(
            self.caller_id, self.callee_id, self.state, self.url
        )
