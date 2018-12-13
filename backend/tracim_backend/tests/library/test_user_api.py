# -*- coding: utf-8 -*-
import pytest
import transaction
from marshmallow import ValidationError


from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import UserAuthTypeDisabled
from tracim_backend.exceptions import ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import MissingLDAPConnector
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import TooShortAutocompleteString
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.exceptions import UserAuthenticatedIsNotActive
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests import DefaultTest
from tracim_backend.tests import eq_


class TestUserApi(DefaultTest):

    def test_unit__create_minimal_user__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.email == 'bob@bob'
        assert u.display_name == 'bob'

    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_update__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        api.update(u, 'bob', 'bob@bob', 'password', do_save=True)
        nu = api.get_one_by_email('bob@bob')
        assert nu is not None
        assert nu.email == 'bob@bob'
        assert nu.display_name == 'bob'
        assert nu.validate_password('password')

    def test_unit__create_minimal_user__err__too_short_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(TracimValidationFailed):
            u = api.create_minimal_user('b@')

    def test_unit__create_minimal_user__err__too_long_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(TracimValidationFailed):
            email = 'b{}b@bob'.format('o'*255)
            u = api.create_minimal_user(email)

    # email
    def test_unit__update_user_email__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.email == 'bob@bob'
        u = api.update(user=u, email='bib@bib')
        assert u.email == 'bib@bib'

    def test_unit__update_user_email__err__wrong_format(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')

        # 2 char
        with pytest.raises(EmailValidationFailed):
            u = api.update(user=u, email='b+b')

    def test_unit__update_user_email__err__too_short_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')

        # 2 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, email='b@')

        # 3 char
        u = api.update(user=u, email='b@b')
        assert u.email == 'b@b'

    def test_unit__update_user_email__err__too_long_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        # 256 char
        chars = 'o' * (256 - 6)
        with pytest.raises(TracimValidationFailed):
            email = 'b{}b@bob'.format(chars)
            u = api.update(user=u, email=email)

        # 255 char
        chars = 'o' * (255 - 6)
        email = 'b{}b@bob'.format(chars)
        u = api.update(user=u, email=email)
        assert u.email==email

    # password
    def test_unit__update_user_password__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.password is None
        # 8 char
        u = api.update(user=u, password='password')
        assert u.password
        assert u.validate_password('password')
        # 16 char
        u = api.update(user=u, password='password'*2)
        assert u.password
        assert u.validate_password('password'*2)

    def test_unit__update_user_password__err__too_short_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        # 5 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, password='passw')
        # 6 char
        u = api.update(user=u, password='passwo')

    def test_unit__update_user_password__err__too_long_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        with pytest.raises(TracimValidationFailed):
            password = 'p' * 513
            u = api.update(user=u, password=password)
        password = 'p' * 512
        u = api.update(user=u, password=password)

    # public_name
    def test_unit__update_user_public_name__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.display_name == 'bob'
        # 8 char
        u = api.update(user=u, name='John Doe')
        assert u.display_name == 'John Doe'
        # 16 char
        u = api.update(user=u, name='John Doe'*2)
        assert u.display_name == 'John Doe'*2

    def test_unit__update_user_public_name__err__too_short_public_name(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        # 2 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, name='nn')
        # 3 char
        u = api.update(user=u, name='nnn')
        assert u.display_name == 'nnn'

    def test_unit__update_user_public_name__err__too_long_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        with pytest.raises(TracimValidationFailed):
            name = 'n' * 256
            u = api.update(user=u, name=name)
        name = 'n' * 255
        u = api.update(user=u, name=name)

    # lang
    def test_unit__update_user_lang_name__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.lang is None
        # 2 char
        u = api.update(user=u, lang='fr')
        assert u.lang == 'fr'
        # 3 char
        u = api.update(user=u, lang='fre')
        assert u.lang == 'fre'

    def test_unit__update_user_lang__err__too_short_lang(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        # 1 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, lang='f')
        # 2 char
        u = api.update(user=u, lang='fr')
        assert u.lang == 'fr'

    def test_unit__update_user_lang__err__too_long_lang(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        with pytest.raises(TracimValidationFailed):
            lang = 'n' * 4
            u = api.update(user=u, lang=lang)
        lang = 'n' * 3
        u = api.update(user=u, lang=lang)

    # timezone
    def test_unit__update_timezone__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        assert u.timezone is None
        u = api.update(user=u, timezone='Europe/Paris')
        assert u.timezone == 'Europe/Paris'


    def test_unit__update_timezone__too_long_timezone(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        with pytest.raises(TracimValidationFailed):
            timezone = 't' * 33
            u = api.update(user=u, timezone=timezone)
        timezone = 't' * 32
        u = api.update(user=u, timezone=timezone)

    @pytest.mark.ldap
    def test_unit__create_minimal_user_and_update__err__set_unaivalable_auth_type(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bob@bob')
        with pytest.raises(UserAuthTypeDisabled):
            api.update(u, name='bob', email='bob@bob', auth_type=AuthType.LDAP, do_save=True)


    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_set_password__ok__nominal_case(self):
        u = User()
        u.email = 'bob@bob'
        u.password = 'pass'
        u.auth_type = AuthType.INTERNAL
        u.display_name = 'bob'
        api = UserApi(
            current_user=u,
            session=self.session,
            config=self.app_config,
        )
        assert u.validate_password('pass')
        api.set_password(u,'pass','newpass','newpass')
        assert u is not None
        assert u.email == 'bob@bob'
        assert u.display_name == 'bob'
        assert u.validate_password('newpass')
        assert not u.validate_password('pass')

    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_set_password__ok__nominal_case(self):
        u = User()
        u.email = 'bob@bob'
        u.password = 'pass'
        u.auth_type = AuthType.INTERNAL
        u.display_name = 'bob'
        api = UserApi(
            current_user=u,
            session=self.session,
            config=self.app_config,
        )
        assert u.email == 'bob@bob'
        api.set_email(u,'pass','newbobemail@bob')
        assert u is not None
        assert u.email == 'newbobemail@bob'


    @pytest.mark.internal_auth
    def test__unit__create__user__ok_nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password='password',
            name='bob',
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password('password')
        assert u.display_name == 'bob'
        assert u.timezone == '+2'
        assert u.lang == 'en'

    def test_unit__user_with_email_exists__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bibi@bibi')
        api.update(u, 'bibi', 'bibi@bibi', 'password', do_save=True)
        transaction.commit()

        eq_(True, api.user_with_email_exists('bibi@bibi'))
        eq_(False, api.user_with_email_exists('unknown'))

    def test_get_one_by_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('bibi@bibi')
        self.session.flush()
        api.update(u, 'bibi', 'bibi@bibi', 'password', do_save=True)
        uid = u.user_id
        transaction.commit()

        eq_(uid, api.get_one_by_email('bibi@bibi').user_id)

    def test_unit__get_one_by_email__err__user_does_not_exist(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(UserDoesNotExist):
            api.get_one_by_email('unknown')

    def test_unit__get_all__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_minimal_user('bibi@bibi')

        users = api.get_all()
        # u1 + Admin user from BaseFixture
        assert 2 == len(users)

    def test_unit__get_known__user__admin__too_short_acp_str(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        with pytest.raises(TooShortAutocompleteString):
            api.get_known_user('e')

    def test_unit__get_known__user__admin__by_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )

        users = api.get_known_user('email')
        assert len(users) == 1
        assert users[0] == u1

    def test_unit__get_known__user__user__no_workspace_empty_known_user(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        api2 = UserApi(
            current_user=u1,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('email')
        assert len(users) == 0

    def test_unit__get_known__user__same_workspaces_users_by_name(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        u2 = api.create_user(
            email='email2@email2',
            name='name2',
            do_notify=False,
            do_save=True,
        )
        u3 = api.create_user(
            email='notfound@notfound',
            name='notfound',
            do_notify=False,
            do_save=True,
        )
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        role_api = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        api2 = UserApi(
            current_user=u1,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('name')
        assert len(users) == 2
        assert users[0] == u1
        assert users[1] == u2

    def test_unit__get_known__user__distinct_workspaces_users_by_name__exclude_workspace(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        u2 = api.create_user(
            email='email2@email2',
            name='name2',
            do_notify=False,
            do_save=True,
        )
        u3 = api.create_user(
            email='notfound@notfound',
            name='notfound',
            do_notify=False,
            do_save=True,
        )
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace_2 = wapi.create_workspace(
            'test workspace n°2',
            save_now=True)
        role_api = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(
            current_user=u3,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('name', exclude_workspace_ids=[workspace.workspace_id])
        assert len(users) == 1
        assert users[0] == u2

    def test_unit__get_known__user__distinct_workspaces_users_by_name__exclude_workspace_and_name(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        u2 = api.create_user(
            email='email2@email2',
            name='name2',
            do_notify=False,
            do_save=True,
        )
        u3 = api.create_user(
            email='notfound@notfound',
            name='notfound',
            do_notify=False,
            do_save=True,
        )
        u4 = api.create_user(
            email='email3@email3',
            name='name3',
            do_notify=False,
            do_save=True,
        )
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace_2 = wapi.create_workspace(
            'test workspace n°2',
            save_now=True)
        role_api = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u4, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(
            current_user=u3,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('name', exclude_workspace_ids=[workspace.workspace_id], exclude_user_ids=[u4.user_id])
        assert len(users) == 1
        assert users[0] == u2

    def test_unit__get_known__user__distinct_workspaces_users_by_name(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        u2 = api.create_user(
            email='email2@email2',
            name='name2',
            do_notify=False,
            do_save=True,
        )
        u3 = api.create_user(
            email='notfound@notfound',
            name='notfound',
            do_notify=False,
            do_save=True,
        )
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace_2 = wapi.create_workspace(
            'test workspace n°2',
            save_now=True)
        role_api = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(
            current_user=u3,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('name')
        assert len(users) == 2
        assert users[0] == u1
        assert users[1] == u2

    def test_unit__get_known__user__same_workspaces_users_by_name__exclude_user(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        u2 = api.create_user(
            email='email2@email2',
            name='name2',
            do_notify=False,
            do_save=True,
        )
        u3 = api.create_user(
            email='notfound@notfound',
            name='notfound',
            do_notify=False,
            do_save=True,
        )
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        role_api = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        api2 = UserApi(
            current_user=u1,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('name', exclude_user_ids=[u1.user_id])
        assert len(users) == 1
        assert users[0] == u2

    def test_unit__get_known__user__same_workspaces_users_by_email(self):
        admin = self.session.query(User) \
            .filter(User.email == 'admin@admin.admin') \
            .one()
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )
        u2 = api.create_user(
            email='email2@email2',
            name='name2',
            do_notify=False,
            do_save=True,
        )
        u3 = api.create_user(
            email='notfound@notfound',
            name='notfound',
            do_notify=False,
            do_save=True,
        )
        wapi = WorkspaceApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = wapi.create_workspace(
            'test workspace n°1',
            save_now=True)
        role_api = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        api2 = UserApi(
            current_user=u1,
            session=self.session,
            config=self.app_config,
        )
        users = api2.get_known_user('email')
        assert len(users) == 2
        assert users[0] == u1
        assert users[1] == u2

    def test_unit__get_known__user__admin__by_name(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u1 = api.create_user(
            email='email@email',
            name='name',
            do_notify=False,
            do_save=True,
        )

        users = api.get_known_user('nam')
        assert len(users) == 1
        assert users[0] == u1

    def test_unit__get_one__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_minimal_user('titi@titi')
        api.update(u, 'titi', 'titi@titi', 'password', do_save=True)
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
            config=self.app_config,
        )
        new_user = api.get_user_with_context(user)
        assert isinstance(new_user, UserInContext)
        assert new_user.user == user
        assert new_user.profile == 'nobody'
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
            config=self.app_config,
        )
        new_user = api.get_current_user()
        assert isinstance(new_user, User)
        assert user == new_user

    def test_unit__get_current_user__err__user_not_exist(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(UserDoesNotExist):
            api.get_current_user()

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        user = api.authenticate('admin@admin.admin', 'admin@admin.admin')
        assert isinstance(user, User)
        assert user.email == 'admin@admin.admin'
        assert user.auth_type == AuthType.INTERNAL


    @pytest.mark.internal_auth
    def test_unit__authenticate_user___err__user_not_active(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = api.create_user(
            email='test@test.test',
            password='password',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        api.disable(user)
        with pytest.raises(AuthenticationFailed):
            api.authenticate('test@test.test', 'test@test.test')

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___err__wrong_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(AuthenticationFailed):
            api.authenticate('admin@admin.admin', 'wrong_password')

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___err__wrong_user(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(AuthenticationFailed):
            api.authenticate('admin@admin.admin', 'wrong_password')

    def test_unit__disable_user___ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = api.create_user(
            email='test@test.test',
            password='password',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )
        user2 = api.create_user(
            email='test2@test.test',
            password='password',
            name='bob2',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )

        api2 = UserApi(current_user=user,session=self.session, config=self.app_config)
        from tracim_backend.exceptions import UserCantDisableHimself
        api2.disable(user2)
        updated_user2 = api.get_one(user2.user_id)
        assert updated_user2.is_active == False
        assert updated_user2.user_id == user2.user_id
        assert updated_user2.email == user2.email

    def test_unit__disable_user___err__user_cant_disable_itself(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        gapi = GroupApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        groups = [gapi.get_one_with_name('users')]
        user = api.create_user(
            email='test@test.test',
            password='password',
            name='bob',
            groups=groups,
            timezone='Europe/Paris',
            do_save=True,
            do_notify=False,
        )

        api2 = UserApi(current_user=user,session=self.session, config=self.app_config)
        from tracim_backend.exceptions import UserCantDisableHimself
        with pytest.raises(UserCantDisableHimself):
            api2.disable(user)


class TestFakeLDAPUserApi(DefaultTest):
    config_section = 'base_test_ldap'

    @pytest.mark.ldap
    def test_unit__authenticate_user___err__no_ldap_connector(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(MissingLDAPConnector):
            user = api.authenticate('hubert@planetexpress.com', 'professor')

    @pytest.mark.xfail(
        reason='create account with specific profile ldap feature disabled'
    )
    @pytest.mark.ldap
    def test_unit__authenticate_user___ok__new_user_ldap_auth_custom_profile(self):
        # TODO - G.M - 2018-12-05 - [ldap_profile]
        # support for profile attribute disabled
        # Should be reenabled later probably with a better code
        class fake_ldap_connector(object):

            def authenticate(self, email: str, password: str):
                if not email == 'hubert@planetexpress.com' \
                        and password == 'professor':
                    return None
                return [None, {'mail': ['huber@planetepress.com'],
                               'givenName': ['Hubert'],
                               'profile': ['trusted-users'],
                               }]
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        user = api.authenticate('hubert@planetexpress.com', 'professor', fake_ldap_connector())  # nopep8
        assert isinstance(user, User)
        assert user.email == 'hubert@planetexpress.com'
        assert user.auth_type == AuthType.LDAP
        assert user.display_name == 'Hubert'
        assert user.profile.name == 'trusted-users'


    @pytest.mark.ldap
    def test_unit__authenticate_user___ok__new_user_ldap_auth(self):
        class fake_ldap_connector(object):

            def authenticate(self, email: str, password: str):
                if not email == 'hubert@planetexpress.com' \
                        and password == 'professor':
                    return None
                return [None, {'mail': ['huber@planetepress.com'],
                               'givenName': ['Hubert'],
                               }]
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        user = api.authenticate('hubert@planetexpress.com', 'professor', fake_ldap_connector())  # nopep8
        assert isinstance(user, User)
        assert user.email == 'hubert@planetexpress.com'
        assert user.auth_type == AuthType.LDAP
        assert user.display_name == 'Hubert'
        assert user.profile.name == 'users'

    @pytest.mark.ldap
    def test__unit__create_user__err__external_auth_ldap_with_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            u = api.create_user(
                email='bob@bob',
                password='password',
                name='bob',
                auth_type=AuthType.LDAP,
                timezone='+2',
                lang='en',
                do_save=True,
                do_notify=False,
            )

    @pytest.mark.ldap
    def test__unit__create__user__ok__external_auth_ldap(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password(None) is False
        assert u.display_name == 'bob'
        assert u.timezone == '+2'
        assert u.lang == 'en'

    @pytest.mark.ldap
    def test_unit_update__ok_external_auth_ldap(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        api.update(
            email='bob@bob',
            user = u,
            name='bobi',
            password=None,
            auth_type=AuthType.LDAP,
            timezone='-1',
            lang='fr',
            do_save=True,
        )
        assert u.display_name == 'bobi'

    @pytest.mark.ldap
    def test_unit_update__err__external_auth_ldap_set_password(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api.update(
                email='bob@bob',
                user = u,
                name='bobi',
                password='new_password',
                auth_type=AuthType.LDAP,
                timezone='-1',
                lang='fr',
                do_save=True,
            )

    @pytest.mark.ldap
    def test_unit_update__err__external_auth_ldap_set_email(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserEmailModificationDisallowed):
            api.update(
                email='bob@bob1',
                user = u,
                name='bobi',
                password=None,
                auth_type=AuthType.LDAP,
                timezone='-1',
                lang='fr',
                do_save=True,
            )

    @pytest.mark.ldap
    def test_unit__check_email_modification_allowed__err_external_auth_ldap(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserEmailModificationDisallowed):
            api._check_email_modification_allowed(u)

    @pytest.mark.ldap
    def test_unit__check_password_modification_allowed__err_external_auth_ldap(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api._check_password_modification_allowed(u)

    @pytest.mark.ldap
    def test_unit_set_password__err__external_auth_ldap(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        api._user = u
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api.set_password(
                u,
                'pass',
                'pass',
                'pass',
            )

    @pytest.mark.ldap
    def test_unit_set_email__err__external_auth_ldap(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password=None,
            name='bob',
            auth_type=AuthType.LDAP,
            timezone='+2',
            lang='en',
            do_save=True,
            do_notify=False,
        )
        api._user = u
        with pytest.raises(ExternalAuthUserEmailModificationDisallowed):
            api.set_email(
                u,
                'pass',
                'bob@bobi',
            )
