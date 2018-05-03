# -*- coding: utf-8 -*-
import pytest
from sqlalchemy.orm.exc import NoResultFound

import transaction

from tracim.lib.core.user import UserApi
from tracim.tests import DefaultTest
from tracim.tests import eq_


class TestUserApi(DefaultTest):

    def test_create_and_update_user(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user()
        api.update(u, 'bob', 'bob@bob', True)

        nu = api.get_one_by_email('bob@bob')
        assert nu != None
        eq_('bob@bob', nu.email)
        eq_('bob', nu.display_name)

    def test_user_with_email_exists(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user()
        api.update(u, 'bibi', 'bibi@bibi', True)
        transaction.commit()

        eq_(True, api.user_with_email_exists('bibi@bibi'))
        eq_(False, api.user_with_email_exists('unknown'))

    def test_get_one_by_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user()
        self.session.flush()
        api.update(u, 'bibi', 'bibi@bibi', True)
        uid = u.user_id
        transaction.commit()

        eq_(uid, api.get_one_by_email('bibi@bibi').user_id)

    def test_get_one_by_email_exception(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        with pytest.raises(NoResultFound):
            api.get_one_by_email('unknown')

    def test_get_all(self):
        # TODO - G.M - 29-03-2018 Check why this method is not enabled
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        # u1 = api.create_minimal_user(True)
        # u2 = api.create_minimal_user(True)

        # users = api.get_all()
        # ok_(2==len(users))

    def test_get_one(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user()
        api.update(u, 'titi', 'titi@titi', True)
        one = api.get_one(u.user_id)
        eq_(u.user_id, one.user_id)
