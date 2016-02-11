# -*- coding: utf-8 -*-
"""
Integration tests for the ldap authentication sub-system.
"""
from tracim.fixtures.ldap import ldap_test_server_fixtures
from nose.tools import eq_

from tracim.model import DBSession, User
from tracim.tests import LDAPTest, TracimTestController


class TestAuthentication(LDAPTest, TracimTestController):
    application_under_test = 'ldap'
    ldap_server_data = ldap_test_server_fixtures

    def test_ldap_auth_fail(self):
        # User is unknown in tracim database
        eq_(0, DBSession.query(User).filter(User.email == 'unknown-user@fsf.org').count())

        self._connect_user('unknown-user@fsf.org', 'no-pass')

        # User is registered in tracim database
        eq_(0, DBSession.query(User).filter(User.email == 'unknown-user@fsf.org').count())

    def test_ldap_auth_sync(self):
        # User is unknown in tracim database
        eq_(0, DBSession.query(User).filter(User.email == 'richard-not-real-email@fsf.org').count())

        self._connect_user('richard-not-real-email@fsf.org', 'rms')

        # User is registered in tracim database
        eq_(1, DBSession.query(User).filter(User.email == 'richard-not-real-email@fsf.org').count())
