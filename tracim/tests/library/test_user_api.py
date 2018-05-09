# -*- coding: utf-8 -*-
import pytest
from sqlalchemy.orm.exc import NoResultFound

import transaction

from tracim.lib.core.user import UserApi
from tracim.tests import DefaultTest
from tracim.tests import eq_


class TestUserApi(DefaultTest):

    def test_unit__create_minimal_user__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.email == 'bob@bob'
        assert u.display_name is None

    def test_unit__create_minimal_user_and_update__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user('bob@bob')
        api.update(u, 'bob', 'bob@bob', 'pass', do_save=True)
        nu = api.get_one_by_email('bob@bob')
        assert nu is not None
        assert nu.email == 'bob@bob'
        assert nu.display_name == 'bob'
        assert nu.validate_password('pass')

    def test_unit__user_with_email_exists__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user('bibi@bibi')
        api.update(u, 'bibi', 'bibi@bibi', 'pass', do_save=True)
        transaction.commit()

        eq_(True, api.user_with_email_exists('bibi@bibi'))
        eq_(False, api.user_with_email_exists('unknown'))

    def test_unit__get_one_by_email__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user('bibi@bibi')
        self.session.flush()
        api.update(u, 'bibi', 'bibi@bibi', 'pass', do_save=True)
        uid = u.user_id
        transaction.commit()

        eq_(uid, api.get_one_by_email('bibi@bibi').user_id)

    def test_unit__get_one_by_email__ok__user_not_found(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        with pytest.raises(NoResultFound):
            api.get_one_by_email('unknown')

    def test_unit__get_all__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u1 = api.create_minimal_user('bibi@bibi')

        users = api.get_all()
        # u1 + Admin user from BaseFixture
        assert 2 == len(users)

    def test_unit__get_one__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_minimal_user('titi@titi')
        api.update(u, 'titi', 'titi@titi', 'pass', do_save=True)
        one = api.get_one(u.user_id)
        eq_(u.user_id, one.user_id)
