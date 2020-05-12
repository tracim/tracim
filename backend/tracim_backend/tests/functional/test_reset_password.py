from freezegun import freeze_time
import pytest as pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.models.auth import Profile
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestResetPasswordRequestEndpointMailSync(object):
    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_request__ok__nominal_case_email(self, web_testapp, mailhog):
        params = {"email": "admin@admin.admin"}
        web_testapp.post_json("/api/v2/auth/password/reset/request", status=204, params=params)
        response = mailhog.get_mailhog_mails()
        assert len(response) == 1
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[Tracim] A password reset has been requested"

    def test_api__reset_password_request__ok__nominal_case_username(
        self, user_api_factory, web_testapp, mailhog
    ):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            username="boby",
            profile=profile,
            timezone="Europe/Paris",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()

        params = {"username": "boby"}
        web_testapp.post_json("/api/v2/auth/password/reset/request", status=204, params=params)
        response = mailhog.get_mailhog_mails()
        assert len(response) == 1
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "bob <test@test.test>"
        assert headers["Subject"][0] == "[Tracim] A password reset has been requested"

        uapi.delete(test_user)
        transaction.commit()

    @pytest.mark.email_notification
    @pytest.mark.unknown_auth
    def test_api__reset_password_request__ok__unknown_auth(self, web_testapp, mailhog):
        # create new user without auth (default is unknown)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "en",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]

        # make a request of password
        web_testapp.authorization = None
        params = {"email": "test@test.test"}
        web_testapp.post_json("/api/v2/auth/password/reset/request", status=204, params=params)
        response = mailhog.get_mailhog_mails()
        assert len(response) == 1
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "test user <test@test.test>"
        assert headers["Subject"][0] == "[Tracim] A password reset has been requested"

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_request__err_400__user_not_exist(self, web_testapp, mailhog):
        params = {"email": "this@does.notexist"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/request", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.USER_NOT_FOUND
        response = mailhog.get_mailhog_mails()
        assert len(response) == 0


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestResetPasswordRequestEndpointMailDisabled(object):
    @pytest.mark.internal_auth
    def test_api__reset_password_request__ok__nominal_case(self, web_testapp):
        params = {"email": "admin@admin.admin"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/request", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.NOTIFICATION_DISABLED_CANT_RESET_PASSWORD

    @pytest.mark.unknown_auth
    def test_api__reset_password_request__ok__unknown_auth(self, web_testapp):
        # create new user without auth (default is unknown)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]

        # make a request of password
        web_testapp.authorization = None
        params = {"email": "test@test.test"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/request", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.NOTIFICATION_DISABLED_CANT_RESET_PASSWORD


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestResetPasswordCheckTokenEndpoint(object):
    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_check_token__ok_204__nominal_case(
        self, admin_user, user_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        reset_password_token = uapi.reset_password_notification(admin_user, do_save=True)
        transaction.commit()
        params = {"email": "admin@admin.admin", "reset_password_token": reset_password_token}
        web_testapp.post_json("/api/v2/auth/password/reset/token/check", status=204, params=params)

    @pytest.mark.email_notification
    @pytest.mark.unknown_auth
    def test_api__reset_password_check_token__ok_204__unknown_auth(
        self, web_testapp, user_api_factory
    ):
        # create new user without auth (default is unknown)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]

        # make a check of token
        web_testapp.authorization = None

        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("test@test.test")
        reset_password_token = uapi.reset_password_notification(user, do_save=True)
        transaction.commit()
        params = {"email": "test@test.test", "reset_password_token": reset_password_token}
        web_testapp.post_json("/api/v2/auth/password/reset/token/check", status=204, params=params)

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_check_token__err_400__invalid_token(self, web_testapp):
        reset_password_token = "wrong_token"
        transaction.commit()
        params = {"email": "admin@admin.admin", "reset_password_token": reset_password_token}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/token/check", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INVALID_RESET_PASSWORD_TOKEN


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestResetPasswordModifyEndpoint(object):
    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__ok_204__nominal_case(
        self, user_api_factory, admin_user, web_testapp
    ):

        uapi = user_api_factory.get()
        reset_password_token = uapi.reset_password_notification(admin_user, do_save=True)
        transaction.commit()
        params = {
            "email": "admin@admin.admin",
            "reset_password_token": reset_password_token,
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
        }
        web_testapp.post_json("/api/v2/auth/password/reset/modify", status=204, params=params)
        # check if password is correctly setted
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "mynewpassword"))
        web_testapp.get("/api/v2/auth/whoami", status=200)

    @pytest.mark.email_notification
    @pytest.mark.unknown_auth
    def test_api__reset_password_reset__ok_204__unknown_auth(self, web_testapp, user_api_factory):
        # create new user without auth (default is unknown)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]

        # make a check of token
        web_testapp.authorization = None

        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("test@test.test")
        reset_password_token = uapi.reset_password_notification(user, do_save=True)
        transaction.commit()
        params = {
            "email": "test@test.test",
            "reset_password_token": reset_password_token,
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
        }
        web_testapp.post_json("/api/v2/auth/password/reset/modify", status=204, params=params)
        # check if password is correctly setted
        web_testapp.authorization = ("Basic", ("test@test.test", "mynewpassword"))
        web_testapp.get("/api/v2/auth/whoami", status=200)

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__err_400__invalid_token(self, web_testapp):
        reset_password_token = "wrong_token"
        params = {
            "email": "admin@admin.admin",
            "reset_password_token": reset_password_token,
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
        }
        res = web_testapp.post_json("/api/v2/auth/password/reset/modify", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INVALID_RESET_PASSWORD_TOKEN

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__err_400__expired_token(
        self, web_testapp, user_api_factory, admin_user
    ):

        uapi = user_api_factory.get()
        with freeze_time("1999-12-31 23:59:59"):
            reset_password_token = uapi.reset_password_notification(admin_user, do_save=True)
            params = {
                "email": "admin@admin.admin",
                "reset_password_token": reset_password_token,
                "new_password": "mynewpassword",
                "new_password2": "mynewpassword",
            }
            transaction.commit()
        with freeze_time("2000-01-01 00:00:05"):
            res = web_testapp.post_json(
                "/api/v2/auth/password/reset/modify", status=400, params=params
            )
            assert isinstance(res.json, dict)
            assert "code" in res.json.keys()
            assert res.json_body["code"] == ErrorCode.EXPIRED_RESET_PASSWORD_TOKEN

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__err_400__password_does_not_match(
        self, admin_user, user_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        reset_password_token = uapi.reset_password_notification(admin_user, do_save=True)
        transaction.commit()
        params = {
            "email": "admin@admin.admin",
            "reset_password_token": reset_password_token,
            "new_password": "mynewpassword",
            "new_password2": "anotherpassword",
        }
        res = web_testapp.post_json("/api/v2/auth/password/reset/modify", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.PASSWORD_DO_NOT_MATCH


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_ldap_email_notif_sync_test"}], indirect=True
)
class TestResetPasswordInternalAuthDisabled(object):
    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_request__err__internal_auth_not_activated(self, web_testapp):

        params = {"email": "admin@admin.admin"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/request", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.USER_AUTH_TYPE_DISABLED

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_check_token__err__internal_auth_not_activated(self, web_testapp):
        params = {"email": "admin@admin.admin", "reset_password_token": "unknown"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/token/check", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.USER_AUTH_TYPE_DISABLED

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_modify__err__external_auth_ldap_cant_change_password(
        self, web_testapp
    ):
        params = {
            "email": "admin@admin.admin",
            "reset_password_token": "unknown",
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
        }
        res = web_testapp.post_json("/api/v2/auth/password/reset/modify", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.USER_AUTH_TYPE_DISABLED


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_ldap_email_notif_sync_test"}], indirect=True
)
class TestResetPasswordExternalAuthUser(object):
    @pytest.mark.email_notification
    @pytest.mark.ldap
    def test_api__reset_password_request__err__external_auth_ldap_cant_change_password(
        self, web_testapp
    ):
        # precreate user
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        web_testapp.get("/api/v2/auth/whoami", status=200)

        params = {"email": "hubert@planetexpress.com"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/request", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED

    @pytest.mark.email_notification
    @pytest.mark.ldap
    def test_api__reset_password_check_token__err__external_auth_ldap_cant_change_password(
        self, web_testapp
    ):
        # precreate user
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        web_testapp.get("/api/v2/auth/whoami", status=200)

        params = {"email": "hubert@planetexpress.com", "reset_password_token": "unknown"}
        res = web_testapp.post_json(
            "/api/v2/auth/password/reset/token/check", status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED

    @pytest.mark.email_notification
    @pytest.mark.ldap
    def test_api__reset_password_modify__err__external_auth_ldap_cant_change_password(
        self, web_testapp
    ):
        # precreate user
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        web_testapp.get("/api/v2/auth/whoami", status=200)

        params = {
            "email": "hubert@planetexpress.com",
            "reset_password_token": "unknown",
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
        }
        res = web_testapp.post_json("/api/v2/auth/password/reset/modify", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED
