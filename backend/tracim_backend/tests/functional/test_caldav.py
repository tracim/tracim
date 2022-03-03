import os.path
from time import sleep

import pytest
import requests
from requests.exceptions import ConnectionError
import transaction

from tracim_backend.applications.agenda.lib import AgendaHooks
from tracim_backend.applications.agenda.models import AgendaResourceType
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40

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

VALID_CARDDAV_BODY_PUT = """
BEGIN:VCARD
VERSION:4.0
FN:Evert Pot
N:Pot;Evert;;;
END:VCARD
"""
CALDAV_URL_FOR_TEST = "http://localhost:5232"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_caldav_radicale_proxy_test"}], indirect=True
)
class TestCaldavRadicaleProxyEndpoints(object):
    @pytest.mark.skip("This Need sleep method actually")
    def test_radicale_available(self, radicale_server, session) -> None:
        try:
            result = requests.get(CALDAV_URL_FOR_TEST, timeout=3)
        except ConnectionError:
            # we do retry just one time in order to be sure server was
            # correctly setup
            sleep(0.1)
            result = requests.get(CALDAV_URL_FOR_TEST, timeout=3)
        assert result.status_code == 200

    def test_proxy_user_resources_root__ok__nominal_case(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.request("/dav/user_{}/".format(user.user_id), status=207, method="PROPFIND")

    def test_proxy_user_resources_root__err__other_user_ressource(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = web_testapp.request("/dav/user_999/", status=403, method="PROPFIND")
        assert result.json_body["code"] == 5001

    @pytest.mark.xfail(reason="unclear for now")
    def test_proxy_user_resources_user_calendar_and_addressbook__ok__nominal_case(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get(
            "/dav/user_{user_id}/user_{user_id}_calendar".format(user_id=user.user_id), status=200,
        )
        web_testapp.get(
            "/dav/user_{user_id}/user_{user_id}_addressbook".format(user_id=user.user_id),
            status=200,
        )

    @pytest.mark.xfail(reason="unclear for now")
    def test_proxy_user_resources_workspace_calendar_and_addressbook__ok__nominal_case(
        self,
        radicale_server,
        user_api_factory,
        web_testapp,
        workspace_api_factory,
        role_api_factory,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        workspace.agenda_enabled = True
        rapi = role_api_factory.get()

        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get(
            "/dav/user_{user_id}/space_{workspace_id}_calendar/".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        web_testapp.get(
            "/dav/user_{user_id}/space_{workspace_id}_addressbook/".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )

    def test_proxy_user_agenda__ok__nominal_case(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get("/dav/agenda/user/{}/".format(user.user_id), status=200)
        event = VALID_CALDAV_BODY_PUT_EVENT
        web_testapp.put(
            "/dav/agenda/user/{}/".format(user.user_id),
            event,
            content_type="text/calendar",
            status=403,
        )
        web_testapp.get("/dav/agenda/user/{}/".format(user.user_id), status=200)
        web_testapp.delete("/dav/agenda/user/{}/".format(user.user_id), status=403)

    @pytest.mark.parametrize(
        "sub_item_label",
        [
            #  sub_items label
            ("2d89ab53-e66f-6a48-634a-f112fb27b5e8"),  # thunderbird-like
            ("c584046fa2a358f646aa18e94f61a011f32e7d14a5735cd80bceaca8351d8fa4"),  # caldavzap-like
        ],
    )
    def test_proxy_user_agenda__ok__on_sub_items(
        self, radicale_server, sub_item_label, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get(
            "/dav/agenda/user/{}/{}".format(user.user_id, sub_item_label), status=307
        ).follow(status=404)

        event = VALID_CALDAV_BODY_PUT_EVENT
        web_testapp.put(
            "/dav/agenda/user/{}/".format(user.user_id),
            event,
            content_type="text/calendar",
            status=403,
        )
        web_testapp.put(
            "/dav/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label),
            event,
            content_type="text/calendar",
            status=201,
        )
        web_testapp.put(
            "/dav/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label),
            event,
            content_type="text/calendar",
            status=201,
        )
        web_testapp.get(
            "/dav/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label), status=200
        )
        web_testapp.delete(
            "/dav/agenda/user/{}/{}.ics".format(user.user_id, sub_item_label), status=200
        )
        web_testapp.delete("/dav/agenda/user/{}/".format(user.user_id, sub_item_label), status=403)

    def test_proxy_user_agenda__err__other_user_agenda(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        user2 = uapi.create_user(
            "test2@test2.test2",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = web_testapp.get("/dav/agenda/user/{}/".format(user2.user_id), status=403)
        assert result.json_body["code"] == 5001

    def test_proxy_workspace_agenda__ok__nominal_case(
        self,
        radicale_server,
        user_api_factory,
        web_testapp,
        workspace_api_factory,
        role_api_factory,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        workspace.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        event = VALID_CALDAV_BODY_PUT_EVENT
        web_testapp.put(
            "/dav/agenda/workspace/{}/".format(workspace.workspace_id),
            event,
            content_type="text/agenda",
            status=403,
        )
        web_testapp.get("/dav/agenda/workspace/{}/".format(workspace.workspace_id), status=200)
        web_testapp.delete("/dav/agenda/workspace/{}/".format(workspace.workspace_id), status=403)

    def test_proxy_workspace_agenda__err__other_workspace_agenda(
        self, radicale_server, user_api_factory, workspace_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = web_testapp.get(
            "/dav/agenda/workspace/{}/".format(workspace.workspace_id), status=403
        )
        assert result.json_body["code"] == 5001

    def test_proxy_user_addressbook__ok__nominal_case(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get("/dav/addressbook/user/{}/".format(user.user_id), status=200)
        addressbook = VALID_CARDDAV_BODY_PUT
        web_testapp.put(
            "/dav/addressbook/user/{}/".format(user.user_id),
            addressbook,
            content_type="text/vcard",
            status=403,
        )
        web_testapp.get("/dav/addressbook/user/{}/".format(user.user_id), status=200)
        web_testapp.delete("/dav/addressbook/user/{}/".format(user.user_id), status=403)

    @pytest.mark.xfail(reason="unclear how carddav work")
    @pytest.mark.parametrize(
        "sub_item_label",
        [
            #  sub_items label
            ("2d89ab53-e66f-6a48-634a-f112fb27b5e8"),  # thunderbird-like
            ("c584046fa2a358f646aa18e94f61a011f32e7d14a5735cd80bceaca8351d8fa4"),  # caldavzap-like
        ],
    )
    def test_proxy_user_addressbook__ok__on_sub_items(
        self, radicale_server, sub_item_label, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get(
            "/dav/addressbook/user/{}/{}".format(user.user_id, sub_item_label), status=307
        ).follow(status=404)

        addressbook = VALID_CARDDAV_BODY_PUT
        web_testapp.put(
            "/dav/addressbook/user/{}/".format(user.user_id),
            addressbook,
            content_type="text/calendar",
            status=201,
        )
        web_testapp.put(
            "/dav/addressbook/user/{}/{}.vcf".format(user.user_id, sub_item_label),
            addressbook,
            content_type="text/vcard",
            status="*",
        )
        web_testapp.get(
            "/dav/addressbook/user/{}/{}.vcf".format(user.user_id, sub_item_label), status=307
        )
        web_testapp.delete(
            "/dav/addressbook/user/{}/{}.vcf".format(user.user_id, sub_item_label), status=200
        )
        web_testapp.delete(
            "/dav/addressbook/user/{}/".format(user.user_id, sub_item_label), status=200
        )

    def test_proxy_user_addressbook__err__other_user_agenda(
        self, radicale_server, user_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        user2 = uapi.create_user(
            "test2@test2.test2",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = web_testapp.get("/dav/addressbook/user/{}/".format(user2.user_id), status=403)
        assert result.json_body["code"] == 5001

    def test_proxy_workspace_addressbook__ok__nominal_case(
        self,
        radicale_server,
        user_api_factory,
        web_testapp,
        workspace_api_factory,
        role_api_factory,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        workspace.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.get("/dav/addressbook/workspace/{}/".format(workspace.workspace_id), status=200)
        addressbook = VALID_CARDDAV_BODY_PUT
        # broken
        web_testapp.put(
            "/dav/addressbook/workspace/{}/".format(workspace.workspace_id),
            addressbook,
            content_type="text/vcard",
            status=403,
        )
        web_testapp.get("/dav/addressbook/workspace/{}/".format(workspace.workspace_id), status=200)
        web_testapp.delete(
            "/dav/addressbook/workspace/{}/".format(workspace.workspace_id), status=403
        )

    def test_proxy_workspace_addressbook__err__other_workspace_agenda(
        self, radicale_server, user_api_factory, workspace_api_factory, web_testapp, test_context
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = web_testapp.get(
            "/dav/addressbook/workspace/{}/".format(workspace.workspace_id), status=403
        )
        assert result.json_body["code"] == 5001


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_caldav_radicale_proxy_test"}], indirect=True
)
class TestCaldavRadicaleSync(object):
    def test_user_sync__ok__deletion_restore(
        self,
        radicale_server,
        user_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
        workspace_api_factory,
        role_api_factory,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True, agenda_enabled=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()

        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )

        user_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/user/{user_id}".format(user_id=user.user_id),
        )
        user_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/user/{user_id}".format(user_id=user.user_id),
        )
        user_dav_resource_root_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}".format(user_id=user.user_id),
        )
        user_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/user_{user_id}_calendar".format(user_id=user.user_id),
        )
        user_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/user_{user_id}_addressbook".format(user_id=user.user_id),
        )
        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        # Links are created
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)
        uapi.delete(user, do_save=True)
        transaction.commit()
        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        # Links are removed
        assert not os.path.islink(user_calendar_symlink_path)
        assert not os.path.islink(user_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)
        assert not os.path.islink(workspace_addressbook_symlink_path)
        uapi.undelete(user, do_save=True)
        transaction.commit()
        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        # Links are recreated
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)

    def test_user_sync__ok__disable_reenable(
        self,
        radicale_server,
        user_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
        workspace_api_factory,
        role_api_factory,
    ) -> None:

        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True, agenda_enabled=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()

        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )

        session.flush()
        transaction.commit()
        user_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/user/{user_id}".format(user_id=user.user_id),
        )
        user_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/user/{user_id}".format(user_id=user.user_id),
        )
        user_dav_resource_root_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}".format(user_id=user.user_id),
        )
        user_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/user_{user_id}_calendar".format(user_id=user.user_id),
        )
        user_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/user_{user_id}_addressbook".format(user_id=user.user_id),
        )
        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        # Links are created
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)
        uapi.disable(user, do_save=True)
        transaction.commit()
        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        # Links are removed
        assert not os.path.islink(user_calendar_symlink_path)
        assert not os.path.islink(user_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)
        assert not os.path.islink(workspace_addressbook_symlink_path)
        uapi.enable(user, do_save=True)
        transaction.commit()
        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        # Links are recreated
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)

    def test_role_sync__ok__added_removed(
        self,
        radicale_server,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()
        workspace_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are created
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        rapi.delete_one(user_id=user.user_id, workspace_id=workspace.workspace_id, flush=True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are deleted
        assert not os.path.islink(workspace_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)

        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are recreated
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)

    def test_workspace_sync__ok__deletion_restore(
        self,
        radicale_server,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()
        workspace_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are created
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        workspace_api.delete(workspace=workspace, flush=True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are deleted
        assert not os.path.islink(workspace_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)
        workspace_api.undelete(workspace=workspace, flush=True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are recreated
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)

    def test_workspace_sync__ok__agenda_workspace_enabled_disabled(
        self,
        radicale_server,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()
        workspace_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are created
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        workspace_api.update_workspace(workspace=workspace, agenda_enabled=False, save_now=True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are deleted
        assert not os.path.islink(workspace_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)

        workspace_api.update_workspace(workspace=workspace, agenda_enabled=True, save_now=True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are recreated
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)

    def test_workspace_sync__ok__agenda_disabled_enabled(
        self,
        radicale_server,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
    ) -> None:
        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True, agenda_enabled=False)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()
        workspace_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are created
        assert not os.path.islink(workspace_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)
        workspace_api.update_workspace(workspace=workspace, agenda_enabled=True, save_now=True)
        transaction.commit()
        # workspace agenda are created
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are created
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)

        workspace_api.update_workspace(workspace=workspace, agenda_enabled=False, save_now=True)
        transaction.commit()
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are removed
        assert not os.path.islink(workspace_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)

    def test_cleanup_delete_user_agenda__ok__nominal_case(
        self,
        radicale_server,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
        app_config,
        session,
        test_context,
    ) -> None:

        test_context.plugin_manager.register(AgendaHooks())
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        session.add(user)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("wp1", save_now=True, agenda_enabled=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        session.flush()
        transaction.commit()

        workspace_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/workspace/{workspace_id}".format(
                workspace_id=workspace.workspace_id
            ),
        )
        workspace_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_calendar".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        workspace_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/space_{workspace_id}_addressbook".format(
                user_id=user.user_id, workspace_id=workspace.workspace_id
            ),
        )
        user_agenda_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="agenda/user/{user_id}".format(user_id=user.user_id),
        )
        user_addressbook_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="addressbook/user/{user_id}".format(user_id=user.user_id),
        )
        user_dav_resource_root_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}".format(user_id=user.user_id),
        )
        user_calendar_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/user_{user_id}_calendar".format(user_id=user.user_id),
        )
        user_addressbook_symlink_path = "{source_path}/{local_path}".format(
            source_path=app_config.RADICALE__LOCAL_PATH_STORAGE,
            local_path="user_{user_id}/user_{user_id}_addressbook".format(user_id=user.user_id),
        )

        assert os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        assert os.path.isdir(user_dav_resource_root_path)
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are created
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)
        assert os.path.islink(workspace_calendar_symlink_path)

        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.delete_user_agenda(user.user_id, AgendaResourceType.calendar)
        transaction.commit()

        assert not os.path.isdir(user_agenda_path)
        assert os.path.isdir(user_addressbook_path)
        # Links are not changed
        assert os.path.isdir(user_dav_resource_root_path)
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)

        cleanup_lib.delete_user_agenda(user.user_id, AgendaResourceType.addressbook)
        transaction.commit()

        assert not os.path.isdir(user_agenda_path)
        assert not os.path.isdir(user_addressbook_path)
        # Links are not changed
        assert os.path.isdir(user_dav_resource_root_path)
        assert os.path.islink(user_calendar_symlink_path)
        assert os.path.islink(user_addressbook_symlink_path)

        # workspace
        assert os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        assert os.path.islink(workspace_calendar_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)
        cleanup_lib.delete_workspace_agenda(workspace.workspace_id, AgendaResourceType.calendar)
        transaction.commit()

        assert not os.path.isdir(workspace_agenda_path)
        assert os.path.isdir(workspace_addressbook_path)
        # Links are not changed
        assert os.path.islink(workspace_calendar_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)

        cleanup_lib.delete_workspace_agenda(workspace.workspace_id, AgendaResourceType.addressbook)
        transaction.commit()

        assert not os.path.isdir(workspace_agenda_path)
        assert not os.path.isdir(workspace_addressbook_path)
        # Links are not changed
        assert os.path.islink(workspace_calendar_symlink_path)
        assert os.path.islink(workspace_addressbook_symlink_path)

        cleanup_lib.delete_user_dav_symlinks(user.user_id)
        transaction.commit()

        assert not os.path.isdir(user_agenda_path)
        assert not os.path.isdir(user_addressbook_path)
        # Links dav resource is removed
        assert not os.path.isdir(user_dav_resource_root_path)
        assert not os.path.islink(user_calendar_symlink_path)
        assert not os.path.islink(user_addressbook_symlink_path)
        assert not os.path.islink(workspace_calendar_symlink_path)
        assert not os.path.islink(workspace_addressbook_symlink_path)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_caldav_radicale_proxy_test"}], indirect=True
)
class TestAgendaApi(object):
    def test_proxy_user_agenda__ok__nominal_case(
        self, user_api_factory, workspace_api_factory, role_api_factory, web_testapp
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        workspace2 = workspace_api.create_workspace("wp2", save_now=True)
        workspace2.agenda_enabled = True
        workspace3 = workspace_api.create_workspace("wp3", save_now=True)
        workspace3.agenda_enabled = False
        secret_workspace = workspace_api.create_workspace("secret", save_now=True)
        secret_workspace.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace3, UserRoleInWorkspace.READER, False)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        result = web_testapp.get("/api/users/{}/agenda".format(user.user_id), status=200)

        assert len(result.json_body) == 3
        agenda = result.json_body[0]
        assert agenda["agenda_url"] == "http://localhost:6543/dav/agenda/user/{}/".format(
            user.user_id
        )
        assert agenda["with_credentials"] is True
        agenda = result.json_body[1]
        assert agenda["agenda_url"] == "http://localhost:6543/dav/agenda/workspace/{}/".format(
            workspace.workspace_id
        )
        assert agenda["with_credentials"] is True
        agenda = result.json_body[2]
        assert agenda["agenda_url"] == "http://localhost:6543/dav/agenda/workspace/{}/".format(
            workspace2.workspace_id
        )
        assert agenda["with_credentials"] is True

    def test_proxy_user_agenda__ok__workspace_filter(
        self, user_api_factory, workspace_api_factory, role_api_factory, web_testapp
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("wp1", save_now=True)
        workspace.agenda_enabled = True
        workspace2 = workspace_api.create_workspace("wp2", save_now=True)
        workspace2.agenda_enabled = True
        workspace3 = workspace_api.create_workspace("wp3", save_now=True)
        workspace3.agenda_enabled = True
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace3, UserRoleInWorkspace.READER, False)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {
            "workspace_ids": "{},{}".format(workspace.workspace_id, workspace3.workspace_id),
            "agenda_types": "workspace",
        }
        result = web_testapp.get(
            "/api/users/{}/agenda".format(user.user_id), params=params, status=200
        )
        assert len(result.json_body) == 2
        agenda = result.json_body[0]
        assert agenda["agenda_url"] == "http://localhost:6543/dav/agenda/workspace/{}/".format(
            workspace.workspace_id
        )
        assert agenda["with_credentials"] is True
        agenda = result.json_body[1]
        assert agenda["agenda_url"] == "http://localhost:6543/dav/agenda/workspace/{}/".format(
            workspace3.workspace_id
        )
        assert agenda["with_credentials"] is True


@pytest.mark.usefixtures("base_fixture")
class TestPreFilledAgendaEventSchema(object):
    """
    Tests for GET /api/system/pre-filled-agenda-event
    """

    @pytest.mark.parametrize(
        "config_section", [{"name": "pre-filled-agenda-event_sample_test"}], indirect=True
    )
    def test_api__get_prefilled_agenda_event_schema__ok_200__sample_data(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/pre-filled-agenda-event", status=200)
        assert res.json_body["description"] == "Organizer:\n\nAttendees:\n\nProgram:\n - …\n - …\n"

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_caldav_radicale_proxy_test"}], indirect=True
    )
    def test_api__get_prefilled_agenda_event_schema__ok_200__no_data(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/system/pre-filled-agenda-event", status=200)
        assert res.json_body["description"] is None

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_caldav_radicale_proxy_test"}], indirect=True
    )
    def test_api__get_prefilled_agenda_event_schema_err_401__unregistered_user(self, web_testapp):
        """
        Get some config info about tracim with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/system/pre-filled-agenda-event", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()
