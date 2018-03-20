# -*- coding: utf-8 -*-
from collections import OrderedDict

from nose.tools import eq_
from nose.tools import ok_

from tracim.model import DBSession
from tracim.model import User
from tracim.tests import TracimTestController
from tracim.fixtures.users_and_groups import Test as TestFixture


class TestAuthentication(TracimTestController):
    application_under_test = 'main'
    fixtures = [TestFixture]

    def test_update_password(self):
        self._connect_user(
            'lawrence-not-real-email@fsf.local',
            'foobarbaz',
        )

        user = DBSession.query(User) \
            .filter(User.email == 'lawrence-not-real-email@fsf.local').one()

        try_post_user = self.app.post(
            '/user/{user_id}/password?_method=PUT'.format(
                user_id=user.user_id
            ),
            OrderedDict([
                ('current_password', 'foobarbaz'),
                ('new_password1', 'new-password'),
                ('new_password2', 'new-password'),
            ])
        )
        eq_(try_post_user.status_code, 302,
            "Code should be 302, but is %d" % try_post_user.status_code)

        user = DBSession.query(User) \
            .filter(User.email == 'lawrence-not-real-email@fsf.local').one()
        ok_(user.validate_password('new-password'))
