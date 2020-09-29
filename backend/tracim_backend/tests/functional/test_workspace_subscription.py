# -*- coding: utf-8 -*-
"""
Tests for endpoints related to workspace subscription
"""


import pytest
import transaction
from webtest import TestApp

from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.data import WorkspaceSubscriptionState
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import SubscriptionLibFactory
from tracim_backend.tests.utils import UserApiFactory
from tracim_backend.tests.utils import WorkspaceApiFactory


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSubscriptionEndpoint(object):
    """
    Tests for GET and PUT /api/users/{user_id}/subscriptions
    """

    def test__get_user_subscription__ok__200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
    ):
        workspace_api_factory.get().create_workspace(
            "open", access_type=WorkspaceAccessType.OPEN, save_now=True
        )
        on_request_workspace = workspace_api_factory.get().create_workspace(
            "on_request", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )
        on_request_workspace_2 = workspace_api_factory.get().create_workspace(
            "on_request_2", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )
        workspace_api_factory.get().create_workspace(
            "confidential", access_type=WorkspaceAccessType.CONFIDENTIAL, save_now=True
        )

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
        subscription_lib_factory.get(test_user).submit_subscription(
            workspace_id=on_request_workspace.workspace_id
        )
        subscription = subscription_lib_factory.get(test_user).submit_subscription(
            workspace_id=on_request_workspace_2.workspace_id
        )
        subscription_lib_factory.get().reject_subscription(subscription)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id), status=200
        )
        assert len(res.json_body) == 2
        first_subscription = res.json_body[0]
        assert first_subscription["state"] == WorkspaceSubscriptionState.PENDING.value
        assert first_subscription["workspace"]["workspace_id"] == on_request_workspace.workspace_id
        assert first_subscription["author"]["user_id"] == test_user.user_id
        assert first_subscription["created_date"]
        assert first_subscription["evaluation_date"] is None
        assert first_subscription["evaluator"] is None

        second_subscription = res.json_body[1]
        assert second_subscription["state"] == WorkspaceSubscriptionState.REJECTED.value
        assert (
            second_subscription["workspace"]["workspace_id"] == on_request_workspace_2.workspace_id
        )
        assert second_subscription["author"]["user_id"] == test_user.user_id
        assert second_subscription["created_date"]
        assert second_subscription["evaluation_date"]
        assert second_subscription["evaluator"]["user_id"] == admin_user.user_id

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res2 = web_testapp.get(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id), status=200
        )
        assert res.json_body == res2.json_body

    def test__subscribe_workspace__ok__200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
    ):
        on_request_workspace = workspace_api_factory.get().create_workspace(
            "on_request", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )

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
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"workspace_id": on_request_workspace.workspace_id}
        res = web_testapp.put_json(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id),
            status=200,
            params=params,
        )
        subscription = res.json_body
        assert subscription["state"] == WorkspaceSubscriptionState.PENDING.value
        assert subscription["workspace"]["workspace_id"] == on_request_workspace.workspace_id
        assert subscription["author"]["user_id"] == test_user.user_id
        assert subscription["created_date"]
        assert subscription["evaluation_date"] is None
        assert subscription["evaluator"] is None


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestWorkspaceSubscriptionEndpoint(object):
    """
    Tests for GET and PUT /api/users/{user_id}/subscriptions
    """

    def test__get_workspace_subscription__ok__200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
    ):
        on_request_workspace = workspace_api_factory.get().create_workspace(
            "on_request", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )

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
        subscription_lib_factory.get(test_user).submit_subscription(
            workspace_id=on_request_workspace.workspace_id
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/subscriptions".format(on_request_workspace.workspace_id), status=200
        )
        assert len(res.json_body) == 1
        first_subscription = res.json_body[0]
        assert first_subscription["state"] == WorkspaceSubscriptionState.PENDING.value
        assert first_subscription["workspace"]["workspace_id"] == on_request_workspace.workspace_id
        assert first_subscription["author"]["user_id"] == test_user.user_id
        assert first_subscription["created_date"]
        assert first_subscription["evaluation_date"] is None
        assert first_subscription["evaluator"] is None

    def test__accept_workspace_subscription__ok__200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
    ):
        on_request_workspace = workspace_api_factory.get().create_workspace(
            "on_request", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )

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
        subscription_lib_factory.get(test_user).submit_subscription(
            workspace_id=on_request_workspace.workspace_id
        )
        transaction.commit()
        params = {"role": "contributor"}
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/workspaces/{}/subscriptions/{}/accept".format(
                on_request_workspace.workspace_id, test_user.user_id
            ),
            status=204,
            params=params,
        )

    def test__reject_workspace_subscription__ok__200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
    ):
        on_request_workspace = workspace_api_factory.get().create_workspace(
            "on_request", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )

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
        subscription_lib_factory.get(test_user).submit_subscription(
            workspace_id=on_request_workspace.workspace_id
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/workspaces/{}/subscriptions/{}/reject".format(
                on_request_workspace.workspace_id, test_user.user_id
            ),
            status=204,
        )
