import hashlib
import typing

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql import literal

from tracim_backend.exceptions import UserCallNotFound
from tracim_backend.exceptions import UserCallTransitionNotAllowed
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import User
from tracim_backend.models.call import CallProvider
from tracim_backend.models.call import UserCall
from tracim_backend.models.call import UserCallState
from tracim_backend.models.tracim_session import TracimSession

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class CallLib:
    def __init__(self, session: TracimSession, config: "CFG", current_user: User) -> None:
        self._session = session
        self._config = config
        self._user = current_user

    def create(self, callee_id: int) -> UserCall:
        user_api = UserApi(session=self._session, config=self._config, current_user=self._user)
        call = UserCall(caller=self._user, callee=user_api.get_one(callee_id))
        call.url = self._create_call_url(call)
        self._session.add(call)
        self._session.flush()
        return call

    def update_call_state(self, call_id: int, state: UserCallState) -> UserCall:
        call = self.get_one(self._user.user_id, call_id)
        if call.state != UserCallState.IN_PROGRESS:
            raise UserCallTransitionNotAllowed(
                "Cannot change the state of a call if it is not in progress"
            )
        if state not in UserCall.CALLER_STATES and self._user.user_id == call.caller_id:
            raise UserCallTransitionNotAllowed("Only callee can change state to {}".format(state))
        if state not in UserCall.CALLEE_STATES and self._user.user_id == call.callee_id:
            raise UserCallTransitionNotAllowed("Only caller can change state to {}".format(state))
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
        return query.order_by(UserCall.call_id).all()

    def get_one(self, user_id: int, call_id: int) -> UserCall:
        try:
            return (
                self._session.query(UserCall)
                .filter(UserCall.call_id == call_id)
                .filter(literal(user_id).in_(UserCall.user_ids))
                .one()
            )
        except NoResultFound:
            raise UserCallNotFound(
                "Call of id {} for user {} doesn't exist".format(call_id, user_id)
            )

    def _create_call_url(self, call: UserCall) -> str:
        assert self._config.CALL__ENABLED
        # NOTE - 2021-11-12 - MP - Doesn't this assert that we are using Jitsi? What if
        # we desire to use another call provider?
        assert self._config.CALL__PROVIDER == CallProvider.JITSI_MEET
        base_url = self._config.CALL__JITSI_MEET__URL
        # Sort the ids so that the generated hash is always the same for a pair of ids.
        sorted_ids = sorted((call.caller.user_id, call.callee.user_id))
        h = hashlib.sha256()
        for user_id in sorted_ids:
            h.update(str(user_id).encode())
        return "{}/tracim-{}".format(base_url, h.hexdigest())
