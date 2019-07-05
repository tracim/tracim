# -*- coding: utf-8 -*-
import pytest

from tracim_backend.exceptions import WorkspaceLabelAlreadyUsed
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Group
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
class TestThread(object):
    # # FIXME - G.M - 2019-07-05 - TODO !!!
    # def test_children(self, admin_user, session, app_config, content_api_factory):
    #
    #     _create_thread_and_test(
    #         workspace_name="workspace_1", folder_name="folder_1", thread_name="thread_1", user=admin_user
    #     )
    #     workspace = session.query(Workspace).filter(Workspace.label == "workspace_1").one()
    #     content_api = content_api_factory.get()
    #     folder = content_api.get_canonical_query().filter(Content.label == "folder_1").one()
    #     assert [folder] == list(workspace.get_valid_children())

    def test__unit__get_notifiable_roles__ok__nominal_case(
        self, admin_user, session, app_config, user_api_factory, role_api_factory
    ):

        wapi = WorkspaceApi(session=session, config=app_config, current_user=admin_user)
        workspace = wapi.create_workspace(label="workspace w", save_now=True)
        uapi = user_api_factory.get()
        user_1 = uapi.create_user(
            email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        user_2 = uapi.create_user(
            email="u.2@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        assert wapi.get_notifiable_roles(workspace=workspace) == []
        rapi = role_api_factory.get()
        role_1 = rapi.create_one(user_1, workspace, UserRoleInWorkspace.READER, with_notif=True)
        role_2 = rapi.create_one(user_2, workspace, UserRoleInWorkspace.READER, with_notif=False)
        assert role_1 in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 not in wapi.get_notifiable_roles(workspace=workspace)

    def test__unit__get_notifiable_roles__ok__do_not_show_inactive(
        self, admin_user, session, app_config, user_api_factory, role_api_factory
    ):

        wapi = WorkspaceApi(session=session, config=app_config, current_user=admin_user)
        workspace = wapi.create_workspace(label="workspace w", save_now=True)
        uapi = user_api_factory.get()
        user_1 = uapi.create_user(
            email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        user_2 = uapi.create_user(
            email="u.2@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        assert wapi.get_notifiable_roles(workspace=workspace) == []

        rapi = role_api_factory.get()
        role_1 = rapi.create_one(user_1, workspace, UserRoleInWorkspace.READER, with_notif=True)
        role_2 = rapi.create_one(user_2, workspace, UserRoleInWorkspace.READER, with_notif=True)

        assert role_1 in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 in wapi.get_notifiable_roles(workspace=workspace)

        user_1.is_active = False
        assert role_1 not in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 in wapi.get_notifiable_roles(workspace=workspace)

    def test__unit__get_notifiable_roles__ok__do_not_show_deleted(
        self, admin_user, session, app_config, user_api_factory, role_api_factory
    ):

        wapi = WorkspaceApi(session=session, config=app_config, current_user=admin_user)
        workspace = wapi.create_workspace(label="workspace w", save_now=True)
        uapi = user_api_factory.get()
        user_1 = uapi.create_user(
            email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        user_2 = uapi.create_user(
            email="u.2@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        assert wapi.get_notifiable_roles(workspace=workspace) == []

        rapi = role_api_factory.get()
        role_1 = rapi.create_one(user_1, workspace, UserRoleInWorkspace.READER, with_notif=True)
        role_2 = rapi.create_one(user_2, workspace, UserRoleInWorkspace.READER, with_notif=True)

        assert role_1 in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 in wapi.get_notifiable_roles(workspace=workspace)

        user_1.is_deleted = True
        assert role_1 not in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 in wapi.get_notifiable_roles(workspace=workspace)

    def test__unit__get_notifiable_roles__ok__do_not_show_unknown_auth(
        self, admin_user, session, app_config, user_api_factory, role_api_factory
    ):

        wapi = WorkspaceApi(session=session, config=app_config, current_user=admin_user)
        workspace = wapi.create_workspace(label="workspace w", save_now=True)
        uapi = user_api_factory.get()

        user_1 = uapi.create_user(
            email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        user_2 = uapi.create_user(
            email="u.2@u.u", auth_type=AuthType.UNKNOWN, do_save=True, do_notify=False
        )
        user_3 = uapi.create_user(
            email="u.3@u.u", auth_type=AuthType.REMOTE, do_save=True, do_notify=False
        )
        assert wapi.get_notifiable_roles(workspace=workspace) == []

        rapi = role_api_factory.get()
        role_1 = rapi.create_one(user_1, workspace, UserRoleInWorkspace.READER, with_notif=True)
        role_2 = rapi.create_one(user_2, workspace, UserRoleInWorkspace.READER, with_notif=True)
        role_3 = rapi.create_one(user_3, workspace, UserRoleInWorkspace.READER, with_notif=True)

        assert role_1 in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 not in wapi.get_notifiable_roles(workspace=workspace)
        assert role_3 in wapi.get_notifiable_roles(workspace=workspace)

    def test_unit__get_all_manageable(
        self, admin_user, session, app_config, user_api_factory, group_api_factory, role_api_factory
    ):

        uapi = user_api_factory.get()
        # Checks a case without workspaces.
        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        assert [] == wapi.get_all_manageable()
        # Checks an admin_user gets all workspaces.
        w4 = wapi.create_workspace(label="w4")
        w3 = wapi.create_workspace(label="w3")
        w2 = wapi.create_workspace(label="w2")
        w1 = wapi.create_workspace(label="w1")
        assert [w1, w2, w3, w4] == wapi.get_all_manageable()
        # Checks a regular user gets none workspace.
        gapi = group_api_factory.get()
        u = uapi.create_minimal_user("u.s@e.r", [gapi.get_one(Group.TIM_USER)], True)
        wapi = WorkspaceApi(session=session, current_user=u, config=app_config)
        rapi = role_api_factory.get()
        rapi.create_one(u, w4, UserRoleInWorkspace.READER, False)
        rapi.create_one(u, w3, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(u, w2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(u, w1, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        assert [] == wapi.get_all_manageable()
        # Checks a manager gets only its own workspaces.
        u.groups.append(gapi.get_one(Group.TIM_MANAGER))
        rapi.delete_one(u.user_id, w2.workspace_id)
        rapi.create_one(u, w2, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        assert [w1, w2] == wapi.get_all_manageable()

    def test__unit__workspace_deletion__ok__nominal_case(
        self, session, admin_user, app_config
    ) -> None:

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        business_workspace = wapi.create_workspace(label="business")
        assert business_workspace.label == "business"
        wapi.delete(business_workspace)
        assert business_workspace.is_deleted is True
        assert business_workspace.label != "business"
        assert business_workspace.label.startswith("business-deleted-")

    def test_unit__create_workspace_same__error__same_workspace_name_unallowed(
        self, admin_user, session, app_config
    ):

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        wapi.create_workspace(label="business", save_now=True)
        with pytest.raises(WorkspaceLabelAlreadyUsed):
            wapi.create_workspace(label="business", save_now=True)

    def test_unit__rename_workspace_same_wworkspace_same_name__ok__nominal_case(
        self, admin_user, session, app_config
    ):

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        workspace1 = wapi.create_workspace(label="business", save_now=True)
        modified_datetime = workspace1.updated
        try:
            wapi.update_workspace(workspace=workspace1, label="business", description="")
        except WorkspaceLabelAlreadyUsed:
            pytest.fail("Unexpected WorkspaceLabelAlreadyUsed..")
        assert workspace1.updated != modified_datetime

    def test_unit__rename_workspace_same_name_other_workspace__err__same_workspace_name_unallowed(
        self, session, admin_user, app_config
    ):

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        wapi.create_workspace(label="business", save_now=True)
        workspace2 = wapi.create_workspace(label="meeting", save_now=True)
        with pytest.raises(WorkspaceLabelAlreadyUsed):
            wapi.update_workspace(
                workspace=workspace2, label="business", save_now=True, description=""
            )
