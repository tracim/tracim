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


class CallProvider(enum.Enum):
    NONE = ""
    JITSI_MEET = "jitsi_meet"


class UserCallState(enum.Enum):

    # Initial state
    IN_PROGRESS = "in_progress"

    # Callee state changes
    ACCEPTED = "accepted"  # when the callee accepts the call
    REJECTED = "rejected"  # when the called closes the call
    DECLINED = "declined"  # when the callee refuses the call
    POSTPONED = "postponed"  # when the callee answers "call you later"

    # Caller state changes
    CANCELLED = "cancelled"  # when the caller cancels the call
    UNANSWERED = "unanswered"  # when the called doesn't answer the call after some time


class UserCall(CreationDateMixin, UpdateDateMixin, DeclarativeBase):
    __tablename__ = "user_calls"

    CALLER_STATES = (UserCallState.CANCELLED, UserCallState.UNANSWERED)
    CALLEE_STATES = (
        UserCallState.ACCEPTED,
        UserCallState.REJECTED,
        UserCallState.DECLINED,
        UserCallState.POSTPONED,
    )

    call_id = Column(Integer, Sequence("seq__usercall__id"), autoincrement=True, primary_key=True)
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
        return "<UserCall: caller_id={}, callee_id={}, state={}, url={}>".format(
            self.caller_id, self.callee_id, self.state, self.url
        )
