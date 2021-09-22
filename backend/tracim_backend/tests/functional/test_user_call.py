import typing

import pytest
import transaction

from tracim_backend.config import CFG
from tracim_backend.error import ErrorCode
from tracim_backend.lib.core.call import CallLib
from tracim_backend.models.auth import User
from tracim_backend.models.call import UserCall
from tracim_backend.models.call import UserCallState
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import EventHelper


@pytest.fixture
def one_call(bob_user: User, riyad_user: User, session: TracimSession, app_config: CFG) -> UserCall:
    bob_lib = CallLib(session, app_config, bob_user)
    call = bob_lib.create(riyad_user.user_id)
    transaction.commit()
    return call


@pytest.fixture
def two_calls(
    bob_user: User, riyad_user: User, admin_user: User, session: TracimSession, app_config: CFG
) -> typing.Tuple[UserCall, UserCall]:
    """Create two calls.
    """
    bob_lib = CallLib(session, app_config, bob_user)
    call_1 = bob_lib.create(riyad_user.user_id)
    call_2 = bob_lib.create(admin_user.user_id)

    riyad_lib = CallLib(session, app_config, riyad_user)
    riyad_lib.update_call_state(call_1.call_id, UserCallState.ACCEPTED)

    transaction.commit()
    return call_1, call_2


@pytest.fixture
def three_users(
    bob_user: User, riyad_user: User, admin_user: User
) -> typing.Tuple[User, User, User]:
    return (bob_user, riyad_user, admin_user)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test_with_call"}], indirect=True)
class TestUserCallEndpoint(object):
    """
    Tests for /api/users/{user_id}/outgoing_calls and /api/users/{user_id}/incoming_calls
    endpoints
    """

    @pytest.mark.parametrize(
        "user_index,query,expected_item_count",
        [(0, "", 2), (1, "", 0), (2, "", 0), (0, "?state=accepted", 1)],
    )
    def test_api__get_outgoing_calls__ok_200__nominal_cases(
        self,
        web_testapp,
        two_calls: typing.Tuple[UserCall, UserCall],
        three_users: typing.Tuple[User, User, User],
        user_index: int,
        query: str,
        expected_item_count: int,
    ) -> None:
        (call_1, call_2) = two_calls
        user = three_users[user_index]
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/users/{user_id}/outgoing_calls{query}"
        res = web_testapp.get(url.format(user_id=user.user_id, query=query), status=200,)
        assert len(res.json["items"]) == expected_item_count

    @pytest.mark.parametrize(
        "user_index,query,expected_item_count",
        [(0, "", 0), (1, "", 1), (2, "", 1), (1, "?state=accepted", 1)],
    )
    def test_api__get_incoming_calls__ok_200__nominal_cases(
        self,
        web_testapp,
        two_calls: typing.Tuple[UserCall, UserCall],
        three_users: typing.Tuple[User, User, User],
        user_index: int,
        query: str,
        expected_item_count: int,
    ) -> None:
        (call_1, call_2) = two_calls
        user = three_users[user_index]
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/users/{user_id}/incoming_calls{query}"
        res = web_testapp.get(url.format(user_id=user.user_id, query=query), status=200,)
        assert len(res.json["items"]) == expected_item_count

    def test_api__create_call__ok_200_nominal_case(
        self,
        web_testapp,
        bob_user: User,
        riyad_user: User,
        app_config: CFG,
        event_helper: EventHelper,
    ) -> None:
        web_testapp.authorization = ("Basic", (bob_user.username, "password"))
        url = "/api/users/{user_id}/outgoing_calls"
        res = web_testapp.post_json(
            url.format(user_id=bob_user.user_id),
            params={"callee_id": riyad_user.user_id},
            status=200,
        )
        assert res.json["call_id"] == 1
        assert res.json["callee"] == {
            "has_avatar": False,
            "has_cover": False,
            "public_name": "Riyad Faisal",
            "user_id": 3,
            "username": "riyad",
        }
        assert res.json["caller"] == {
            "has_avatar": False,
            "has_cover": False,
            "public_name": "bob",
            "user_id": 2,
            "username": "bob",
        }
        assert res.json["state"] == "in_progress"
        assert res.json["url"].startswith(app_config.CALL__JITSI_URL)
        assert "created" in res.json
        assert "modified" in res.json

        event = event_helper.last_event
        assert event.event_type == "user_call.created"
        assert event.user_call == res.json
        assert event.author == res.json["caller"]
        assert event.user == res.json["callee"]

    @pytest.mark.parametrize(
        "user_attr,put_name,new_state",
        [
            ("caller", "outgoing_calls", "cancelled"),
            ("caller", "outgoing_calls", "unanswered"),
            ("callee", "incoming_calls", "accepted"),
            ("callee", "incoming_calls", "rejected"),
            ("callee", "incoming_calls", "postponed"),
            ("callee", "incoming_calls", "declined"),
        ],
    )
    def test_api__update_call_state_ok_200_nominal_cases(
        self,
        web_testapp,
        event_helper: EventHelper,
        one_call: UserCall,
        user_attr: str,
        put_name: str,
        new_state: str,
    ) -> None:
        user = getattr(one_call, user_attr)
        web_testapp.authorization = ("Basic", (user.username, "password"))
        url = "/api/users/{user_id}/{put_name}/{call_id}/state"
        res = web_testapp.put_json(
            url.format(user_id=user.user_id, call_id=one_call.call_id, put_name=put_name),
            params={"state": new_state},
            status=200,
        )
        assert res.json["state"] == new_state

        event = event_helper.last_event
        assert event.event_type == "user_call.modified"
        assert event.user_call == res.json
        assert event.author == res.json[user_attr]
        assert event.user == res.json["callee"]

    @pytest.mark.parametrize(
        "user_attr,put_name,new_state",
        [
            ("callee", "outgoing_calls", "cancelled"),
            ("callee", "outgoing_calls", "unanswered"),
            ("caller", "incoming_calls", "accepted"),
            ("caller", "incoming_calls", "rejected"),
            ("caller", "incoming_calls", "postponed"),
            ("caller", "incoming_calls", "declined"),
        ],
    )
    def test_api__update_call_state_ok__400__transition_not_allowed(
        self, web_testapp, one_call: UserCall, user_attr: str, put_name: str, new_state: str,
    ) -> None:
        user = getattr(one_call, user_attr)
        web_testapp.authorization = ("Basic", (user.username, "password"))
        url = "/api/users/{user_id}/{put_name}/{call_id}/state"
        res = web_testapp.put_json(
            url.format(user_id=user.user_id, call_id=one_call.call_id, put_name=put_name),
            params={"state": new_state},
            status=400,
        )
        assert res.json["code"] == ErrorCode.USER_CALL_TRANSITION_NOT_ALLOWED

    @pytest.mark.parametrize(
        "authorization, method, path, status",
        [
            (None, "GET", "/api/users/{user_id}/outgoing_calls", 401),
            (("Basic", ("riyad", "password")), "GET", "/api/users/{user_id}/outgoing_calls", 403),
            (None, "GET", "/api/users/{user_id}/incoming_calls", 401),
            (("Basic", ("riyad", "password")), "GET", "/api/users/{user_id}/incoming_calls", 403),
            (None, "PUT", "/api/users/{user_id}/outgoing_calls/{call_id}/state", 401),
            (
                ("Basic", ("riyad", "password")),
                "PUT",
                "/api/users/{user_id}/outgoing_calls/{call_id}/state",
                403,
            ),
        ],
    )
    def test_api_check_authorization__err__40x_unauthorized(
        self,
        web_testapp,
        bob_user: User,
        one_call,
        authorization: typing.Optional[tuple],
        method: str,
        path: str,
        status: int,
    ) -> None:
        web_testapp.authorization = authorization
        web_testapp.request(
            path.format(user_id=bob_user.user_id, call_id=one_call.call_id),
            method=method,
            status=status,
        )
