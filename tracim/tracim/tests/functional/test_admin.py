# -*- coding: utf-8 -*-
from collections import OrderedDict

from nose.tools import eq_
from nose.tools import ok_

from tracim.model import DBSession
from tracim.model import User
from tracim.tests import TracimTestController


class TestAuthentication(TracimTestController):
    application_under_test = 'main'

    def test_create_user(self):
        self._connect_user(
            'admin@admin.admin',
            'admin@admin.admin',
        )

        user_count = DBSession.query(User) \
            .filter(User.email == 'an-other-email@test.local').count()
        eq_(0, user_count, 'User should not exist yet')

        # Create a new user
        try_post_user = self.app.post(
            '/admin/users',
            OrderedDict([
                ('name', 'TEST'),
                ('email', 'an-other-email@test.local'),
                ('password', 'password'),
                ('is_tracim_manager', 'off'),
                ('is_tracim_admin', 'off'),
                ('send_email', 'off'),
            ])
        )

        eq_(try_post_user.status_code, 302,
            "Code should be 302, but is %d" % try_post_user.status_code)

        user = DBSession.query(User) \
            .filter(User.email == 'an-other-email@test.local').one()
        ok_(user, msg="User should exist now")
        ok_(user.validate_password('password'))

        # User must have webdav digest
        ok_(user.webdav_left_digest_response_hash)

    def test_update_user_password(self):
        self._connect_user(
            'admin@admin.admin',
            'admin@admin.admin',
        )

        # Create a new user (tested in test_create_user)
        self.app.post(
            '/admin/users',
            OrderedDict([
                ('name', 'TEST'),
                ('email', 'an-other-email@test.local'),
                ('password', 'an-other-email@test.local'),
                ('is_tracim_manager', 'off'),
                ('is_tracim_admin', 'off'),
                ('send_email', 'off'),
            ])
        )

        user = DBSession.query(User) \
            .filter(User.email == 'an-other-email@test.local').one()
        webdav_digest = user.webdav_left_digest_response_hash

        self.app.post(
            '/admin/users/{user_id}/password?_method=PUT'.format(
                user_id=user.user_id
            ),
            OrderedDict([
                ('new_password1', 'new-password'),
                ('new_password2', 'new-password'),
            ])
        )

        user = DBSession.query(User) \
            .filter(User.email == 'an-other-email@test.local').one()
        ok_(user.validate_password('new-password'))
        ok_(
            webdav_digest != user.webdav_left_digest_response_hash,
            msg='Webdav digest should be updated',
        )
