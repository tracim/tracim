# -*- coding: utf-8 -*-
import typing
from unittest import mock

import pytest
import transaction

from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import CannotUseBothIncludeAndExcludeWorkspaceUsers
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import InvalidUsernameFormat
from tracim_backend.exceptions import MissingLDAPConnector
from tracim_backend.exceptions import ReservedUsernameError
from tracim_backend.exceptions import TooShortAutocompleteString
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.exceptions import UserAuthTypeDisabled
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UsernameAlreadyExists
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import UserInContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "base_test_default_profile_trusted_user"}], indirect=True
)
class TestUserApiWithCustomDefaultProfileForUser(object):
    def test_unit__create_minimal_user__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.email == "bob@bob"
        assert u.display_name == "bob"
        assert u.profile.slug == "trusted-users"

    @pytest.mark.internal_auth
    def test__unit__create__user__ok_nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            username="boby",
            password="password",
            name="bob",
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.username == "boby"
        assert u.validate_password("password")
        assert u.display_name == "bob"
        assert u.timezone == "+2"
        assert u.lang == "en"
        assert u.profile.slug == "trusted-users"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestUserApiWithNotifications:
    @pytest.mark.parametrize("email", ("bob@bob.local", None))
    def test__unit__create_user__ok__with_or_without_email(
        self, session, app_config, email: typing.Optional[str],
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        with mock.patch(
            "tracim_backend.lib.mail_notifier.notifier.EmailManager.notify_created_account"
        ) as mocked_notify_created_account:
            api.create_user(
                email=email,
                username="boby",
                password="password",
                name="bob",
                do_save=True,
                do_notify=True,
            )
        assert mocked_notify_created_account.called == (email is not None)


@pytest.mark.usefixtures("base_fixture")
class TestUserApi(object):
    def test_unit__create_minimal_user__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.email == "bob@bob"
        assert u.display_name == "bob"
        assert u.profile.slug == "users"

    def test_unit__create_minimal_user__ok__email_treated_as_lowercase(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("BOB@BOB")
        assert u.email == "bob@bob"
        assert u.display_name == "BOB"

    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_update__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        api.update(u, "bob", "bob@bob", "password", do_save=True)
        nu = api.get_one_by_email("bob@bob")
        assert nu is not None
        assert nu.email == "bob@bob"
        assert nu.display_name == "bob"
        assert nu.validate_password("password")

    def test_unit__create_minimal_user__err__too_short_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(TracimValidationFailed):
            api.create_minimal_user("b@")

    def test_unit__create_minimal_user__err__too_long_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(TracimValidationFailed):
            email = "b{}b@bob".format("o" * 255)
            api.create_minimal_user(email)

    def test_unit__create_minimal_user__err__no_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(TracimValidationFailed):
            api.create_minimal_user(username="foobar")

    # email
    def test_unit__update_user_email__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.email == "bob@bob"
        u = api.update(user=u, email="bib@bib")
        assert u.email == "bib@bib"

    def test_unit__update_user_email__ok__email_treated_as_lowercase(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.email == "bob@bob"
        u = api.update(user=u, email="BIB@BIB")
        assert u.email == "bib@bib"

    def test_unit__update_user_email__err__wrong_format(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")

        # 2 char
        with pytest.raises(EmailValidationFailed):
            api.update(user=u, email="b+b")

    def test_unit__update_user_email__err__too_short_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")

        # 2 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, email="b@")

        # 3 char
        u = api.update(user=u, email="b@b")
        assert u.email == "b@b"

    def test_unit__update_user_email__err__too_long_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        # 256 char
        chars = "o" * (256 - 6)
        with pytest.raises(TracimValidationFailed):
            email = "b{}b@bob".format(chars)
            u = api.update(user=u, email=email)

        # 255 char
        chars = "o" * (255 - 6)
        email = "b{}b@bob".format(chars)
        u = api.update(user=u, email=email)
        assert u.email == email

    # username
    def test_unit__create_minimal_user__ok__with_username_and_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob", "boby")
        assert u.email == "bob@bob"
        assert u.username == "boby"

    @pytest.mark.parametrize(
        "config_section", [{"name": "base_test_optional_email"}], indirect=True
    )
    def test_unit__create_minimal_user__ok__with_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="boby")
        assert u.email is None
        assert u.username == "boby"

    def test_unit__create_minimal_user__error__invalid_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(InvalidUsernameFormat):
            api.create_minimal_user(username="@boby", email="bob@boba.fet", save_now=True)

    def test_unit__create_minimal_user__error__already_used_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        api.create_minimal_user(username="boby", email="boby@boba.fet", save_now=True)
        with pytest.raises(UsernameAlreadyExists):
            api.create_minimal_user(username="boby", email="boby2@boba.fet", save_now=True)

    @pytest.mark.parametrize("username", ["all", "tous", "todos", "alle", "الكل"])
    def test_unit__create_minimal_user__error__reserved_username(
        self, session, app_config, username: str
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(ReservedUsernameError):
            api.create_minimal_user(username=username, email="boby@boba.fet", save_now=True)

    def test_unit__create_minimal_user__err__too_short_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(InvalidUsernameFormat):
            api.create_minimal_user(
                username="a" * (User.MIN_USERNAME_LENGTH - 1), email="boby2@boba.fet"
            )

    def test_unit__create_minimal_user__err__too_long_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(InvalidUsernameFormat):
            api.create_minimal_user(
                username="a" * (User.MAX_USERNAME_LENGTH + 1), email="boby2@boba.fet"
            )

    def test_unit__update_user_username__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="boby", email="boby2@boba.fet")
        assert u.username == "boby"
        u = api.update(user=u, username="bibou")
        assert u.username == "bibou"

    def test_unit__update_user_username__error__wrong_format(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="boby", email="boby2@boba.fet")
        assert u.username == "boby"
        with pytest.raises(InvalidUsernameFormat):
            api.update(user=u, username="@bibou")

    def test_unit__update_user_username__error__too_short(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="boby", email="boby2@boba.fet")
        assert u.username == "boby"
        with pytest.raises(InvalidUsernameFormat):
            api.update(user=u, username="b" * (User.MIN_USERNAME_LENGTH - 1))

    def test_unit__update_user_username__error__too_long(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="boby", email="boby2@boba.fet")
        assert u.username == "boby"
        with pytest.raises(InvalidUsernameFormat):
            api.update(user=u, username="b" * (User.MAX_USERNAME_LENGTH + 1))

    def test_unit__update_user_username__error__already_used(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u1 = api.create_minimal_user(username="boby", email="boby@boba.fet", save_now=True)
        api.create_minimal_user(username="jean", email="boby2@boba.fet", save_now=True)
        with pytest.raises(UsernameAlreadyExists):
            api.update(user=u1, username="jean")

    @pytest.mark.parametrize("username", ["all", "tous", "todos", "alle", "الكل"])
    def test_unit__update_user_username__error__reserved_username(
        self, session, app_config, username: str
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        u1 = api.create_minimal_user(username="boby", email="boby@boba.fet", save_now=True)
        with pytest.raises(ReservedUsernameError):
            api.update(user=u1, username=username)

    # password
    def test_unit__update_user_password__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.password is None
        # 8 char
        u = api.update(user=u, password="password")
        assert u.password
        assert u.validate_password("password")
        # 16 char
        u = api.update(user=u, password="password" * 2)
        assert u.password
        assert u.validate_password("password" * 2)

    def test_unit__update_user_password__err__too_short_password(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        # 5 char
        with pytest.raises(TracimValidationFailed):
            api.update(user=u, password="passw")
        # 6 char
        api.update(user=u, password="passwo")

    def test_unit__update_user_password__err__too_long_password(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        with pytest.raises(TracimValidationFailed):
            password = "p" * 513
            u = api.update(user=u, password=password)
        password = "p" * 512
        api.update(user=u, password=password)

    # public_name
    def test_unit__update_user_public_name__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.display_name == "bob"
        # 8 char
        u = api.update(user=u, name="John Doe")
        assert u.display_name == "John Doe"
        # 16 char
        u = api.update(user=u, name="John Doe" * 2)
        assert u.display_name == "John Doe" * 2

    def test_unit__update_user_public_name__err__too_short_public_name(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        # 2 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, name="nn")
        # 3 char
        u = api.update(user=u, name="nnn")
        assert u.display_name == "nnn"

    def test_unit__update_user_public_name__err__too_long_password(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        with pytest.raises(TracimValidationFailed):
            name = "n" * 256
            u = api.update(user=u, name=name)
        name = "n" * 255
        api.update(user=u, name=name)

    # lang
    def test_unit__update_user_lang_name__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.lang is None
        # 2 char
        u = api.update(user=u, lang="fr")
        assert u.lang == "fr"
        # 3 char
        u = api.update(user=u, lang="fre")
        assert u.lang == "fre"

    def test_unit__update_user_lang__err__too_short_lang(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        # 1 char
        with pytest.raises(TracimValidationFailed):
            u = api.update(user=u, lang="f")
        # 2 char
        u = api.update(user=u, lang="fr")
        assert u.lang == "fr"

    def test_unit__update_user_lang__err__too_long_lang(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        with pytest.raises(TracimValidationFailed):
            lang = "n" * 4
            u = api.update(user=u, lang=lang)
        lang = "n" * 3
        api.update(user=u, lang=lang)

    # timezone
    def test_unit__update_timezone__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.timezone is None
        u = api.update(user=u, timezone="Europe/Paris")
        assert u.timezone == "Europe/Paris"

    def test_unit__update_timezone__too_long_timezone(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        with pytest.raises(TracimValidationFailed):
            timezone = "t" * 33
            u = api.update(user=u, timezone=timezone)
        timezone = "t" * 32
        api.update(user=u, timezone=timezone)

    @pytest.mark.ldap
    def test_unit__create_minimal_user_and_update__err__set_unaivalable_auth_type(
        self, session, app_config
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        with pytest.raises(UserAuthTypeDisabled):
            api.update(u, name="bob", email="bob@bob", auth_type=AuthType.LDAP, do_save=True)

    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_set_password__ok__nominal_case(
        self, session, app_config
    ):
        u = User()
        u.email = "bob@bob"
        u.password = "pass"
        u.auth_type = AuthType.INTERNAL
        u.display_name = "bob"
        api = UserApi(current_user=u, session=session, config=app_config)
        assert u.validate_password("pass")
        api.set_password(u, "pass", "newpass", "newpass")
        assert u is not None
        assert u.email == "bob@bob"
        assert u.display_name == "bob"
        assert u.validate_password("newpass")
        assert not u.validate_password("pass")

    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_set_email__ok__nominal_case(self, session, app_config):
        u = User()
        u.email = "bob@bob"
        u.password = "pass"
        u.auth_type = AuthType.INTERNAL
        u.display_name = "bob"
        api = UserApi(current_user=u, session=session, config=app_config)
        assert u.email == "bob@bob"
        api.set_email(u, "pass", "newbobemail@bob")
        assert u is not None
        assert u.email == "newbobemail@bob"

    @pytest.mark.internal_auth
    def test_unit__create_minimal_user_and_set_username__ok__nominal_case(
        self, session, app_config
    ):
        user = User()
        user.username = "boby"
        user.password = "pass"
        api = UserApi(current_user=user, session=session, config=app_config)
        assert user.username == "boby"
        user = api.set_username(user, "pass", "TheBoby")
        assert user.username == "TheBoby"

    @pytest.mark.internal_auth
    def test__unit__create__user__ok_nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password="password",
            name="bob",
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password("password")
        assert u.display_name == "bob"
        assert u.timezone == "+2"
        assert u.lang == "en"
        assert u.profile.slug == "users"

    def test_unit__user_with_email_exists__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bibi@bibi")
        api.update(u, "bibi", "bibi@bibi", "password", do_save=True)
        transaction.commit()

        assert api.user_with_email_exists("bibi@bibi") is True
        assert api.user_with_email_exists("unknown") is False

    def test_get_one_by_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bibi@bibi")
        session.flush()
        api.update(u, "bibi", "bibi@bibi", "password", do_save=True)
        uid = u.user_id
        transaction.commit()

        assert uid == api.get_one_by_email("bibi@bibi").user_id

    def test_get_one_by_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="boby", email="boby@boba.fet", save_now=True)
        session.flush()
        transaction.commit()

        assert u.user_id == api.get_one_by_username("boby").user_id

    def test_unit__get_one_by_email__err__user_does_not_exist(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(UserDoesNotExist):
            api.get_one_by_email("unknown")

    def test_unit__get_all__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        api.create_minimal_user("bibi@bibi", save_now=True)

        users = api.get_all()
        # u1 + Admin user from BaseFixture
        assert 2 == len(users)

    def test_unit__get_known_users__admin__too_short_acp_str(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        with pytest.raises(TooShortAutocompleteString):
            api.get_known_users("e")

    def test_unit__get_known_users__admin__by_email(self, session, app_config, admin_user):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)

        users = api.get_known_users("email")
        assert len(users) == 1
        assert users[0] == u1

    def test_unit__get_known_users__admin__by_username(self, session, app_config, admin_user):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(
            name="name", username="FooBarBaz", email="boby@boba.fet", do_notify=False, do_save=True
        )

        users = api.get_known_users("obar")
        assert len(users) == 1
        assert users[0] == u1

    def test_unit__get_known_users__user__no_workspace_empty_known_user(
        self, session, app_config, admin_user
    ):

        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        api2 = UserApi(current_user=u1, session=session, config=app_config)
        users = api2.get_known_users("email")
        assert len(users) == 0

    def test_unit__get_known_users__same_workspaces_users_by_name(
        self, session, app_config, role_api_factory, workspace_api_factory, admin_user
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u1, session=session, config=app_config)
        users = api2.get_known_users("name")
        assert len(users) == 2
        assert users[0] == u1
        assert users[1] == u2

    def test_unit__get_known_users__distinct_workspaces_users_by_name__exclude_workspace(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        wapi = workspace_api_factory.get()
        workspace_2 = wapi.create_workspace("test workspace n°2", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u3, session=session, config=app_config)
        users = api2.get_known_users("name", exclude_workspace_ids=[workspace.workspace_id])
        assert len(users) == 1
        assert users[0] == u2

    def test_unit__get_known_users__using_both_include_exclude_raises(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)

        with pytest.raises(CannotUseBothIncludeAndExcludeWorkspaceUsers):
            api.get_known_users("name", exclude_workspace_ids=[1], include_workspace_ids=[2])

    def test_unit__get_known_users__using_both_include_exclude_does_not_raise_if_one_empty(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        api.get_known_users("name", exclude_workspace_ids=[1], include_workspace_ids=[])
        api.get_known_users("name", exclude_workspace_ids=[], include_workspace_ids=[1])

    def test_unit__get_known_users__include_workspace_ids(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        u4 = api.create_user(email="email3@email3", name="name3", do_notify=False, do_save=True)
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        wapi = workspace_api_factory.get()
        workspace_2 = wapi.create_workspace("test workspace n°2", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u4, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u3, session=session, config=app_config)
        users = api2.get_known_users("name", include_workspace_ids=[workspace_2.workspace_id])
        assert set(users) == set([u2, u4])

    def test_unit__get_known_users__include_workspace_ids_short_acp_limit_ok(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)

        u1 = None
        for i in range(20):
            u1 = api.create_user(
                email="email{}@email".format(i),
                name="name{}".format(i),
                do_notify=False,
                do_save=True,
            )
            role_api = role_api_factory.get()
            role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)

        apiu1 = UserApi(current_user=u1, session=session, config=app_config)
        users = apiu1.get_known_users("", include_workspace_ids=[workspace.workspace_id], limit=10)

        assert len(users) == 10

    def test_unit__get_known_users__distinct_workspaces_users_by_name__exclude_workspace_and_name(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        u4 = api.create_user(email="email3@email3", name="name3", do_notify=False, do_save=True)
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        wapi = workspace_api_factory.get()
        workspace_2 = wapi.create_workspace("test workspace n°2", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u4, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u3, session=session, config=app_config)
        users = api2.get_known_users(
            "name", exclude_workspace_ids=[workspace.workspace_id], exclude_user_ids=[u4.user_id]
        )
        assert len(users) == 1
        assert users[0] == u2

    def test_unit__get_known_users__distinct_workspaces_users_by_name(
        self, session, app_config, workspace_api_factory, role_api_factory
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        wapi = workspace_api_factory.get()
        workspace_2 = wapi.create_workspace("test workspace n°2", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace_2, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace_2, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u3, session=session, config=app_config)
        users = api2.get_known_users("name")
        assert len(users) == 2
        assert users[0] == u1
        assert users[1] == u2

    def test_unit__get_known_users__same_workspaces_users_by_name__exclude_user(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u1, session=session, config=app_config)
        users = api2.get_known_users("name", exclude_user_ids=[u1.user_id])
        assert len(users) == 1
        assert users[0] == u2

    def test_unit__get_known_users__same_workspaces_users_by_email(
        self, session, app_config, workspace_api_factory, role_api_factory, admin_user
    ):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)
        u2 = api.create_user(email="email2@email2", name="name2", do_notify=False, do_save=True)
        u3 = api.create_user(
            email="notfound@notfound", name="notfound", do_notify=False, do_save=True
        )
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace n°1", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(u1, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u2, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(u3, workspace, UserRoleInWorkspace.READER, False)
        api2 = UserApi(current_user=u1, session=session, config=app_config)
        users = api2.get_known_users("email")
        assert len(users) == 2
        assert users[0] == u1
        assert users[1] == u2

    def test_unit__get_known_users__admin__by_name(self, session, app_config, admin_user):
        api = UserApi(current_user=admin_user, session=session, config=app_config)
        u1 = api.create_user(email="email@email", name="name", do_notify=False, do_save=True)

        users = api.get_known_users("nam")
        assert len(users) == 1
        assert users[0] == u1

    def test_unit__get_one__ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("titi@titi")
        api.update(u, "titi", "titi@titi", "password", do_save=True)
        one = api.get_one(u.user_id)
        assert u.user_id == one.user_id

    def test_unit__get_user_with_context__nominal_case(self, session, app_config):
        user = User(
            email="admin@tracim.tracim",
            display_name="Admin",
            is_active=True,
            profile=Profile.NOBODY,
        )
        api = UserApi(current_user=None, session=session, config=app_config)
        new_user = api.get_user_with_context(user)
        assert isinstance(new_user, UserInContext)
        assert new_user.user == user
        assert new_user.profile == "nobody"
        assert new_user.user_id == user.user_id
        assert new_user.email == "admin@tracim.tracim"
        assert new_user.display_name == "Admin"
        assert new_user.is_active is True
        assert new_user.has_avatar is False

    def test_unit__get_current_user_ok__nominal_case(self, session, app_config):
        user = User(email="admin@tracim.tracim")
        api = UserApi(current_user=user, session=session, config=app_config)
        new_user = api.get_current_user()
        assert isinstance(new_user, User)
        assert user == new_user

    def test_unit__get_current_user__err__user_not_exist(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(UserDoesNotExist):
            api.get_current_user()

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        user = api.authenticate(login="admin@admin.admin", password="admin@admin.admin")
        assert isinstance(user, User)
        assert user.email == "admin@admin.admin"
        assert user.auth_type == AuthType.INTERNAL

    @pytest.mark.internal_auth
    def test_unit__authenticate_user__ok__with_username(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        user = api.authenticate(login="TheAdmin", password="admin@admin.admin")
        assert isinstance(user, User)
        assert user.email == "admin@admin.admin"
        assert user.username == "TheAdmin"
        assert user.auth_type == AuthType.INTERNAL

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___err__user_not_active(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)

        profile = Profile.USER
        user = api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        api.disable(user)
        with pytest.raises(AuthenticationFailed):
            api.authenticate(login="test@test.test", password="test@test.test")

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___err__wrong_password(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(AuthenticationFailed):
            api.authenticate(login="admin@admin.admin", password="wrong_password")

    @pytest.mark.internal_auth
    def test_unit__authenticate_user___err__wrong_user(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(AuthenticationFailed):
            api.authenticate(login="admin@admin.admin", password="wrong_password")

    def test_unit__disable_user___ok__nominal_case(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)

        profile = Profile.USER
        user = api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        user2 = api.create_user(
            email="test2@test.test",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )

        api2 = UserApi(current_user=user, session=session, config=app_config)

        api2.disable(user2)
        updated_user2 = api.get_one(user2.user_id)
        assert updated_user2.is_active is False
        assert updated_user2.user_id == user2.user_id
        assert updated_user2.email == user2.email

    def test_unit__disable_user___err__user_cant_disable_itself(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)

        profile = Profile.USER
        user = api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )

        api2 = UserApi(current_user=user, session=session, config=app_config)
        from tracim_backend.exceptions import UserCantDisableHimself

        with pytest.raises(UserCantDisableHimself):
            api2.disable(user)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "base_test_ldap"}], indirect=True)
class TestFakeLDAPUserApi(object):
    @pytest.mark.ldap
    def test_unit__authenticate_user___err__no_ldap_connector(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(MissingLDAPConnector):
            api.authenticate(login="hubert@planetexpress.com", password="professor")

    @pytest.mark.xfail(reason="create account with specific profile ldap feature disabled")
    @pytest.mark.ldap
    def test_unit__authenticate_user___ok__new_user_ldap_auth_custom_profile(
        self, session, app_config
    ):
        # TODO - G.M - 2018-12-05 - [ldap_profile]
        # support for profile attribute disabled
        # Should be reenabled later probably with a better code
        class fake_ldap_connector(object):
            def authenticate(self, email: str, password: str):
                if not email == "hubert@planetexpress.com" and password == "professor":
                    return None
                return [
                    None,
                    {
                        "mail": ["huber@planetepress.com"],
                        "givenName": ["Hubert"],
                        "profile": ["trusted-users"],
                    },
                ]

        api = UserApi(current_user=None, session=session, config=app_config)
        user = api.authenticate(
            login="hubert@planetexpress.com",
            password="professor",
            ldap_connector=fake_ldap_connector(),
        )
        assert isinstance(user, User)
        assert user.email == "hubert@planetexpress.com"
        assert user.auth_type == AuthType.LDAP
        assert user.display_name == "Hubert"
        assert user.profile.slug == "trusted-users"

    @pytest.mark.ldap
    def test_unit__authenticate_user___ok__new_user_ldap_auth(self, session, app_config):
        class fake_ldap_connector(object):
            def authenticate(self, email: str, password: str):
                if not email == "hubert@planetexpress.com" and password == "professor":
                    return None
                return [None, {"mail": ["huber@planetepress.com"], "givenName": ["Hubert"]}]

        api = UserApi(current_user=None, session=session, config=app_config)
        user = api.authenticate(
            login="hubert@planetexpress.com",
            password="professor",
            ldap_connector=fake_ldap_connector(),
        )
        assert isinstance(user, User)
        assert user.email == "hubert@planetexpress.com"
        assert user.auth_type == AuthType.LDAP
        assert user.display_name == "Hubert"
        assert user.profile.slug == "users"

    @pytest.mark.ldap
    def test__unit__create_user__err__external_auth_ldap_with_password(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api.create_user(
                email="bob@bob",
                password="password",
                name="bob",
                auth_type=AuthType.LDAP,
                timezone="+2",
                lang="en",
                do_save=True,
                do_notify=False,
            )

    @pytest.mark.ldap
    def test__unit__create__user__ok__external_auth_ldap(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password(None) is False
        assert u.display_name == "bob"
        assert u.timezone == "+2"
        assert u.lang == "en"

    @pytest.mark.ldap
    def test_unit_update__ok_external_auth_ldap(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        api.update(
            email="bob@bob",
            user=u,
            name="bobi",
            password=None,
            auth_type=AuthType.LDAP,
            timezone="-1",
            lang="fr",
            do_save=True,
        )
        assert u.display_name == "bobi"

    @pytest.mark.ldap
    def test_unit_update__err__external_auth_ldap_set_password(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api.update(
                email="bob@bob",
                user=u,
                name="bobi",
                password="new_password",
                auth_type=AuthType.LDAP,
                timezone="-1",
                lang="fr",
                do_save=True,
            )

    @pytest.mark.ldap
    def test_unit_update__err__external_auth_ldap_set_email(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserEmailModificationDisallowed):
            api.update(
                email="bob@bob1",
                user=u,
                name="bobi",
                password=None,
                auth_type=AuthType.LDAP,
                timezone="-1",
                lang="fr",
                do_save=True,
            )

    @pytest.mark.ldap
    def test_unit__check_email_modification_allowed__err_external_auth_ldap(
        self, session, app_config
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserEmailModificationDisallowed):
            api._check_email_modification_allowed(u)

    @pytest.mark.ldap
    def test_unit__check_password_modification_allowed__err_external_auth_ldap(
        self, session, app_config
    ):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api._check_password_modification_allowed(u)

    @pytest.mark.ldap
    def test_unit_set_password__err__external_auth_ldap(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        api._user = u
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            api.set_password(u, "pass", "pass", "pass")

    @pytest.mark.ldap
    def test_unit_set_email__err__external_auth_ldap(self, session, app_config):
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_user(
            email="bob@bob",
            password=None,
            name="bob",
            auth_type=AuthType.LDAP,
            timezone="+2",
            lang="en",
            do_save=True,
            do_notify=False,
        )
        api._user = u
        with pytest.raises(ExternalAuthUserEmailModificationDisallowed):
            api.set_email(u, "pass", "bob@bobi")
