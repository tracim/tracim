import pytest as pytest
import requests
import transaction
from freezegun import freeze_time
from tracim_backend.models.auth import User
from tracim_backend import error
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import FunctionalTest
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.user import UserApi


class TestResetPasswordRequestEndpointMailSync(FunctionalTest):

    fixtures = [BaseFixture]
    config_section = 'functional_test_with_mail_test_sync'

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_request__ok__nominal_case(self):
        requests.delete('http://127.0.0.1:8025/api/v1/messages')
        params = {
            'email': 'admin@admin.admin'
        }
        self.testapp.post_json(
            '/api/v2/auth/password/reset/request',
            status=204,
            params=params,
        )
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        assert len(response) == 1
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == 'Tracim Notifications <test_user_from+0@localhost>'  # nopep8
        assert headers['To'][0] == 'Global manager <admin@admin.admin>'
        assert headers['Subject'][0] == '[TRACIM] Reset Password Request'
        requests.delete('http://127.0.0.1:8025/api/v1/messages')

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_request__err_400__user_not_exist(self):
        requests.delete('http://127.0.0.1:8025/api/v1/messages')
        params = {
            'email': 'this@does.notexist'
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/request',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_NOT_FOUND
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        assert len(response) == 0
        requests.delete('http://127.0.0.1:8025/api/v1/messages')


class TestResetPasswordRequestEndpointMailDisabled(FunctionalTest):

    fixtures = [BaseFixture]

    @pytest.mark.internal_auth
    def test_api__reset_password_request__ok__nominal_case(self):
        requests.delete('http://127.0.0.1:8025/api/v1/messages')
        params = {
            'email': 'admin@admin.admin'
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/request',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.NOTIFICATION_DISABLED_CANT_RESET_PASSWORD  # nopep8


class TestResetPasswordCheckTokenEndpoint(FunctionalTest):
    config_section = 'functional_test_with_mail_test_sync'

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_check_token__ok_204__nominal_case(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        reset_password_token = uapi.reset_password_notification(admin, do_save=True) # nopep8
        transaction.commit()
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': reset_password_token
        }
        self.testapp.post_json(
            '/api/v2/auth/password/reset/token/check',
            status=204,
            params=params,
        )

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_check_token__err_400__invalid_token(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        reset_password_token = 'wrong_token'
        transaction.commit()
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': reset_password_token
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/token/check',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INVALID_RESET_PASSWORD_TOKEN


class TestResetPasswordModifyEndpoint(FunctionalTest):
    config_section = 'functional_test_with_mail_test_sync'

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__ok_204__nominal_case(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        reset_password_token = uapi.reset_password_notification(admin, do_save=True)  # nopep8
        transaction.commit()
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': reset_password_token,
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
        }
        self.testapp.post_json(
            '/api/v2/auth/password/reset/modify',
            status=204,
            params=params,
        )

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__err_400__invalid_token(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        reset_password_token = 'wrong_token'
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': reset_password_token,
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/modify',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.INVALID_RESET_PASSWORD_TOKEN

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__err_400__expired_token(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        with freeze_time("1999-12-31 23:59:59"):
            reset_password_token = uapi.reset_password_notification(
                admin,
                do_save=True
            )
            params = {
                'email': 'admin@admin.admin',
                'reset_password_token': reset_password_token,
                'new_password': 'mynewpassword',
                'new_password2': 'mynewpassword',
            }
            transaction.commit()
        with freeze_time("2000-01-01 00:00:05"):
            res = self.testapp.post_json(
                '/api/v2/auth/password/reset/modify',
                status=400,
                params=params,
            )
            assert isinstance(res.json, dict)
            assert 'code' in res.json.keys()
            assert res.json_body['code'] == error.EXPIRED_RESET_PASSWORD_TOKEN  # nopep8

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_reset__err_400__password_does_not_match(self):
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        uapi = UserApi(
            current_user=admin,
            session=dbsession,
            config=self.app_config,
        )
        reset_password_token = uapi.reset_password_notification(admin, do_save=True)  # nopep8
        transaction.commit()
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': reset_password_token,
            'new_password': 'mynewpassword',
            'new_password2': 'anotherpassword',
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/modify',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.PASSWORD_DO_NOT_MATCH


class TestResetPasswordInternalAuthDisabled(FunctionalTest):
    config_section = 'functional_ldap_email_notif_sync_test'

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_request__err__internal_auth_not_activated(self):

        params = {
            'email': 'admin@admin.admin'
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/request',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_AUTH_TYPE_DISABLED

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_check_token__err__internal_auth_not_activated(self):
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': 'unknown'
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/token/check',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_AUTH_TYPE_DISABLED

    @pytest.mark.email_notification
    @pytest.mark.internal_auth
    def test_api__reset_password_modify__err__external_auth_ldap_cant_change_password(self):
        params = {
            'email': 'admin@admin.admin',
            'reset_password_token': 'unknown',
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/modify',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.USER_AUTH_TYPE_DISABLED


class TestResetPasswordExternalAuthUser(FunctionalTest):
    config_section = 'functional_ldap_email_notif_sync_test'

    @pytest.mark.email_notification
    @pytest.mark.ldap
    def test_api__reset_password_request__err__external_auth_ldap_cant_change_password(self):
        # precreate user
        self.testapp.authorization = (
            'Basic',
            (
                'hubert@planetexpress.com',
                'professor'
            )
        )
        res = self.testapp.get(
            '/api/v2/auth/whoami',
            status=200,
        )

        params = {
            'email': 'hubert@planetexpress.com'
        }
        res=self.testapp.post_json(
            '/api/v2/auth/password/reset/request',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED

    @pytest.mark.email_notification
    @pytest.mark.ldap
    def test_api__reset_password_check_token__err__external_auth_ldap_cant_change_password(self):
        # precreate user
        self.testapp.authorization = (
            'Basic',
            (
                'hubert@planetexpress.com',
                'professor'
            )
        )
        res = self.testapp.get(
            '/api/v2/auth/whoami',
            status=200,
        )

        params = {
            'email': 'hubert@planetexpress.com',
            'reset_password_token': 'unknown'
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/token/check',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED


    @pytest.mark.email_notification
    @pytest.mark.ldap
    def test_api__reset_password_modify__err__external_auth_ldap_cant_change_password(self):
        # precreate user
        self.testapp.authorization = (
            'Basic',
            (
                'hubert@planetexpress.com',
                'professor'
            )
        )
        res = self.testapp.get(
            '/api/v2/auth/whoami',
            status=200,
        )

        params = {
            'email': 'hubert@planetexpress.com',
            'reset_password_token': 'unknown',
            'new_password': 'mynewpassword',
            'new_password2': 'mynewpassword',
        }
        res = self.testapp.post_json(
            '/api/v2/auth/password/reset/modify',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert res.json_body['code'] == error.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED