# -*- coding: utf-8 -*-
"""
Functional test suite for the root controller.

This is an example of how functional tests can be written for controllers.

As opposed to a unit-test, which test a small unit of functionality,
functional tests exercise the whole application and its WSGI stack.

Please read http://pythonpaste.org/webtest/ for more information.

"""

from bs4 import BeautifulSoup

from nose.tools import eq_
from nose.tools import ok_

from tracim.lib import helpers as h
from tracim.tests import TestController


class TestRootController(TestController):
    """Tests for the method in the root controller."""

    def test_index(self):
        response = self.app.get('/')
        eq_(200, response.status_int)

        msg = 'copyright &copy; 2013 - {} tracim project.'.format(h.current_year())
        ok_(msg in response)

        forms = BeautifulSoup(response.body).find_all('form')
        print('FORMS = ',forms)
        eq_(1, len(forms))
        eq_('w-login-form', forms[0].get('id'))
