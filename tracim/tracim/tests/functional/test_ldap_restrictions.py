# -*- coding: utf-8 -*-
from collections import OrderedDict

from bs4 import BeautifulSoup
from nose.tools import eq_, ok_

from tracim.fixtures.ldap import ldap_test_server_fixtures
from tracim.lib.base import current_user
from tracim.model import DBSession, User
from tracim.tests import LDAPTest, TracimTestController


class TestAuthentication(LDAPTest, TracimTestController):
    application_under_test = 'ldap'
    ldap_server_data = ldap_test_server_fixtures

    def test_password_disabled(self):
        """
        Password change is disabled
        :return:
        """
        lawrence = DBSession.query(User).filter(User.email == 'lawrence-not-real-email@fsf.org').one()
        self._connect_user('lawrence-not-real-email@fsf.org', 'foobarbaz')
        home = self.app.get('/home/',)

        # HTML button is not here
        eq_(None, BeautifulSoup(home.body).find(attrs={'class': 'change-password-btn'}))

        # If we force passwd update, we got 403
        try_post_passwd = self.app.post(
            '/user/%d/password?_method=PUT' % lawrence.user_id,
            OrderedDict([
                ('current_password', 'fooobarbaz'),
                ('new_password1', 'foobar'),
                ('new_password2', 'foobar'),
            ]),
            expect_errors=403
        )
        eq_(try_post_passwd.status_code, 403, "Code should be 403, but is %d" % try_post_passwd.status_code)

    def test_fields_disabled(self):
        """
        Some fields (email) are not editable on user interface: they are managed by LDAP
        :return:
        """
        lawrence = DBSession.query(User).filter(User.email == 'lawrence-not-real-email@fsf.org').one()
        self._connect_user('lawrence-not-real-email@fsf.org', 'foobarbaz')

        edit = self.app.get('/user/5/edit')

        # email input field is disabled
        email_input = BeautifulSoup(edit.body).find(attrs={'id': 'email'})
        ok_('readonly' in email_input.attrs)
        eq_(email_input.attrs['readonly'], "readonly")

        # Name is not (see attributes configuration of LDAP fixtures)
        name_input = BeautifulSoup(edit.body).find(attrs={'id': 'name'})
        ok_('readonly' not in name_input.attrs)

        # If we force edit of user, "email" field will be not updated
        eq_(lawrence.email, 'lawrence-not-real-email@fsf.org')
        eq_(lawrence.display_name, 'Lawrence L.')

        try_post_user = self.app.post(
            '/user/%d?_method=PUT' % lawrence.user_id,
            OrderedDict([
                ('name', 'Lawrence Lessig YEAH'),
                ('email', 'An-other-email@fsf.org'),
            ])
        )

        eq_(try_post_user.status_code, 302, "Code should be 302, but is %d" % try_post_user.status_code)

        lawrence = DBSession.query(User).filter(User.email == 'lawrence-not-real-email@fsf.org').one()
        eq_(lawrence.email, 'lawrence-not-real-email@fsf.org', "email should be unmodified")
        eq_(lawrence.display_name, 'Lawrence Lessig YEAH', "Name should be updated")
