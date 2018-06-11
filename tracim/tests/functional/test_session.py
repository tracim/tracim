# coding=utf-8
import pytest
from sqlalchemy.exc import OperationalError

from tracim.tests import FunctionalTest
from tracim.tests import FunctionalTestNoDB


class TestLogoutEndpoint(FunctionalTest):

    def test_api__access_logout_get_enpoint__ok__nominal_case(self):
        res = self.testapp.post_json('/api/v2/sessions/logout', status=204)

    def test_api__access_logout_post_enpoint__ok__nominal_case(self):
        res = self.testapp.get('/api/v2/sessions/logout', status=204)


class TestLoginEndpointUnititedDB(FunctionalTestNoDB):

    def test_api__try_login_enpoint__err_500__no_inited_db(self):
        params = {
            'email': 'admin@admin.admin',
            'password': 'admin@admin.admin',
        }
        res = self.testapp.post_json(
            '/api/v2/sessions/login',
            params=params,
            status=500,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestLoginEndpoint(FunctionalTest):

    def test_api__try_login_enpoint__ok_200__nominal_case(self):
        params = {
            'email': 'admin@admin.admin',
            'password': 'admin@admin.admin',
        }
        res = self.testapp.post_json(
            '/api/v2/sessions/login',
            params=params,
            status=200,
        )
        assert res.json_body['display_name'] == 'Global manager'
        assert res.json_body['email'] == 'admin@admin.admin'
        assert res.json_body['created']
        assert res.json_body['is_active']
        assert res.json_body['profile']
        assert isinstance(res.json_body['profile']['id'], int)
        assert res.json_body['profile']['slug'] == 'administrators'
        assert res.json_body['caldav_url'] is None
        assert res.json_body['avatar_url'] is None

    def test_api__try_login_enpoint__err_400__bad_password(self):
        params = {
            'email': 'admin@admin.admin',
            'password': 'bad_password',
        }
        res = self.testapp.post_json(
            '/api/v2/sessions/login',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__try_login_enpoint__err_400__unregistered_user(self):
        params = {
            'email': 'unknown_user@unknown.unknown',
            'password': 'bad_password',
        }
        res = self.testapp.post_json(
            '/api/v2/sessions/login',
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()

    def test_api__try_login_enpoint__err_400__no_json_body(self):
        res = self.testapp.post_json('/api/v2/sessions/login', status=400)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()


class TestWhoamiEndpoint(FunctionalTest):

    def test_api__try_whoami_enpoint__ok_200__nominal_case(self):
        self.testapp.authorization = (
            'Basic',
            (
                'admin@admin.admin',
                'admin@admin.admin'
            )
        )
        res = self.testapp.get('/api/v2/sessions/whoami', status=200)
        assert res.json_body['display_name'] == 'Global manager'
        assert res.json_body['email'] == 'admin@admin.admin'
        assert res.json_body['created']
        assert res.json_body['is_active']
        assert res.json_body['profile']
        assert isinstance(res.json_body['profile']['id'], int)
        assert res.json_body['profile']['slug'] == 'administrators'
        assert res.json_body['caldav_url'] is None
        assert res.json_body['avatar_url'] is None

    def test_api__try_whoami_enpoint__err_401__unauthenticated(self):
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/sessions/whoami', status=401)
        assert isinstance(res.json, dict)
        assert 'code' in res.json.keys()
        assert 'message' in res.json.keys()
        assert 'details' in res.json.keys()
