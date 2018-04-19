# coding=utf-8
from tracim.tests import FunctionalTest


class TestLogoutEndpoint(FunctionalTest):

    def test_logout(self):
        res = self.testapp.get('/api/v2/sessions/logout', status=200)
        assert res.json_body == {'message': 'ok'}


class TestLoginEndpoint(FunctionalTest):

    def test_login_ok(self):
        params = {
            'email': 'admin@admin.admin',
            'password': 'admin@admin.admin',
        }
        res = self.testapp.get(
            '/api/v2/sessions/login',
            status=200,
            params=params
        )
        assert res.json_body == {'message': 'ok'}

    def test_bad_password(self):
        params = {
            'email': 'admin@admin.admin',
            'password': 'bad_password',
        }
        res = self.testapp.get(
            '/api/v2/sessions/login',
            status=400,
            params=params,
        )

    def test_bad_user(self):
        params = {
            'email': 'unknown_user@unknown.unknown',
            'password': 'bad_password',
        }
        res = self.testapp.get(
            '/api/v2/sessions/login',
            status=400,
            params=params,
        )

    def test_uncomplete(self):
        res = self.testapp.get('/api/v2/sessions/login', status=400)


class TestWhoamiEndpoint(FunctionalTest):

    def test_login_ok(self):
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

    def test_unauthenticated(self):
        self.testapp.authorization = (
            'Basic',
            (
                'john@doe.doe',
                'lapin'
            )
        )
        res = self.testapp.get('/api/v2/sessions/whoami', status=401)
