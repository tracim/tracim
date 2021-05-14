import json

import pytest
import requests
import sseclient
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.models.data import Content
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def html_document(
    workspace_api_factory, content_api_factory, session, label, raw_content
) -> Content:
    workspace_api = workspace_api_factory.get()
    workspace = workspace_api.create_workspace(label="Foobar")
    content_api = content_api_factory.get()

    # NOTE: MySQL and MariaDB have a maximum of 65536 bytes for description,
    # so the size is chosen accordingly
    if session.connection().dialect.name in ("mysql", "mariadb"):
        raw_content = 65000 * "a"
    else:
        raw_content = 2000000 * "a"
    html_document = content_api.create(
        content_type_slug="html-document",
        workspace=workspace,
        label=label,
        do_save=True,
        do_notify=False,
    )
    with new_revision(session=session, tm=transaction.manager, content=html_document):
        content_api.update_content(html_document, new_raw_content=raw_content, new_label=label)
        content_api.save(html_document)
    transaction.commit()
    return html_document


@pytest.fixture
def big_html_document(workspace_api_factory, content_api_factory, session) -> Content:
    # NOTE: MySQL and MariaDB have a maximum of 65536 bytes for description,
    # so the size is chosen accordingly
    if session.connection().dialect.name in ("mysql", "mariadb"):
        description = 65000 * "a"
    else:
        description = 2000000 * "a"

    return html_document(
        workspace_api_factory, content_api_factory, session, "Big document", description
    )


def small_html_document(workspace_api_factory, content_api_factory, session, name) -> Content:
    return html_document(
        workspace_api_factory, content_api_factory, session, "Small document " + name, name
    )


@pytest.fixture
def small_html_document_a(workspace_api_factory, content_api_factory, session) -> Content:
    return small_html_document(workspace_api_factory, content_api_factory, session, "A")


@pytest.fixture
def small_html_document_b(workspace_api_factory, content_api_factory, session) -> Content:
    return small_html_document(workspace_api_factory, content_api_factory, session, "B")


@pytest.fixture
def small_html_document_c(workspace_api_factory, content_api_factory, session) -> Content:
    return small_html_document(workspace_api_factory, content_api_factory, session, "C")


def put_document(doc):
    update_user_request = requests.put(
        "http://localhost:7999/api/workspaces/{}/html-documents/{}/status".format(
            doc.workspace_id, doc.content_id
        ),
        auth=("admin@admin.admin", "admin@admin.admin"),
        json={"status": "closed-validated"},
    )
    return update_user_request.status_code


@pytest.fixture
def one_thread(content_api_factory, content_type_list, workspace_api_factory, session) -> Content:
    workspace_api = workspace_api_factory.get()
    workspace = workspace_api.create_workspace(label="test workspace", save_now=True)
    content_api = content_api_factory.get()
    test_thread = content_api.create(
        content_type_slug=content_type_list.Thread.slug,
        workspace=workspace,
        parent=None,
        label="Test Thread",
        do_save=True,
        do_notify=False,
    )
    with new_revision(session=session, tm=transaction.manager, content=test_thread):
        content_api.update_content(
            test_thread, new_label="test_thread_updated", new_raw_content="Just a test"
        )
    transaction.commit()
    return test_thread


@pytest.mark.timeout(30)
@pytest.mark.usefixtures("base_fixture")
class TestLiveMessages(object):
    def test_api__user_live_messages_endpoint_without_GRIP_proxy__ok_200__nominal_case(
        self, user_api_factory, web_testapp, admin_user
    ):
        web_testapp.authorization = (
            "Basic",
            ("admin@admin.admin", "admin@admin.admin"),
        )
        res = web_testapp.get(
            "/api/users/{}/live_messages".format(admin_user.user_id),
            status=200,
            headers={"Accept": "text/event-stream"},
        )
        assert res.headers["Content-Type"] == "text/event-stream"
        assert res.headers["Content-Length"] == "60"
        assert res.headers["Grip-Hold"] == "stream"
        assert res.headers["Grip-Channel"] == "user_{}".format(admin_user.user_id)
        assert res.headers["Cache-Control"] == "no-cache"

    def test_api__user_live_messages_endpoint_without_GRIP_proxy__err_400__no_accept_header(
        self, user_api_factory, web_testapp, admin_user
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/users/{}/live_messages".format(admin_user.user_id), status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    @pytest.mark.pushpin
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__nominal_case(
        self, pushpin, app_config
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        client_events = client.events()
        # INFO - G.M - 2020-06-29 - Skip first event
        next(client_events)
        LiveMessagesLib(config=app_config).publish_dict("user_1", {"test_message": "example"})
        event1 = next(client_events)
        response.close()
        assert json.loads(event1.data) == {"test_message": "example"}
        assert event1.event == "message"

    @pytest.mark.pushpin
    @pytest.mark.parametrize("config_section", [{"name": "functional_live_test"}], indirect=True)
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update(
        self, pushpin, app_config
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        client_events = client.events()
        # INFO - G.M - 2020-06-29 - Skip first event
        next(client_events)
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        update_user_request = requests.put(
            "http://localhost:7999/api/users/1",
            auth=("admin@admin.admin", "admin@admin.admin"),
            json=params,
        )
        assert update_user_request.status_code == 200
        event1 = next(client_events)
        response.close()
        result = json.loads(event1.data)
        assert result["event_type"] == "user.modified"
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["user"]
        assert result["fields"]["user"]["user_id"] == 1
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert event1.event == "message"

    @pytest.mark.pushpin
    @pytest.mark.parametrize("config_section", [{"name": "functional_live_test"}], indirect=True)
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update__check_email_leaked(
        self, pushpin, app_config
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        client_events = client.events()
        # INFO - G.M - 2020-06-29 - Skip first event
        next(client_events)
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        update_user_request = requests.put(
            "http://localhost:7999/api/users/1",
            auth=("admin@admin.admin", "admin@admin.admin"),
            json=params,
        )
        assert update_user_request.status_code == 200
        event1 = next(client_events)
        response.close()
        result = json.loads(event1.data)
        # verify no email are leaked
        assert not result["fields"]["user"].get("email")
        assert not result["fields"]["author"].get("email")
        assert str(result).find("@") == -1

    @pytest.mark.pushpin
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_async_live_test"}], indirect=True
    )
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update__async(
        self, pushpin, app_config, rq_database_worker
    ):

        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        client_events = client.events()
        # INFO - G.M - 2020-06-29 - Skip first event
        next(client_events)
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        update_user_request = requests.put(
            "http://localhost:7999/api/users/1",
            auth=("admin@admin.admin", "admin@admin.admin"),
            json=params,
        )
        assert update_user_request.status_code == 200
        event1 = next(client_events)
        response.close()
        result = json.loads(event1.data)
        assert result["event_type"] == "user.modified"
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["user"]
        assert result["fields"]["user"]["user_id"] == 1
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert event1.event == "message"

    @pytest.mark.pushpin
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_async_live_test"}], indirect=True
    )
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__mention__async(
        # INFO - S.G - 2021-05-14 - this fixture should be kept last as it empties
        # the events generated by the other fixtures
        self,
        pushpin,
        app_config,
        one_thread,
        rq_database_worker,
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        client_events = client.events()
        # INFO - G.M - 2020-06-29 - Skip first event
        next(client_events)
        params = {
            "raw_content": '<p><span id="mention-foo123">@all</span>This is just an html comment!</p>'
        }
        post_comment = requests.post(
            "http://localhost:7999/api/workspaces/{}/contents/{}/comments".format(
                one_thread.workspace_id, one_thread.content_id
            ),
            auth=("admin@admin.admin", "admin@admin.admin"),
            json=params,
        )
        assert post_comment.status_code == 200
        event1 = next(client_events)
        result = json.loads(event1.data)
        response.close()
        assert result["event_type"] == "mention.created"
        assert result["fields"]["mention"]
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert event1.event == "message"

    @pytest.mark.pushpin
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_async_live_test"}], indirect=True
    )
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__big_content_update__async(
        # INFO - S.G - 2021-05-14 - this fixture should be kept last as it empties
        # the events generated by the other fixtures
        self,
        pushpin,
        big_html_document,
        rq_database_worker,
    ):

        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )

        client = sseclient.SSEClient(response)
        client_events = client.events()

        status = put_document(big_html_document)
        assert status == 204

        # Skip first event which only signals the opening
        next(client_events)

        event1 = next(client_events)
        result = json.loads(event1.data)
        assert result["event_type"] == "content.modified.html-document"

    @pytest.mark.pushpin
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_async_live_test"}], indirect=True
    )
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__after_event_id(
        self,
        pushpin,
        app_config,
        small_html_document_a,
        small_html_document_b,
        small_html_document_c,
        # INFO - S.G - 2021-05-14 - this fixture should be kept last as it empties
        # the events generated by the other fixtures
        rq_database_worker,
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )

        client = sseclient.SSEClient(response)
        client_events = client.events()

        put_document(small_html_document_a)
        put_document(small_html_document_b)

        # Skip first event which only signals the opening
        next(client_events)

        event1 = next(client_events)
        event2 = next(client_events)
        response.close()
        result1 = json.loads(event1.data)
        result2 = json.loads(event2.data)
        assert result1["fields"]["content"]["label"] == "Small document A"
        assert result2["fields"]["content"]["label"] == "Small document B"

        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages?after_event_id={}".format(
                result1["event_id"]
            ),
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )

        client = sseclient.SSEClient(response)
        client_events = client.events()
        next(client_events)
        event2 = next(client_events)

        put_document(small_html_document_c)

        assert json.loads(event2.data)["fields"]["content"]["label"] == "Small document B"

        event3 = next(client_events)
        assert json.loads(event3.data)["fields"]["content"]["label"] == "Small document C"

    @pytest.mark.pushpin
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__disconnect(
        self, pushpin, app_config
    ):
        headers = {"Accept": "text/event-stream"}
        response = requests.get(
            "http://localhost:7999/api/users/1/live_messages",
            auth=("admin@admin.admin", "admin@admin.admin"),
            stream=True,
            headers=headers,
        )
        client = sseclient.SSEClient(response)
        client_events = client.events()
        # INFO - G.M - 2020-06-29 - Skip first event
        next(client_events)

        requests.post(
            "http://localhost:7999/api/auth/logout",
            auth=("admin@admin.admin", "admin@admin.admin"),
        )

        with pytest.raises(StopIteration):
            next(client_events)
        response.close()
