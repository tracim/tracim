import enum
import hashlib
import typing

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql import literal

from tracim_backend.models.auth import User
from tracim_backend.models.call import UserCall
from tracim_backend.models.call import UserCallState
from tracim_backend.models.tracim_session import TracimSession

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class UserCallProvider(enum.Enum):
    NONE = ""
    JITSI = "jitsi"


class UserCallLib:
    def __init__(self, session: TracimSession, config: "CFG", current_user: User) -> None:
        self._session = session
        self._config = config
        self._user = current_user

    def create(self, callee_id: int) -> UserCall:
        call = UserCall(caller_id=self._user.user_id, callee_id=callee_id)
        call.url = self._create_call_url(call)
        self._session.add(call)
        self._session.flush()
        return call

    def update_call_state(self, call_id: int, state: UserCallState) -> UserCall:
        call = self.get_one(call_id)
        if call.state != UserCallState.IN_PROGRESS:
            raise Exception("Cannot change the state of a call if it is not in progress")
        if state != UserCallState.CANCELLED and self._user.user_id == call.caller_id:
            raise Exception("Only callee can change state to {}".format(state))
        if state == UserCallState.CANCELLED and self._user.user_id == call.callee_id:
            raise Exception("Only caller can change state to {}".format(state))
        call.state = state
        self._session.flush()
        return call

    def get_all(
        self,
        user_id: int,
        state: typing.Optional[UserCallState] = None,
        caller: typing.Optional[bool] = None,
    ) -> typing.List[UserCall]:
        query = self._session.query(UserCall).filter(literal(user_id).in_(UserCall.user_ids))
        if caller is True:
            query = query.filter(UserCall.caller_id == user_id)
        if caller is False:
            query = query.filter(UserCall.callee_id == user_id)

        if state:
            query = query.filter(UserCall.state == state)
        breakpoint()
        return query.order_by(UserCall.id).all()

    def get_one(self, user_id: int, call_id: int) -> UserCall:
        try:
            return (
                self._session.query(UserCall)
                .filter(UserCall.id == call_id)
                .filter(literal(user_id).in_(UserCall.user_ids))
                .one()
            )
        except NoResultFound:
            raise Exception("BOO!!!!")

    def _create_call_url(self, call: UserCall) -> str:
        assert self._config.USER_CALL__ENABLED
        assert self._config.USER_CALL__PROVIDER == UserCallProvider.JITSI
        base_url = self._config.USER_CALL__JITSI_URL
        h = hashlib.sha256()
        h.update(str(call.caller_id).encode())
        h.update(str(call.callee_id).encode())
        return "{}-{}".format(base_url, h.hexdigest())
