import contextlib
import json
import os
import subprocess
import typing

import pytest
import requests
import sseclient
import transaction

from tracim_backend.config import CFG
from tracim_backend.error import ErrorCode
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def expect_line_containing(text: bytes, file) -> None:
    """
    Returns when a line containing text in the given file is found
    """
    while True:
        line = file.readline()
        if text in line:
            return


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


@contextlib.contextmanager
def messages_stream_client(
    user_id: int = 1,
    login: str = "admin@admin.admin",
    password: typing.Optional[str] = "admin@admin.admin",
    after_event_id: int = 0,
    skip_first_event: bool = True,
) -> typing.Generator[typing.Iterable, None, None]:
    headers = {"Accept": "text/event-stream"}
    query = "?after_event_id={}".format(after_event_id) if after_event_id else ""
    response = requests.get(
        "http://localhost:7999/api/users/{}/live_messages{}".format(user_id, query),
        auth=(login, password),
        stream=True,
        headers=headers,
    )
    assert response.status_code == 200, response.json()
    client = sseclient.SSEClient(response)
    client_events = client.events()
    if skip_first_event:
        next(client_events)
    yield client_events
    response.close()


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
        with messages_stream_client() as client_events:
            LiveMessagesLib(config=app_config).publish_dict("user_1", {"test_message": "example"})
            event = next(client_events)
        assert json.loads(event.data) == {"test_message": "example"}
        assert event.event == "message"

    @pytest.mark.pushpin
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__err__too_many_online_users(
        self, pushpin, app_config: CFG, bob_user: User, admin_user: User, session,
    ):
        # NOTE - RJ - 07-078-2021
        # This test does the following:
        # - run the user connection state monitor daemon using config tests_config_user_status_connection_monitor.ini
        # - waits for it to be connected to Pushpin
        # - connects to the admin live messages
        # - checks that it works
        # - connects to the bob live messages
        # - checks that it does not work (number of simultaneous users = 1)
        # - disconnects from the admin live messages
        # - connects to the bob live messages
        # - checks that it works

        env = {"TRACIM_CONF_PATH": "tests_config_user_status_connection_monitor.ini"}
        env.update(os.environ)

        with subprocess.Popen(
            ["python3", "daemons/user_connection_state_monitor.py"], env=env, stderr=subprocess.PIPE
        ) as monitor:
            expect_line_containing(b"Connected to ", monitor.stderr)
            try:
                with messages_stream_client(skip_first_event=False) as client_events:
                    event = next(client_events)
                    assert event.event == "stream-open"
                    expect_line_containing(
                        b"Setting connection status of user %d to online" % admin_user.user_id,
                        monitor.stderr,
                    )
                    with messages_stream_client(
                        user_id=bob_user.user_id,
                        login=bob_user.email,
                        password="password",
                        skip_first_event=False,
                    ) as bob_events:
                        bob_event = next(bob_events)
                        assert bob_event.event == "stream-error"
                        assert json.loads(bob_event.data) == {
                            "code": ErrorCode.TOO_MANY_ONLINE_USERS.value,
                            "message": "Too many users online (1/1)",
                        }

                        with pytest.raises(StopIteration):
                            next(bob_events)

                    client_events.close()

                    expect_line_containing(
                        b"Setting connection status of user %d to offline" % admin_user.user_id,
                        monitor.stderr,
                    )

                with messages_stream_client(
                    user_id=bob_user.user_id,
                    login=bob_user.email,
                    password="password",
                    skip_first_event=False,
                ) as bob_events:
                    bob_event = next(bob_events)
                    assert bob_event.event == "stream-open"
            finally:
                monitor.terminate()

    @pytest.mark.pushpin
    @pytest.mark.parametrize("config_section", [{"name": "functional_live_test"}], indirect=True)
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update(
        self, pushpin, app_config
    ):
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        with messages_stream_client() as client_events:
            update_user_request = requests.put(
                "http://localhost:7999/api/users/1",
                auth=("admin@admin.admin", "admin@admin.admin"),
                json=params,
            )
            assert update_user_request.status_code == 200
            event = next(client_events)
        result = json.loads(event.data)
        assert result["event_type"] == "user.modified"
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["user"]
        assert result["fields"]["user"]["user_id"] == 1
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert event.event == "message"

    @pytest.mark.pushpin
    @pytest.mark.parametrize("config_section", [{"name": "functional_live_test"}], indirect=True)
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__user_update__check_email_leaked(
        self, pushpin, app_config
    ):
        with messages_stream_client() as client_events:
            params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
            update_user_request = requests.put(
                "http://localhost:7999/api/users/1",
                auth=("admin@admin.admin", "admin@admin.admin"),
                json=params,
            )
            assert update_user_request.status_code == 200
            event = next(client_events)
        result = json.loads(event.data)
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

        with messages_stream_client() as client_events:
            params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
            update_user_request = requests.put(
                "http://localhost:7999/api/users/1",
                auth=("admin@admin.admin", "admin@admin.admin"),
                json=params,
            )
            assert update_user_request.status_code == 200
            event = next(client_events)
        result = json.loads(event.data)
        assert result["event_type"] == "user.modified"
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["user"]
        assert result["fields"]["user"]["user_id"] == 1
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert event.event == "message"

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
        def assert_mention_event(event):
            result = json.loads(event.data)
            assert result["event_type"] == "mention.created"
            assert result["fields"]["mention"]
            assert result["fields"]["author"]
            assert result["fields"]["author"]["user_id"] == 1
            assert event.event == "message"

        with messages_stream_client() as client_events:
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
            event = next(client_events)
            # INFO - SG - 2021/06/23 - mention.created and content.created.comment order is not stable
            try:
                assert_mention_event(event)
            except AssertionError:
                event = next(client_events)
                assert_mention_event(event)

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

        with messages_stream_client() as client_events:
            status = put_document(big_html_document)
            assert status == 204
            event = next(client_events)
        result = json.loads(event.data)
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
        with messages_stream_client() as client_events:
            put_document(small_html_document_a)
            put_document(small_html_document_b)
            event1 = next(client_events)
            event2 = next(client_events)
        result1 = json.loads(event1.data)
        result2 = json.loads(event2.data)
        assert result1["fields"]["content"]["label"] == "Small document A"
        assert result2["fields"]["content"]["label"] == "Small document B"

        with messages_stream_client(after_event_id=result1["event_id"]) as client_events:
            event2 = next(client_events)
            assert json.loads(event2.data)["fields"]["content"]["label"] == "Small document B"
            put_document(small_html_document_c)

            event3 = next(client_events)
            assert json.loads(event3.data)["fields"]["content"]["label"] == "Small document C"

    @pytest.mark.pushpin
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__disconnect(
        self, pushpin, app_config
    ):
        with messages_stream_client() as client_events:
            requests.post(
                "http://localhost:7999/api/auth/logout",
                auth=("admin@admin.admin", "admin@admin.admin"),
            )

            with pytest.raises(StopIteration):
                next(client_events)

    @pytest.mark.pushpin
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_async_live_test"}], indirect=True
    )
    def test_api__user_live_messages_endpoint_with_GRIP_proxy__ok__content_tag__async(
        self, small_html_document_a: Content, pushpin, app_config, rq_database_worker
    ):
        params = {"tag_name": "foo"}
        with messages_stream_client() as client_events:
            update_user_request = requests.post(
                "http://localhost:7999/api/workspaces/{}/contents/{}/tags".format(
                    small_html_document_a.workspace_id, small_html_document_a.content_id
                ),
                auth=("admin@admin.admin", "admin@admin.admin"),
                json=params,
            )
            assert update_user_request.status_code == 200
            tag_event = next(client_events)
            content_tag_event = next(client_events)
        assert tag_event.event == "message"
        result = json.loads(tag_event.data)
        assert result["event_type"] == "tag.created"
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert result["fields"]["workspace"]
        assert result["fields"]["tag"]
        assert result["fields"]["tag"]["tag_name"] == "foo"

        assert content_tag_event.event == "message"
        result = json.loads(content_tag_event.data)
        assert result["event_type"] == "content_tag.created"
        assert result["read"] is None
        assert result["fields"]
        assert result["created"]
        assert result["event_id"]
        assert result["fields"]["author"]
        assert result["fields"]["author"]["user_id"] == 1
        assert result["fields"]["workspace"]
        assert result["fields"]["tag"]
        assert result["fields"]["tag"]["tag_name"] == "foo"
        assert result["fields"]["content"]
