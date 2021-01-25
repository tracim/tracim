# -*- coding: utf-8 -*-
"""
Tests for /api/users/me subpath endpoints.
This is limited list, just to ensure the redirect between /me and /{user_id} work correctly
"""

import pytest
import transaction
from webob.compat import urlparse
from webtest import TestResponse

from tracim_backend.error import ErrorCode
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/me
    """

    def test_api__get_user__ok_200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["is_deleted"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountKnownMembersEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/me
    """

    def test_api__get_user__ok_200__admin__by_name(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get("/api/users/me/known_members", status=307, params=params).follow(
            status=200
        )
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["has_avatar"] is False

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["has_avatar"] is False

    def test_api__get_user__ok_200__admin__by_name_exclude_user(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_user_ids": str(test_user2.user_id)}
        res = web_testapp.get("/api/users/me/known_members", status=307, params=params).follow(
            status=200
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["has_avatar"] is False

    def test_api__get_user__err_403__admin__too_small_acp(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "t"}
        res = web_testapp.get("/api/users/me/known_members", status=307, params=params).follow(
            status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.ACP_STRING_TOO_SHORT

    def test_api__get_user__ok_200__normal_user_by_email(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        uapi.save(test_user3)
        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(test_user2, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get("/api/users/me/known_members", status=307, params=params).follow(
            status=200
        )
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["has_avatar"] is False

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["has_avatar"] is False


def follow_put_json(response: TestResponse, **kw):
    """
    Hack to follow put methode request as webtest follow does only ges.
    """
    location = response.headers["location"]
    abslocation = urlparse.urljoin(response.request.url, location)
    return response.test_app.put_json(abslocation, **kw)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetEmailEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/me/email
    """

    def test_api__set_account_email__err_400__admin_same_email(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "admin@admin.admin", "loggedin_user_password": "password"}
        res = follow_put_json(
            web_testapp.put_json("/api/users/me/email", params=params, status=307),
            status=400,
            params=params,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMAIL_ALREADY_EXISTS
        # Check After
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_account_email__err_403__admin_wrong_password(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "badpassword"}
        res = follow_put_json(
            web_testapp.put_json("/api/users/me/email", params=params, status=307),
            status=403,
            params=params,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD
        # Check After
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_account_email__ok_200__user_nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        follow_put_json(
            web_testapp.put_json("/api/users/me/email", params=params, status=307),
            status=200,
            params=params,
        )
        web_testapp.authorization = ("Basic", ("mysuperemail@email.fr", "password"))
        # Check After
        res = web_testapp.get("/api/users/me", status=307).follow(status=200)
        res = res.json_body
        assert res["email"] == "mysuperemail@email.fr"
