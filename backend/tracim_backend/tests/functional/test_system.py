# coding=utf-8
import pytest

from tracim_backend.error import ErrorCode
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.utils.utils import get_timezones_list
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


"""
Tests for /api/v2/system subpath endpoints.
"""


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
class TestApplicationEndpoint(object):
    """
    Tests for /api/v2/system/applications
    """

    def test_api__get_applications__ok_200__nominal_case(
        self, application_api_factory, web_testapp
    ):
        """
        Get applications list with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/system/applications", status=200)
        res = res.json_body
        applications = application_api_factory.get().get_all()
        assert len(res) == len(applications)
        for counter, application in enumerate(applications):
            assert res[counter]["label"] == application.label
            assert res[counter]["slug"] == application.slug
            assert res[counter]["fa_icon"] == application.fa_icon
            assert res[counter]["hexcolor"] == application.hexcolor
            assert res[counter]["is_active"] == application.is_active
            assert res[counter]["config"] == application.config

    def test_api__get_applications__err_401__unregistered_user(self, web_testapp):
        """
        Get applications list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/v2/system/applications", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
class TestContentsTypesEndpoint(object):
    """
    Tests for /api/v2/system/content_types
    """

    def test_api__get_content_types__ok_200__nominal_case(self, web_testapp, content_type_list):
        """
        Get system content_types list with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/system/content_types", status=200)
        res = res.json_body
        assert len(res) == len(content_type_list.endpoint_allowed_types_slug())
        content_types = content_type_list.endpoint_allowed_types_slug()

        for counter, content_type_slug in enumerate(content_types):
            content_type = content_type_list.get_one_by_slug(content_type_slug)
            assert res[counter]["slug"] == content_type.slug
            assert res[counter]["fa_icon"] == content_type.fa_icon
            assert res[counter]["hexcolor"] == content_type.hexcolor
            assert res[counter]["label"] == content_type.label
            assert res[counter]["creation_label"] == content_type.creation_label
            for status_counter, status in enumerate(content_type.available_statuses):
                assert (
                    res[counter]["available_statuses"][status_counter]["fa_icon"] == status.fa_icon
                )
                assert (
                    res[counter]["available_statuses"][status_counter]["global_status"]
                    == status.global_status
                )
                assert res[counter]["available_statuses"][status_counter]["slug"] == status.slug
                assert (
                    res[counter]["available_statuses"][status_counter]["hexcolor"]
                    == status.hexcolor
                )

    def test_api__get_content_types__err_401__unregistered_user(self, web_testapp):
        """
        Get system content_types list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/v2/system/content_types", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
class TestTimezonesEndpoint(object):
    """
    Tests for /api/v2/system/timezones
    """

    def test_api__get_timezones__ok_200__nominal_case(self, web_testapp):
        """
        Get alls timezones list with a registered user.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/system/timezones", status=200)
        timezones = res.json_body
        timezones_list = get_timezones_list()
        assert len(timezones) == len(timezones_list)

        for counter, timezone in enumerate(timezones_list):
            assert timezones[counter]["name"] == timezone.name

    def test_api__get_content_types__err_401__unregistered_user(self, web_testapp):
        """
        Get availables timezones list with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/v2/system/timezones", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
class TestAboutEndpoint(object):
    """
    Tests for /api/v2/system/about
    """

    def test_api__get_about__ok_200__nominal_case(self, web_testapp):
        """
        Get information about Tracim
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/system/about", status=200)
        assert res.json_body["name"] == "Tracim"
        assert res.json_body["version"]
        assert res.json_body["datetime"]
        assert res.json_body["website"] == "https://www.tracim.fr"

    def test_api__get_about__err_401__unregistered_user(self, web_testapp):
        """
        Get information about Tracim with unregistered user
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/v2/system/about", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
@pytest.mark.parametrize("config_section", ["functional_test"])
class TestConfigEndpoint(object):
    """
    Tests for /api/v2/system/config
    """

    def test_api__get_config__ok_200__nominal_case(self, web_testapp):
        """
        Get some config info about tracim
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/system/config", status=200)
        assert res.json_body["email_notification_activated"] is False
        assert res.json_body["new_user_invitation_do_notify"] is True
        assert res.json_body["webdav_enabled"] is False
        assert res.json_body["webdav_url"] == "https://localhost:3030/webdav"

    @pytest.mark.xfail(reason="[config_unauthenticated] issue #1270 ")
    def test_api__get_config__err_401__unregistered_user(self, web_testapp):
        """
        Get some config info about tracim with an unregistered user (bad auth)
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/v2/system/config", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
class TestErrorCodeEndpoint(object):
    def test_api__get_error_code_endpoint__ok__200__nominal_case(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/system/error_codes", status=200)
        # check if all error_codes are available by checking number of item
        # received
        assert len(res.json_body) == len(list(map(int, ErrorCode)))
