import json

import pytest
import requests
import sseclient

from tracim_backend.error import ErrorCode
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestLivesMessages(object):
    def test_api__user_live_messages_endpoint_without_GRIP_proxy__ok_200__nominal_case(
        self, user_api_factory, web_testapp, admin_user
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/{}/live_messages".format(admin_user.user_id),
            status=200,
            headers={"Accept": "text/event-stream"},
        )
        assert res.headers["Content-Type"] == "text/event-stream"
        assert res.headers["Content-Length"] == "0"
        assert res.headers["Grip-Hold"] == "stream"
        assert res.headers["Grip-Channel"] == "user_{}".format(admin_user.user_id)
        assert res.headers["Cache-Control"] == "no-cache"

    def test_api__user_live_messages_endpoint_without_GRIP_proxy__err_400__no_accept_header(
        self, user_api_factory, web_testapp, admin_user
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/{}/live_messages".format(admin_user.user_id), status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__nominal_case(
        self, pushpin, app_config
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/v2/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        LiveMessagesLib(config=app_config).publish_dict("user_1", {"test_message": "example"})
        event1 = next(client.events())
        response.close()
        assert json.loads(event1.data) == {"test_message": "example"}
        assert event1.event == "message"

    @pytest.mark.parametrize("config_section", [{"name": "functional_live_test"}], indirect=True)
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update(
        self, pushpin, app_config
    ):

        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/v2/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        update_user_request = requests.put(
            "http://localhost:7999/api/v2/users/1",
            auth=("admin@admin.admin", "admin@admin.admin"),
            json=params,
        )
        assert update_user_request.status_code == 200
        event1 = next(client.events())
        response.close()
        result = json.loads(event1.data)
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["user"]
        assert result["fields"]["user"]["user_id"] == 1
        assert result["fields"]["author"]["user_id"] == 1
        assert result["fields"]["author"]
        assert result["event_type"] == "user.modified"
        assert event1.event == "message"

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_async_live_test"}], indirect=True
    )
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update__async(
        self, pushpin, app_config, rq_database_worker
    ):

        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/v2/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        update_user_request = requests.put(
            "http://localhost:7999/api/v2/users/1",
            auth=("admin@admin.admin", "admin@admin.admin"),
            json=params,
        )
        assert update_user_request.status_code == 200
        event1 = next(client.events())
        response.close()
        result = json.loads(event1.data)
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["user"]
        assert result["fields"]["user"]["user_id"] == 1
        assert result["fields"]["author"]["user_id"] == 1
        assert result["fields"]["author"]
        assert result["event_type"] == "user.modified"
        assert event1.event == "message"
