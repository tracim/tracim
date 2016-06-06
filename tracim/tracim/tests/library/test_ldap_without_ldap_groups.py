# -*- coding: utf-8 -*-
from nose.tools import eq_
from tg import config

from tracim.fixtures.ldap import ldap_test_server_fixtures
from tracim.fixtures.users_and_groups import Test as TestFixtures
from tracim.lib.auth.ldap import LDAPAuth
from tracim.lib.helpers import ini_conf_to_bool
from tracim.model import DBSession, User, Group
from tracim.tests import LDAPTest, TestStandard


class TestContentApi(LDAPTest, TestStandard):
    """
    This test load test.ini app:ldap config. LDAP groups management must be disabled in this config.
    """
    application_under_test = 'ldap'
    ldap_server_data = ldap_test_server_fixtures
    fixtures = [TestFixtures]

    def _check_db_user(self, email, count=1):
        eq_(count, DBSession.query(User).filter(User.email == email).count())

    def test_authenticate_success(self):
        """
        LDAP Auth success
        :return:
        """
        ldap_auth = LDAPAuth(config)
        richard_identity = {'login': 'richard-not-real-email@fsf.org', 'password': 'rms'}

        self._check_db_user('richard-not-real-email@fsf.org', 0)
        auth_id = ldap_auth.ldap_auth.authenticate(environ={}, identity=richard_identity)

        assert auth_id == 'richard-not-real-email@fsf.org'
        self._check_db_user('richard-not-real-email@fsf.org', 1)

    def test_authenticate_fail_wrong_pass(self):
        """
        LDAP Auth fail: wrong password
        :return:
        """
        ldap_auth = LDAPAuth(config)
        richard_identity = {'login': 'richard-not-real-email@fsf.org', 'password': 'wrong pass'}

        self._check_db_user('richard-not-real-email@fsf.org', 0)
        auth_id = ldap_auth.ldap_auth.authenticate(environ={}, identity=richard_identity)

        assert auth_id is None
        self._check_db_user('richard-not-real-email@fsf.org', 0)

    def test_authenticate_fail_wrong_login(self):
        """
        LDAP Auth fail: wrong email
        :return:
        """
        ldap_auth = LDAPAuth(config)
        richard_identity = {'login': 'wrong-email@fsf.org', 'password': 'rms'}

        self._check_db_user('wrong-email@fsf.org', 0)
        auth_id = ldap_auth.ldap_auth.authenticate(environ={}, identity=richard_identity)

        assert auth_id is None
        self._check_db_user('wrong-email@fsf.org', 0)

    def test_internal_groups(self):
        """
        LDAP don't manage groups here: We must retrieve internal groups of tested user
        :return:
        """
        lawrence = DBSession.query(User).filter(User.email == 'lawrence-not-real-email@fsf.local').one()
        managers = DBSession.query(Group).filter(Group.group_name == 'managers').one()
        lawrence_identity = {'user': lawrence}

        # Lawrence is in fixtures: he is in managers group
        self._check_db_user('lawrence-not-real-email@fsf.local', 1)
        assert lawrence in managers.users
        assert False is ini_conf_to_bool(config.get('ldap_group_enabled', False))
        assert ['managers'] == config.get('sa_auth').authmetadata.get_groups(
            identity=lawrence_identity,
            userid=lawrence.email
        )

        should_groups = ['managers']
        are_groups = config.get('sa_auth').authmetadata.get_groups(
            identity=lawrence_identity,
            userid=lawrence.email
        )
        eq_(should_groups,
            are_groups,
            "Permissions should be %s, they are %s" % (should_groups, are_groups))

    def test_internal_permissions(self):
        """
        LDAP don't manage groups here: We must retrieve internal groups permission of tested user
        :return:
        """
        lawrence = DBSession.query(User).filter(User.email == 'lawrence-not-real-email@fsf.local').one()
        managers = DBSession.query(Group).filter(Group.group_name == 'managers').one()
        lawrence_identity = {'user': lawrence}

        # Lawrence is in fixtures: he is in managers group
        self._check_db_user('lawrence-not-real-email@fsf.local', 1)
        assert lawrence in managers.users
        assert False is ini_conf_to_bool(config.get('ldap_group_enabled', False))

        should_permissions = []  # Actually there is no permission
        are_permissions = config.get('sa_auth').authmetadata.get_permissions(
            identity=lawrence_identity,
            userid=lawrence.email
        )
        eq_(should_permissions,
            are_permissions,
            "Permissions should be %s, they are %s" % (should_permissions, are_permissions))

