# -*- coding: utf-8 -*-
"""
Integration tests for the ldap authentication sub-system.
"""
from nose.tools import eq_
from tg import config

from tracim.model import DBSession, User
from tracim.tests import LDAPTest, TracimTestController


class TestAuthentication(LDAPTest, TracimTestController):
    application_under_test = 'ldap'
    ldap_server_data = {
            'port': 3333,
            'password': 'toor',

            'bind_dn': 'cn=admin,dc=directory,dc=fsf,dc=org',
            'base': {
                'objectclass': ['dcObject', 'organization'],
                'dn': 'dc=directory,dc=fsf,dc=org',
                'attributes': {
                    'o': 'Free Software Foundation',
                    'dc': 'directory'
                }
            },

            'entries': [
                {
                    'objectclass': ['organizationalRole'],
                    'dn': 'cn=admin,dc=directory,dc=fsf,dc=org',
                    'attributes': {
                        'cn': 'admin'
                    }
                },
                {
                    'objectclass': ['organizationalUnit'],
                    'dn': 'ou=people,dc=directory,dc=fsf,dc=org',
                    'attributes': {
                        'ou': 'people',
                    }
                },
                {
                    'objectclass': ['organizationalUnit'],
                    'dn': 'ou=groups,dc=directory,dc=fsf,dc=org',
                    'attributes': {
                        'ou': 'groups',
                    }
                },
                {
                    'objectclass': ['account', 'top'],
                    'dn': 'cn=richard-not-real-email@fsf.org,ou=people,dc=directory,dc=fsf,dc=org',
                    'attributes': {
                        'uid': 'richard-not-real-email@fsf.org',
                        'userPassword': 'rms',
                        'mail': 'richard-not-real-email@fsf.org'
                    }
                },
            ]
        }

    def test_ldap_auth_fail(self):
        # User is unknown in tracim database
        eq_(0, DBSession.query(User).filter(User.email == 'unknown-user@fsf.org').count())

        self._connect_user('unknown-user@fsf.org', 'no-pass')

        # User is registered in tracim database
        eq_(0, DBSession.query(User).filter(User.email == 'unknown-user@fsf.org').count())
        DBSession.close()

    def test_ldap_auth_sync(self):
        # User is unknown in tracim database
        eq_(0, DBSession.query(User).filter(User.email == 'richard-not-real-email@fsf.org').count())

        self._connect_user('richard-not-real-email@fsf.org', 'rms')

        # User is registered in tracim database
        eq_(1, DBSession.query(User).filter(User.email == 'richard-not-real-email@fsf.org').count())
        DBSession.close()
