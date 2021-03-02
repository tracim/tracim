# -*- coding: utf-8 -*-
"""
Tests for endpoints related to workspace subscription
"""


import pytest
import transaction
from webtest import TestApp

from tracim_backend.error import ErrorCode
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.data import WorkspaceSubscriptionState
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import EventHelper
from tracim_backend.tests.utils import RoleApiFactory
from tracim_backend.tests.utils import SubscriptionLibFactory
from tracim_backend.tests.utils import UserApiFactory
from tracim_backend.tests.utils import WorkspaceApiFactory
from tracim_backend.views.core_api.schemas import UserDigestSchema


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
        subscription_lib_factory.get(test_user).submit_subscription(workspace=on_request_workspace)
        subscription = subscription_lib_factory.get(test_user).submit_subscription(
            workspace=on_request_workspace_2
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
        event_helper: EventHelper,
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

        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id), status=200
        )
        last_event = event_helper.last_event
        assert last_event.event_type == "workspace_subscription.created"
        author = web_testapp.get("/api/users/{}".format(test_user.user_id), status=200).json_body
        assert last_event.author ==  UserDigestSchema().dump(author).data
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(on_request_workspace.workspace_id), status=200
        ).json_body
        assert last_event.workspace == workspace
        assert last_event.subscription["state"] == subscription["state"]
        assert last_event.subscription["workspace"] == subscription["workspace"]
        assert last_event.subscription["author"] == subscription["author"]
        assert last_event.subscription["evaluator"] == subscription["evaluator"]

    def test__subscribe_workspace__err__400__not_a_on_request_workspace(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
    ):
        open_workspace = workspace_api_factory.get().create_workspace(
            "open", access_type=WorkspaceAccessType.OPEN, save_now=True
        )
        on_request_workspace = workspace_api_factory.get().create_workspace(
            "on_request", access_type=WorkspaceAccessType.ON_REQUEST, save_now=True
        )
        confidential_workspace = workspace_api_factory.get().create_workspace(
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
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"workspace_id": on_request_workspace.workspace_id}
        res = web_testapp.put_json(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id),
            status=200,
            params=params,
        )
        params = {"workspace_id": open_workspace.workspace_id}
        res = web_testapp.put_json(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.INVALID_WORKSPACE_ACCESS_TYPE
        params = {"workspace_id": confidential_workspace.workspace_id}
        res = web_testapp.put_json(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.INVALID_WORKSPACE_ACCESS_TYPE

    def test__subscribe_workspace__ok__200__resubscribe_to_rejected_subscription(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
        event_helper: EventHelper,
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
        subscription = subscription_lib_factory.get(test_user).submit_subscription(
            workspace=on_request_workspace
        )
        subscription_lib_factory.get().reject_subscription(subscription)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))

        res = web_testapp.get(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id), status=200
        )
        assert len(res.json_body) == 1
        subscription = res.json_body[0]
        assert subscription["state"] == WorkspaceSubscriptionState.REJECTED.value
        assert subscription["workspace"]["workspace_id"] == on_request_workspace.workspace_id
        assert subscription["author"]["user_id"] == test_user.user_id
        assert subscription["created_date"]
        assert subscription["evaluation_date"]
        assert subscription["evaluator"]["user_id"] == admin_user.user_id

        # resubscribe rejected subscription
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

        last_event = event_helper.last_event
        assert last_event.event_type == "workspace_subscription.modified"
        author = web_testapp.get("/api/users/{}".format(test_user.user_id), status=200).json_body
        assert last_event.author ==  UserDigestSchema().dump(author).data
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(on_request_workspace.workspace_id), status=200
        ).json_body
        assert last_event.workspace == workspace
        assert last_event.subscription["state"] == subscription["state"]
        assert last_event.subscription["workspace"] == subscription["workspace"]
        assert last_event.subscription["author"] == subscription["author"]
        assert last_event.subscription["evaluator"] == subscription["evaluator"]

        # after resubscribe
        res = web_testapp.get(
            "/api/users/{}/workspace_subscriptions".format(test_user.user_id), status=200
        )
        assert len(res.json_body) == 1
        subscription = res.json_body[0]
        assert subscription["state"] == WorkspaceSubscriptionState.PENDING.value
        assert subscription["workspace"]["workspace_id"] == on_request_workspace.workspace_id
        assert subscription["author"]["user_id"] == test_user.user_id
        assert subscription["created_date"]
        assert subscription["evaluation_date"] is None
        assert subscription["evaluator"] is None

        last_event = event_helper.last_event
        assert last_event.event_type == "workspace_subscription.modified"
        author = web_testapp.get("/api/users/{}".format(test_user.user_id), status=200).json_body
        assert last_event.author ==  UserDigestSchema().dump(author).data
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(on_request_workspace.workspace_id), status=200
        ).json_body
        assert last_event.workspace == workspace
        assert last_event.subscription["state"] == subscription["state"]
        assert last_event.subscription["workspace"] == subscription["workspace"]
        assert last_event.subscription["author"] == subscription["author"]
        assert last_event.subscription["evaluator"] == subscription["evaluator"]


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
        subscription_lib_factory.get(test_user).submit_subscription(workspace=on_request_workspace)
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
        subscription_lib_factory.get(test_user).submit_subscription(workspace=on_request_workspace)
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
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.get(
            "/api/workspaces/{}".format(on_request_workspace.workspace_id), status=200,
        )

    def test__accept_workspace_subscription__err__400__already_in(
        self,
        user_api_factory: UserApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        subscription_lib_factory: SubscriptionLibFactory,
        role_api_factory: RoleApiFactory,
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
        rapi = role_api_factory.get()
        rapi.create_one(test_user, on_request_workspace, UserRoleInWorkspace.READER, False)
        subscription_lib_factory.get(test_user).submit_subscription(workspace=on_request_workspace)
        transaction.commit()
        params = {"role": "contributor"}
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.put_json(
            "/api/workspaces/{}/subscriptions/{}/accept".format(
                on_request_workspace.workspace_id, test_user.user_id
            ),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.USER_ROLE_ALREADY_EXIST

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
        subscription_lib_factory.get(test_user).submit_subscription(workspace=on_request_workspace)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/workspaces/{}/subscriptions/{}/reject".format(
                on_request_workspace.workspace_id, test_user.user_id
            ),
            status=204,
        )
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/workspaces/{}".format(on_request_workspace.workspace_id), status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND
