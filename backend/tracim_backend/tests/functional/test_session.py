# coding=utf-8
import datetime

from freezegun import freeze_time
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.tests import FunctionalTest
from tracim_backend.tests import FunctionalTestNoDB


class TestLogoutEndpoint(FunctionalTest):
    def test_api__access_logout_get_enpoint__ok__nominal_case(self):
        self.testapp.post_json("/api/v2/auth/logout", status=204)

    def test_api__access_logout_post_enpoint__ok__nominal_case(self):
        self.testapp.get("/api/v2/auth/logout", status=204)


class TestLoginEndpointUnititedDB(FunctionalTestNoDB):
    def test_api__try_login_enpoint__err_500__no_inited_db(self):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=500)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


class TestLoginEndpoint(FunctionalTest):
    def test_api__try_login_enpoint__ok_200__nominal_case(self):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
        assert res.json_body["created"]
        datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_login_enpoint__ok_200__insensitive_to_case(self):
        params = {"email": "ADMIN@ADMIN.ADMIN", "password": "admin@admin.admin"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
        assert res.json_body["email"] == "admin@admin.admin"

        params = {"email": "aDmIn@AdmIn.AdMIn", "password": "admin@admin.admin"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
        assert res.json_body["email"] == "admin@admin.admin"

    def test_api__try_login_enpoint__err_401__user_not_activated(self):

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()

        params = {"email": "test@test.test", "password": "test@test.test"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED

    def test_api__try_login_enpoint__err_403__bad_password(self):
        params = {"email": "admin@admin.admin", "password": "bad_password"}
        res = self.testapp.post_json("/api/v2/auth/login", status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint__err_403__unregistered_user(self):
        params = {"email": "unknown_user@unknown.unknown", "password": "bad_password"}
        res = self.testapp.post_json("/api/v2/auth/login", status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint__err_400__no_json_body(self):
        res = self.testapp.post_json("/api/v2/auth/login", status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


class TestLDAPAuthOnlyEndpoint(FunctionalTest):
    config_section = "functional_ldap_test"

    def test_api__try_login_enpoint_ldap_auth__ok_200__valid_ldap_user(self):
        params = {"email": "hubert@planetexpress.com", "password": "professor"}
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

    def test_api__try_login_enpoint_ldap_auth__err_403__valid_internal_db_user(self):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_login_enpoint_ldap_auth__err_403__unvalid_user(self):
        params = {"email": "unknown@unknown.unknown", "password": "unknown@unknown.unknown"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__ok__200__valid_ldap_user(self):
        self.testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__err__403__valid_internal_db_user(self):
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        self.testapp.get("/api/v2/auth/whoami", status=401)

    def test_api_try_whoami_basic_auth_endpoint_ldap_auth__err__403__unvalid_user(self):
        self.testapp.authorization = (
            "Basic",
            ("unknown@unknown.unknown", "unknown@unknown.unknown"),
        )
        self.testapp.get("/api/v2/auth/whoami", status=401)


class TestLDAPandInternalAuthOnlyEndpoint(FunctionalTest):
    config_section = "functional_ldap_and_internal_test"

    def test_api__try_login_enpoint_ldap_internal_auth__ok_200__valid_ldap_user(self):
        params = {"email": "hubert@planetexpress.com", "password": "professor"}
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

    def test_api__try_login_enpoint_ldap_internal_auth__ok__200__valid_internal_db_user(self):
        params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
        assert res.json_body["created"]
        datetime.datetime.strptime(res.json_body["created"], "%Y-%m-%dT%H:%M:%SZ")
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_login_enpoint_ldap_internal_auth__err_403__unvalid_user(self):
        params = {"email": "unknown@unknown.unknown", "password": "unknown@unknown.unknown"}
        res = self.testapp.post_json("/api/v2/auth/login", params=params, status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] == ErrorCode.AUTHENTICATION_FAILED
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api_try_whoami_basic_auth_endpoint_ldap_internal_auth__ok__200__valid_ldap_user(self):
        self.testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        # user creation
        with freeze_time("1999-12-31 23:59:59"):
            creation_date = datetime.datetime.utcnow()
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

        with freeze_time("2002-01-01 12:00:00"):
            # normal login
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
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
            assert res.json_body["avatar_url"] is None
            assert res.json_body["auth_type"] == "ldap"

    def test_api_try_whoami_basic_auth_endpoint_ldap_internal_auth__ok__200__valid_internal_db_user(
        self
    ):
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/auth/whoami", status=200)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["lang"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api_try_whoami_basic_auth_endpoint_ldap_internal_auth__err__403__unvalid_user(self):
        self.testapp.authorization = (
            "Basic",
            ("unknown@unknown.unknown", "unknown@unknown.unknown"),
        )
        self.testapp.get("/api/v2/auth/whoami", status=401)


class TestWhoamiEndpoint(FunctionalTest):
    def test_api__try_whoami_enpoint__ok_200__nominal_case(self):
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/auth/whoami", status=200)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["lang"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_whoami_enpoint__ok_200__insensitive_to_case(self):
        self.testapp.authorization = ("Basic", ("ADMIN@ADMIN.ADMIN", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/auth/whoami", status=200)
        assert res.json_body["email"] == "admin@admin.admin"

        self.testapp.authorization = ("Basic", ("aDmIn@AdmIn.AdMIn", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/auth/whoami", status=200)
        assert res.json_body["email"] == "admin@admin.admin"

    def test_api__try_whoami_enpoint__err_401__user_is_not_active(self):

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "password"))

        res = self.testapp.get("/api/v2/auth/whoami", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        # INFO - G.M - 2018-09-10 - Handled by marshmallow_schema
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_whoami_enpoint__err_401__unauthenticated(self):
        self.testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = self.testapp.get("/api/v2/auth/whoami", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


class TestWhoamiEndpointWithApiKey(FunctionalTest):
    def test_api__try_whoami_enpoint_with_api_key__ok_200__nominal_case(self):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "admin@admin.admin"}
        res = self.testapp.get("/api/v2/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["public_name"] == "Global manager"
        assert res.json_body["email"] == "admin@admin.admin"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "administrators"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["auth_type"] == "internal"

    def test_api__try_whoami_enpoint_with_api_key__ok_200__case_insensitive_email(self):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "ADMIN@ADMIN.ADMIN"}
        res = self.testapp.get("/api/v2/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["email"] == "admin@admin.admin"

        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "aDmIn@AdmIn.AdMIn"}
        res = self.testapp.get("/api/v2/auth/whoami", status=200, headers=headers_auth)
        assert res.json_body["email"] == "admin@admin.admin"

    def test_api__try_whoami_enpoint__err_401__user_is_not_active(self):

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "test@test.test"}
        res = self.testapp.get("/api/v2/auth/whoami", status=401, headers=headers_auth)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None

    def test_api__try_whoami_enpoint__err_401__unauthenticated(self):
        headers_auth = {"Tracim-Api-Key": "mysuperapikey", "Tracim-Api-Login": "john@doe.doe"}
        res = self.testapp.get("/api/v2/auth/whoami", status=401, headers=headers_auth)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


class TestWhoamiEndpointWithApiKeyNoKey(FunctionalTest):
    def test_api__try_whoami_enpoint_with_api_key__err_401__no_api_key(self):
        headers_auth = {"Tracim-Api-Key": "", "Tracim-Api-Login": "admin@admin.admin"}
        self.testapp.get("/api/v2/auth/whoami", status=401, headers=headers_auth)


class TestWhoamiEndpointWithRemoteHeader(FunctionalTest):
    config_section = "functional_test_remote_auth"

    def test_api__try_whoami_enpoint_remote_user__err_401__as_http_header(self):
        headers_auth = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        self.testapp.get("/api/v2/auth/whoami", status=401, headers=headers_auth)

    def test_api__try_whoami_enpoint_remote_user__ok_200__case_insensitive_email(self):
        extra_environ = {"REMOTE_USER": "REMOTEUSER@REMOTEUSER.REMOTEUSER"}
        res = self.testapp.get("/api/v2/auth/whoami", status=200, extra_environ=extra_environ)
        extra_environ = {"REMOTE_USER": "ReMoTeUser@rEmoTEUSer.rEMoTeusEr"}
        res = self.testapp.get("/api/v2/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["email"] == "remoteuser@remoteuser.remoteuser"

    def test_api__try_whoami_enpoint_remote_user__ok_200__nominal_case(self):

        extra_environ = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        res = self.testapp.get("/api/v2/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["public_name"] == "remoteuser"
        assert res.json_body["email"] == "remoteuser@remoteuser.remoteuser"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "users"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["auth_type"] == "remote"
        user_id = res.json_body["user_id"]

        res = self.testapp.get("/api/v2/auth/whoami", status=200, extra_environ=extra_environ)
        assert res.json_body["public_name"] == "remoteuser"
        assert res.json_body["email"] == "remoteuser@remoteuser.remoteuser"
        assert res.json_body["created"]
        assert res.json_body["is_active"]
        assert res.json_body["profile"]
        assert res.json_body["profile"] == "users"
        assert res.json_body["avatar_url"] is None
        assert res.json_body["auth_type"] == "remote"
        assert res.json_body["user_id"] == user_id

    def test_api__try_whoami_enpoint__err_401__remote_user_is_not_active(self):

        uapi = self.get_user_api()
        gapi = self.get_group_api()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.disable(test_user)
        transaction.commit()
        extra_environ = {"REMOTE_USER": "test@test.test"}
        res = self.testapp.get("/api/v2/auth/whoami", status=401, extra_environ=extra_environ)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None

    def test_api__try_whoami_enpoint__err_401__remote_user_unauthenticated(self):
        res = self.testapp.get("/api/v2/auth/whoami", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    def test_api__try_whoami_enpoint__err_401__remote_user_bad_email(self):
        extra_environ = {"REMOTE_USER": ""}
        res = self.testapp.get("/api/v2/auth/whoami", status=401, extra_environ=extra_environ)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


class TestSessionEndpointWithCookieAuthToken(FunctionalTest):
    config_section = "functional_test_with_cookie_auth"

    def test_api__test_cookie_auth_token__ok__nominal(self):
        with freeze_time("1999-12-31 23:59:59"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_1 = self.testapp.cookies["session_key"]

        # session_id should not be return before x time
        with freeze_time("2000-01-01 00:00:00"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_2 = self.testapp.cookies["session_key"]
            assert user_session_key_1 == user_session_key_2

        # after x time session_id should be renew
        with freeze_time("2000-01-01 00:02:01"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_3 = self.testapp.cookies["session_key"]
            assert user_session_key_3 != user_session_key_2

        # after too much time, session_id should be revoked
        with freeze_time("2000-01-01 00:12:02"):
            res = self.testapp.get("/api/v2/auth/whoami", params=params, status=401)
            assert "Set-Cookie" in res.headers

    def test_api__test_cookie_auth_token__ok__change_email_dont_break_cookie(self):
        """
        Test if email change doesn't break cookie auth
        :return:
        """

        with freeze_time("1999-12-31 23:59:58"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_1 = self.testapp.cookies["session_key"]

        # change own email
        with freeze_time("1999-12-31 23:59:59"):
            params = {
                "email": "mysuperemail@email.fr",
                "loggedin_user_password": "admin@admin.admin",
            }
            self.testapp.put_json(
                "/api/v2/users/{}/email".format(self.get_admin_user().user_id),
                params=params,
                status=200,
            )
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_2 = self.testapp.cookies["session_key"]
            assert user_session_key_1 == user_session_key_2

        # session_id should not be return before x time
        with freeze_time("2000-01-01 00:00:00"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_3 = self.testapp.cookies["session_key"]
            assert user_session_key_3 == user_session_key_2

        # after x time session_id should be renew
        with freeze_time("2000-01-01 00:02:01"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_4 = self.testapp.cookies["session_key"]
            assert user_session_key_4 != user_session_key_3

        # after too much time, session_id should be revoked
        with freeze_time("2000-01-01 00:12:02"):
            res = self.testapp.get("/api/v2/auth/whoami", params=params, status=401)
            assert "Set-Cookie" in res.headers

    def test_api__test_cookie_auth_token__ok__revocation_case(self):
        with freeze_time("1999-12-31 23:59:59"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_1 = self.testapp.cookies["session_key"]

        with freeze_time("2000-01-01 00:00:00"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_2 = self.testapp.cookies["session_key"]
            assert user_session_key_1 == user_session_key_2

            res = self.testapp.post_json("/api/v2/auth/logout", status=204)
            assert "Set-Cookie" in res.headers

        with freeze_time("2000-01-01 00:00:02"):
            res = self.testapp.get("/api/v2/auth/whoami", status=401)
            assert "Set-Cookie" in res.headers
            assert isinstance(res.json, dict)
            assert "code" in res.json.keys()
            assert res.json_body["code"] is None
            assert "message" in res.json.keys()
            assert "details" in res.json.keys()

        # test replay old token
        with freeze_time("2000-01-01 00:00:04"):
            self.testapp.reset()
            self.testapp.set_cookie("session_key", user_session_key_1)
            res = self.testapp.get("/api/v2/auth/whoami", status=401)
            assert isinstance(res.json, dict)
            assert "code" in res.json.keys()
            assert res.json_body["code"] is None
            assert "message" in res.json.keys()
            assert "details" in res.json.keys()

    def test_api__test_cookie_auth_token__ok__reissue_revocation_case(self):
        with freeze_time("1999-12-31 23:59:59"):
            params = {"email": "admin@admin.admin", "password": "admin@admin.admin"}
            res = self.testapp.post_json("/api/v2/auth/login", params=params, status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_1 = self.testapp.cookies["session_key"]

        # session_id should not be return before x time
        with freeze_time("2000-01-01 00:00:00"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" not in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_2 = self.testapp.cookies["session_key"]
            assert user_session_key_1 == user_session_key_2

        # after x time session_id should be renew
        with freeze_time("2000-01-01 00:02:01"):
            res = self.testapp.get("/api/v2/auth/whoami", status=200)
            assert "Set-Cookie" in res.headers
            assert "session_key" in self.testapp.cookies
            user_session_key_3 = self.testapp.cookies["session_key"]
            assert user_session_key_3 != user_session_key_2

        # test replay old token
        with freeze_time("2000-01-01 00:02:03"):
            self.testapp.reset()
            self.testapp.set_cookie("session_key", user_session_key_1)
            self.testapp.get("/api/v2/auth/whoami", status=200)

        # test replay old token after timeout
        with freeze_time("2000-01-01 00:12:04"):
            self.testapp.reset()
            self.testapp.set_cookie("session_key", user_session_key_1)
            res = self.testapp.get("/api/v2/auth/whoami", status=401)
            assert isinstance(res.json, dict)
            assert "code" in res.json.keys()
            assert res.json_body["code"] is None
            assert "message" in res.json.keys()
            assert "details" in res.json.keys()
