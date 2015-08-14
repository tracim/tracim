# -*- coding: utf-8 -*-
"""
Integration tests for the :mod:`repoze.who`-powered authentication sub-system.

As tracim grows and the authentication method changes, only these tests
should be updated.

"""
from __future__ import unicode_literals

from nose.tools import eq_, ok_

from tracim.lib.user import UserApi
from tracim.tests import TestController


class TestAuthentication(TestController):
    """
    Tests for the default authentication setup.

    If your application changes how the authentication layer is configured
    those tests should be updated accordingly
    """

    application_under_test = 'main'

    login = 'admin@admin.admin'
    password = 'admin@admin.admin'

    def test_forced_login(self):
        """Anonymous users are forced to login

        Test that anonymous users are automatically redirected to the login
        form when authorization is denied. Next, upon successful login they
        should be redirected to the initially requested page.

        """

        # Requesting a protected area
        resp = self.app.get('/home/', status=302)
        ok_( resp.location.startswith('http://localhost/login'))
        # Getting the login form:
        resp = resp.follow(status=200)
        form = resp.form
        # Submitting the login form:
        form['login'] = self.login
        form['password'] = self.password
        post_login = form.submit(status=302)
        # Being redirected to the initially requested page:
        ok_(post_login.location.startswith('http://localhost/post_login'))
        initial_page = post_login.follow(status=302)
        ok_('authtkt' in initial_page.request.cookies,
            "Session cookie wasn't defined: %s" % initial_page.request.cookies)
        ok_(initial_page.location.startswith('http://localhost/home/'),
            initial_page.location)


    def test_voluntary_login(self):
        """Voluntary logins must work correctly"""
        # Going to the login form voluntarily:
        resp = self.app.get('/', status=200)
        form = resp.form
        # Submitting the login form:
        form['login'] = self.login
        form['password'] = self.password
        post_login = form.submit(status=302)

        # Being redirected to the home page:
        ok_(post_login.location.startswith('http://localhost/post_login'))
        # FIXME - D.A - 2014-12-04 - Why double redirect to post_login ?!
        home_page = post_login.follow(status=302)
        real_home_page = home_page.follow(status=302)
        ok_('authtkt' in real_home_page.request.cookies,
            'Session cookie was not defined: %s' % real_home_page.request.cookies)
        eq_(real_home_page.location, 'http://localhost/home')

    def test_logout(self):
        """Logouts must work correctly"""
        # Logging in voluntarily the quick way:
        resp = self.app.get('/login_handler?login={}&password={}'.format(self.login, self.password),
                            status=302)
        resp = resp.follow(status=302)
        ok_('authtkt' in resp.request.cookies,
            'Session cookie was not defined: %s' % resp.request.cookies)
        # Logging out:
        resp = self.app.get('/logout_handler', status=302)
        ok_(resp.location.startswith('http://localhost/post_logout'))
        # Finally, redirected to the home page:
        home_page = resp.follow(status=302)
        authtkt = home_page.request.cookies.get('authtkt')
        ok_(not authtkt or authtkt == 'INVALID',
            'Session cookie was not deleted: %s' % home_page.request.cookies)
        eq_(home_page.location, 'http://localhost/')
