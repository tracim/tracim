from time import sleep

from parameterized import parameterized
import pytest
import requests
from requests.exceptions import ConnectionError
import transaction

from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests import CaldavRadicaleProxyFunctionalTest
from tracim_backend.tests import FunctionalTest

VALID_CALDAV_BODY_PUT_EVENT = """
BEGIN:VCALENDAR
PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN
VERSION:2.0
X-WR-CALNAME:test
X-WR-TIMEZONE:Europe/Paris
BEGIN:VEVENT
CREATED:20190308T133249Z
LAST-MODIFIED:20190308T133251Z
DTSTAMP:20190308T133251Z
UID:6028cb45-10f3-4f95-8989-5fb6436a0243
SUMMARY:Nouvel évènement
DTSTART;VALUE=DATE:20190306
DTEND;VALUE=DATE:20190307
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR
"""
CALDAV_URL_FOR_TEST = "http://localhost:5232"


class TestCaldavRadicaleProxyEndpoints(CaldavRadicaleProxyFunctionalTest):
    @pytest.mark.skip("This Need sleep method actually")
    def test_radicale_available(self) -> None:
        try:
            result = requests.get(CALDAV_URL_FOR_TEST, timeout=3)
        except ConnectionError:
            # we do retry just one time in order to be sure server was
            # correctly setup
            sleep(0.1)
            result = requests.get(CALDAV_URL_FOR_TEST, timeout=3)
        assert result.status_code == 200

    def test_proxy_user_agenda__ok__nominal_case(self) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        self.testapp.get("/agenda/user/{}/".format(user.user_id), status=404)
        event = VALID_CALDAV_BODY_PUT_EVENT
        self.testapp.put(
            "/agenda/user/{}/".format(user.user_id), event, content_type="text/calendar", status=201
        )
        self.testapp.get("/agenda/user/{}/".format(user.user_id), status=200)
        self.testapp.delete("/agenda/user/{}/".format(user.user_id), status=200)

    @parameterized.expand(
        [
            #  sub_items label
            ("2d89ab53-e66f-6a48-634a-f112fb27b5e8"),  # thunderbird-like
            ("c584046fa2a358f646aa18e94f61a011f32e7d14a5735cd80bceaca8351d8fa4"),  # caldavzap-like
        ]
    )
    def test_proxy_user_agenda__ok__on_sub_items(self, sub_item_label) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        self.testapp.get("/agenda/user/{}/{}".format(user.user_id, sub_item_label), status=404)
        event = VALID_CALDAV_BODY_PUT_EVENT
        self.testapp.put(
            "/agenda/user/{}/".format(user.user_id), event, content_type="text/calendar", status=201
        )
        self.testapp.put(
            "/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label),
            event,
            content_type="text/calendar",
            status="*",
        )
        self.testapp.get("/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label), status=200)
        self.testapp.delete(
            "/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label), status=200
        )
        self.testapp.delete("/agenda/user/{}/".format(user.user_id, sub_item_label), status=200)

    def test_proxy_user_agenda__err__other_user_agenda(self) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        user2 = uapi.create_user(
            "test2@test2.test2",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = self.testapp.get("/agenda/user/{}/".format(user2.user_id), status=403)
        assert result.json_body["code"] == 5001

    def test_proxy_workspace_agenda__ok__nominal_case(self) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = self.get_workspace_api(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        workspace.agenda_enabled = True
        rapi = self.get_role_api()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        self.testapp.get("/agenda/workspace/{}/".format(workspace.workspace_id), status=404)
        event = VALID_CALDAV_BODY_PUT_EVENT
        self.testapp.put(
            "/agenda/workspace/{}/".format(workspace.workspace_id),
            event,
            content_type="text/agenda",
            status=201,
        )
        self.testapp.get("/agenda/workspace/{}/".format(workspace.workspace_id), status=200)
        self.testapp.delete("/agenda/workspace/{}/".format(workspace.workspace_id), status=200)

    def test_proxy_workspace_agenda__err__other_workspace_agenda(self) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = self.get_workspace_api(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = self.testapp.get(
            "/agenda/workspace/{}/".format(workspace.workspace_id), status=403
        )
        assert result.json_body["code"] == 5001


class TestAgendaApi(FunctionalTest):
    config_section = "functional_caldav_radicale_proxy_test"

    def test_proxy_user_agenda__ok__nominal_case(self) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = self.get_workspace_api(show_deleted=True)
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        workspace2 = workspace_api.create_workspace("wp2", save_now=True)
        workspace2.agenda_enabled = True
        workspace3 = workspace_api.create_workspace("wp3", save_now=True)
        workspace3.agenda_enabled = False
        secret_workspace = workspace_api.create_workspace("secret", save_now=True)
        secret_workspace.agenda_enabled = True
        rapi = self.get_role_api()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace3, UserRoleInWorkspace.READER, False)
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = self.testapp.get("/api/v2/users/{}/agenda".format(user.user_id), status=200)

        assert len(result.json_body) == 3
        agenda = result.json_body[0]
        assert agenda["agenda_url"] == "http://localhost:6543/agenda/user/{}/".format(user.user_id)
        assert agenda["with_credentials"] is True
        agenda = result.json_body[1]
        assert agenda["agenda_url"] == "http://localhost:6543/agenda/workspace/{}/".format(
            workspace.workspace_id
        )
        assert agenda["with_credentials"] is True
        agenda = result.json_body[2]
        assert agenda["agenda_url"] == "http://localhost:6543/agenda/workspace/{}/".format(
            workspace2.workspace_id
        )
        assert agenda["with_credentials"] is True

    def test_proxy_user_agenda__ok__workspace_filter(self) -> None:

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = self.get_workspace_api(show_deleted=True)
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        workspace2 = workspace_api.create_workspace("wp2", save_now=True)
        workspace2.agenda_enabled = True
        workspace3 = workspace_api.create_workspace("wp3", save_now=True)
        workspace3.agenda_enabled = True
        rapi = self.get_role_api()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace3, UserRoleInWorkspace.READER, False)
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {
            "workspace_ids": "{},{}".format(workspace.workspace_id, workspace3.workspace_id),
            "agenda_types": "workspace",
        }
        result = self.testapp.get(
            "/api/v2/users/{}/agenda".format(user.user_id), params=params, status=200
        )
        assert len(result.json_body) == 2
        agenda = result.json_body[0]
        assert agenda["agenda_url"] == "http://localhost:6543/agenda/workspace/{}/".format(
            workspace.workspace_id
        )
        assert agenda["with_credentials"] is True
        agenda = result.json_body[1]
        assert agenda["agenda_url"] == "http://localhost:6543/agenda/workspace/{}/".format(
            workspace3.workspace_id
        )
        assert agenda["with_credentials"] is True
