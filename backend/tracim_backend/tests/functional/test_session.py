# coding=utf-8
import datetime
from time import sleep

from freezegun import freeze_time
import pytest
import transaction
from webtest import TestApp

from tracim_backend.error import ErrorCode
from tracim_backend.models.auth import Profile
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


class TestLogoutEndpoint(object):
    def test_api__access_logout_get_enpoint__ok__nominal_case(self, web_testapp):
        web_testapp.get("/api/auth/logout", status=204)

    def test_api__access_logout_post_enpoint__ok__nominal_case(self, web_testapp):
        web_testapp.post_json("/api/auth/logout", status=204)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestLoginEndpoint(object):
    def test_api__try_login_enpoint__ok_200__nominal_case(self, web_testapp):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=200)
        assert res.json_body["created"]
        datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_login_enpoint__ok_200__with_username(self, web_testapp):
        params = {"username": "TheAdmin", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=200)
        assert res.json_body["created"]
        datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
        assert res.json_body["username"] == "TheAdmin"

    def test_api__try_login_enpoint__ok_200__with_username_basic_auth(
        self, web_testapp: TestApp,
    ) -> None:
        web_testapp.authorization = ("Basic", ("TheAdmin", "admin@admin.admin"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        assert res.json_body["public_name"] == "Global manager"

    def test_api__try_login_enpoint__ok_200__without_username_and_email(self, web_testapp):
        params = {"password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=400)
        assert "Validation error of input data" in res.json["message"]
        assert res.json["details"]["_schema"] == ["email or username required"]

    def test_api__try_login_enpoint__ok_200__insensitive_to_case(self, web_testapp):
        params = {"email": "ADMIN@ADMIN.ADMIN", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=200)
        assert res.json_body["email"] == "admin@admin.admin"

        params = {"email": "aDmIn@AdmIn.AdMIn", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=200)
        assert res.json_body["email"] == "admin@admin.admin"

    def test_api__try_login_enpoint__err_401__user_not_activated(
        self, user_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()

        params = {"email": "test@test.test", "password": "test@test.test"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED

    def test_api__try_login_enpoint__err_403__bad_password(self, web_testapp):
        params = {"email": "admin@admin.admin", "password": "bad_password"}
        res = web_testapp.post_json("/api/auth/login", status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint__err_403__unregistered_user(self, web_testapp):
        params = {"email": "unknown_user@unknown.unknown", "password": "bad_password"}
        res = web_testapp.post_json("/api/auth/login", status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint__err_400__no_json_body(self, web_testapp):
        res = web_testapp.post_json("/api/auth/login", status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_ldap_test"}], indirect=True)
class TestLDAPAuthOnlyEndpoint(object):
    def test_api__try_login_enpoint_ldap_auth__ok_200__valid_ldap_user(self, web_testapp):
        params = {"username": "hubert@planetexpress.com", "password": "professor"}
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == creation_date
            )
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                != datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

    def test_api__try_login_enpoint_ldap_auth__err_403__valid_internal_db_user(self, web_testapp):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint_ldap_auth__err_403__unvalid_user(self, web_testapp):
        params = {"email": "unknown@unknown.unknown", "password": "unknown@unknown.unknown"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__ok__200__valid_ldap_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == creation_date
            )
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                != datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__err__403__valid_internal_db_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.get("/api/auth/whoami", status=401)

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__err__403__unvalid_user(
        self, web_testapp
    ):
        web_testapp.authorization = (
            "Basic",
            ("unknown@unknown.unknown", "unknown@unknown.unknown"),
        )
        web_testapp.get("/api/auth/whoami", status=401)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_ldap_test_username"}], indirect=True
)
class TestLDAPAuthOnlyUsingUsernameLoginEndpoint(object):
    def test_api__try_login_enpoint_ldap_auth__ok_200__valid_ldap_user(self, web_testapp):
        params = {"username": "Hubert", "password": "professor"}
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] is None
            assert res.json_body["username"] == "Hubert"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == creation_date
            )
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                != datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["username"] == "Hubert"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

    def test_api__try_login_enpoint_ldap_auth__err_403__valid_internal_db_user(self, web_testapp):
        params = {"username": "admin", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint_ldap_auth__err_403__unvalid_user(self, web_testapp):
        params = {"username": "unknown", "password": "unknown@unknown.unknown"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__ok__200__valid_ldap_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("Hubert", "professor"))
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["username"] == "Hubert"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == creation_date
            )
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                != datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["username"] == "Hubert"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__err__403__valid_internal_db_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("admin", "admin@admin.admin"))
        web_testapp.get("/api/auth/whoami", status=401)

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__err__403__unvalid_user(
        self, web_testapp
    ):
        web_testapp.authorization = (
            "Basic",
            ("unknown", "unknown@unknown.unknown"),
        )
        web_testapp.get("/api/auth/whoami", status=401)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_ldap_and_internal_test"}], indirect=True
)
class TestLDAPandInternalAuthOnlyEndpoint(object):
    def test_api__try_login_enpoint_ldap_internal_auth__ok_200__valid_ldap_user(self, web_testapp):
        params = {"email": "hubert@planetexpress.com", "password": "professor"}
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == creation_date
            )
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                != datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

    def test_api__try_login_enpoint_ldap_internal_auth__ok__200__valid_internal_db_user(
        self, web_testapp
    ):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=200)
        assert res.json_body["created"]
        datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_login_enpoint_ldap_internal_auth__err_403__unvalid_user(self, web_testapp):
        params = {"email": "unknown@unknown.unknown", "password": "unknown@unknown.unknown"}
        res = web_testapp.post_json("/api/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api_try_whoami_basic_auth_endpoint_ldap_internal_auth__ok__200__valid_ldap_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert res.json_body["created"]
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                == creation_date
            )
            assert (
                datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
                != datetime.datetime.utcnow()
            )
            assert res.json_body["public_name"] == "Hubert"
            assert res.json_body["email"] == "hubert@planetexpress.com"
            assert res.json_body["is_active"]
            assert res.json_body["profile"]
            assert res.json_body["profile"] == "users"
            assert res.json_body["has_avatar"] is False
            assert res.json_body["auth_type"] == "ldap"

    def test_api_try_whoami_basic_auth_endpoint_ldap_internal_auth__ok__200__valid_internal_db_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["lang"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api_try_whoami_basic_auth_endpoint_ldap_internal_auth__err__403__unvalid_user(
        self, web_testapp
    ):
        web_testapp.authorization = (
            "Basic",
            ("unknown@unknown.unknown", "unknown@unknown.unknown"),
        )
        web_testapp.get("/api/auth/whoami", status=401)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestWhoamiEndpoint(object):
    def test_api__try_whoami_enpoint__ok_200__nominal_case(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["lang"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_whoami_enpoint__ok_200__insensitive_to_case(self, web_testapp):
        web_testapp.authorization = ("Basic", ("ADMIN@ADMIN.ADMIN", "admin@admin.admin"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        assert res.json_body["email"] == "admin@admin.admin"

        web_testapp.authorization = ("Basic", ("aDmIn@AdmIn.AdMIn", "admin@admin.admin"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        assert res.json_body["email"] == "admin@admin.admin"

    def test_api__try_whoami_enpoint__err_401__user_is_not_active(
        self, web_testapp, user_api_factory
    ):
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))

        res = web_testapp.get("/api/auth/whoami", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_whoami_enpoint__err_401__unauthenticated(self, web_testapp):
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/auth/whoami", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestWhoamiEndpointWithApiKey(object):
    def test_api__try_whoami_enpoint_with_api_key__ok_200__nominal_case(self, web_testapp):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "admin@admin.admin"}
        res = web_testapp.get("/api/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_whoami_endpoint_with_api_key__ok_200__username(self, web_testapp):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "TheAdmin"}
        res = web_testapp.get("/api/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_whoami_enpoint_with_api_key__ok_200__case_insensitive_email(
        self, web_testapp
    ):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "ADMIN@ADMIN.ADMIN"}
        res = web_testapp.get("/api/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["email"] == "admin@admin.admin"

        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "aDmIn@AdmIn.AdMIn"}
        res = web_testapp.get("/api/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["email"] == "admin@admin.admin"

    def test_api__try_whoami_enpoint__err_401__user_is_not_active(
        self, web_testapp, user_api_factory
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "test@test.test"}
        res = web_testapp.get("/api/auth/whoami", status=401, headers=headers_auth)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None

    def test_api__try_whoami_enpoint__err_401__unauthenticated(self, web_testapp):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "john@doe.doe"}
        res = web_testapp.get("/api/auth/whoami", status=401, headers=headers_auth)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestWhoamiEndpointWithApiKeyNoKey(object):
    def test_api__try_whoami_enpoint_with_api_key__err_401__no_api_key(self, web_testapp):
        headers_auth = {"Tracim-Api-Key": "", "Tracim-Api-Login": "admin@admin.admin"}
        web_testapp.get("/api/auth/whoami", status=401, headers=headers_auth)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test_remote_auth"}], indirect=True)
class TestWhoamiEndpointWithRemoteHeader(object):
    def test_api__try_whoami_enpoint_remote_user__err_401__as_http_header(self, web_testapp):
        headers_auth = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        web_testapp.get("/api/auth/whoami", status=401, headers=headers_auth)

    def test_api__try_whoami_enpoint_remote_user__ok_200__case_insensitive_email(self, web_testapp):
        extra_environ = {"REMOTE_USER": "REMOTEUSER@REMOTEUSER.REMOTEUSER"}
        res = web_testapp.get("/api/auth/whoami", status=200, extra_environ=extra_environ)
        extra_environ = {"REMOTE_USER": "ReMoTeUser@rEmoTEUSer.rEMoTeusEr"}
        res = web_testapp.get("/api/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["email"] == "remoteuser@remoteuser.remoteuser"

    def test_api__try_whoami_enpoint_remote_user__ok_200__nominal_case(self, web_testapp):

        extra_environ = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        res = web_testapp.get("/api/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["public_name"] == "remoteuser"
        assert res.json_body["email"] == "remoteuser@remoteuser.remoteuser"
        assert res.json_body["username"] is None
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "users"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "remote"
        user_id = res.json_body["user_id"]

        res = web_testapp.get("/api/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["public_name"] == "remoteuser"
        assert res.json_body["email"] == "remoteuser@remoteuser.remoteuser"
        assert res.json_body["username"] is None
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "users"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "remote"
        assert res.json_body["user_id"] == user_id

    def test_api__try_whoami_enpoint_remote_user__ok_200__nominal_case_username(self, web_testapp):

        extra_environ = {"REMOTE_USER": "remoteuser"}
        res = web_testapp.get("/api/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["public_name"] == "remoteuser"
        assert res.json_body["email"] is None
        assert res.json_body["username"] == "remoteuser"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "users"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "remote"
        user_id = res.json_body["user_id"]

        res = web_testapp.get("/api/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["public_name"] == "remoteuser"
        assert res.json_body["username"] == "remoteuser"
        assert res.json_body["email"] is None
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "users"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "remote"
        assert res.json_body["user_id"] == user_id

    def test_api__try_whoami_enpoint__err_401__remote_user_is_not_active(
        self, web_testapp, user_api_factory
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()
        extra_environ = {"REMOTE_USER": "test@test.test"}
        res = web_testapp.get("/api/auth/whoami", status=401, extra_environ=extra_environ)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None

    def test_api__try_whoami_enpoint__err_401__remote_user_unauthenticated(self, web_testapp):
        res = web_testapp.get("/api/auth/whoami", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_whoami_enpoint__err_401__remote_user_bad_email(self, web_testapp):
        extra_environ = {"REMOTE_USER": ""}
        res = web_testapp.get("/api/auth/whoami", status=401, extra_environ=extra_environ)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__whoami__ok_200__with_cookie(self, web_testapp):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        web_testapp.post_json("/api/auth/login", params=params, status=200)
        sleep(0.3)
        web_testapp.get("/api/auth/whoami", status=200)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_cookie_auth"}], indirect=True
)
class TestSessionEndpointWithCookieAuthToken(object):
    def test_api__test_cookie_auth_token__ok__timeout(self, web_testapp):
        with freeze_time("1999-12-31 23:59:59"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in web_testapp.cookies

        # after too much time, session_id should be revoked
        with freeze_time("2000-01-01 00:10:00"):
            res = web_testapp.get("/api/auth/whoami", params=params, status=401)

    def test_api__test_cookie_auth_token__ok__change_email_dont_break_cookie(
        self, web_testapp, admin_user
    ):
        """
        Test if email change doesn't break cookie auth
        :return:
        """

        with freeze_time("1999-12-31 23:59:58"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in web_testapp.cookies
            user_session_key_1 = web_testapp.cookies["session_key"]

        # change own email
        with freeze_time("1999-12-31 23:59:59"):
            params = {
                "email": "mysuperemail@email.fr",
                "loggedin_user_password": "admin@admin.admin",
            }
            web_testapp.put_json(
                "/api/users/{}/email".format(admin_user.user_id), params=params, status=200
            )
            assert "Set-Cookie" in res.headers
            assert "session_key" in web_testapp.cookies
            user_session_key_2 = web_testapp.cookies["session_key"]
            assert user_session_key_1 == user_session_key_2

        # session_id still work
        with freeze_time("2000-01-01 00:00:00"):
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in web_testapp.cookies
            user_session_key_3 = web_testapp.cookies["session_key"]
            assert user_session_key_3 == user_session_key_2

        # after too much time, session_id should be revoked
        with freeze_time("2000-01-01 00:10:01"):
            res = web_testapp.get("/api/auth/whoami", params=params, status=401)

    def test_api__test_cookie_auth_token__ok__revocation_case(self, web_testapp):
        with freeze_time("1999-12-31 23:59:59"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in web_testapp.cookies
            user_session_key_1 = web_testapp.cookies["session_key"]

        with freeze_time("2000-01-01 00:00:00"):
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in web_testapp.cookies
            user_session_key_2 = web_testapp.cookies["session_key"]
            assert user_session_key_1 == user_session_key_2

            res = web_testapp.post_json("/api/auth/logout", status=204)
            assert "Set-Cookie" in res.headers

        with freeze_time("2000-01-01 00:00:02"):
            res = web_testapp.get("/api/auth/whoami", status=401)
            assert isinstance(res.json, dict)
            assert "code" in res.json.keys()
            assert res.json_body["code"] is None
            assert "message" in res.json.keys()
            assert "details" in res.json.keys()

        # test replay old token
        with freeze_time("2000-01-01 00:00:04"):
            web_testapp.reset()
            web_testapp.set_cookie("session_key", user_session_key_1)
            res = web_testapp.get("/api/auth/whoami", status=401)
            assert isinstance(res.json, dict)
            assert "code" in res.json.keys()
            assert res.json_body["code"] is None
            assert "message" in res.json.keys()
            assert "details" in res.json.keys()

    def test_api__test_cookie_auth_token__ok__renew(self, web_testapp):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        with freeze_time() as frozen_time:
            res = web_testapp.post_json("/api/auth/login", params=params, status=200)
            # The cookie is set after login
            assert "Set-Cookie" in res.headers
            assert "session_key" in web_testapp.cookies
            user_session_key = web_testapp.cookies["session_key"]
            # further requests do not set cookie again
            res = web_testapp.get("/api/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in web_testapp.cookies
            assert web_testapp.cookies["session_key"] == user_session_key
            # until its age is more than 50% of its max
            for _ in range(2):
                # print(_)
                frozen_time.tick(datetime.timedelta(seconds=350))
                res = web_testapp.get("/api/auth/whoami", status=200)
                assert "Set-Cookie" in res.headers
                assert "session_key" in web_testapp.cookies
                assert web_testapp.cookies["session_key"] == user_session_key
            # session timeout is updated when accessed so it is still valid
            res = web_testapp.get("/api/auth/whoami", status=200)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestWhoamiEndpointWithUserAuthToken(object):
    def test_api__try_whoami_enpoint_with_user_auth_token_ok_200__nominal_case(
        self, web_testapp, admin_user
    ):
        token = str(admin_user.ensure_auth_token(20))
        transaction.commit()
        query_param = {"access_token": token}
        res = web_testapp.get("/api/auth/whoami", status=200, params=query_param)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["username"] == "TheAdmin"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["has_avatar"] is False
        assert res.json_body["auth_type"] == "internal"
