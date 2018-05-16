# -*- coding: utf-8 -*-
import pytest
from sqlalchemy.orm.exc import NoResultFound

import transaction

from tracim.exceptions import UserNotExist, AuthenticationFailed
from tracim.lib.core.user import UserApi
from tracim.models import User
from tracim.models.context_models import UserInContext
from tracim.tests import DefaultTest
from tracim.tests import eq_


class TestUserApi(DefaultTest):

    def test_unit__create_and_update_user__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_user()
        api.update(u, 'bob', 'bob@bob', True)

        nu = api.get_one_by_email('bob@bob')
        assert nu != None
        eq_('bob@bob', nu.email)
        eq_('bob', nu.display_name)

    def test_unit__user_with_email_exists__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_user()
        api.update(u, 'bibi', 'bibi@bibi', True)
        transaction.commit()

        eq_(True, api.user_with_email_exists('bibi@bibi'))
        eq_(False, api.user_with_email_exists('unknown'))

    def test_unit__get_one_by_email__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_user()
        api.update(u, 'bibi', 'bibi@bibi', True)
        uid = u.user_id
        transaction.commit()

        eq_(uid, api.get_one_by_email('bibi@bibi').user_id)

    def test_unit__get_one_by_email__err__user_does_not_exist(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        with pytest.raises(NoResultFound):
            api.get_one_by_email('unknown')

    # def test_unit__get_all__ok__nominal_case(self):
    #     # TODO - G.M - 29-03-2018 Check why this method is not enabled
    #     api = UserApi(
    #         current_user=None,
    #         session=self.session,
    #         config=self.config,
    #     )
    #     u1 = api.create_user(True)
    #     u2 = api.create_user(True)
    #     users = api.get_all()
    #     assert 2==len(users)

    def test_unit__get_one__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        u = api.create_user()
        api.update(u, 'titi', 'titi@titi', True)
        one = api.get_one(u.user_id)
        eq_(u.user_id, one.user_id)

    def test_unit__get_user_with_context__nominal_case(self):
        user = User(
            email='admin@tracim.tracim',
            display_name='Admin',
            is_active=True,
        )
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        new_user = api.get_user_with_context(user)
        assert isinstance(new_user, UserInContext)
        assert new_user.user == user
        assert new_user.profile.name == 'nobody'
        assert new_user.user_id == user.user_id
        assert new_user.email == 'admin@tracim.tracim'
        assert new_user.display_name == 'Admin'
        assert new_user.is_active is True
        # TODO - G.M - 03-05-2018 - [avatar][calendar] Should test this
        # with true value when those param will be available.
        assert new_user.avatar_url is None
        assert new_user.calendar_url is None

    def test_unit__get_current_user_ok__nominal_case(self):
        user = User(email='admin@tracim.tracim')
        api = UserApi(
            current_user=user,
            session=self.session,
            config=self.config,
        )
        new_user = api.get_current_user()
        assert isinstance(new_user, User)
        assert user == new_user

    def test_unit__get_current_user__err__user_not_exist(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        with pytest.raises(UserNotExist):
            api.get_current_user()

    def test_unit__authenticate_user___ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        user = api.authenticate_user('admin@admin.admin', 'admin@admin.admin')
        assert isinstance(user, User)
        assert user.email == 'admin@admin.admin'

    def test_unit__authenticate_user___err__wrong_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        with pytest.raises(AuthenticationFailed):
            api.authenticate_user('admin@admin.admin', 'wrong_password')

    def test_unit__authenticate_user___err__wrong_user(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.config,
        )
        with pytest.raises(AuthenticationFailed):
            api.authenticate_user('unknown_user', 'wrong_password')
