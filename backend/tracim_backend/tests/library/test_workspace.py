# -*- coding: utf-8 -*-
import pytest

from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestThread(object):
    def test_children(
        self, admin_user, session, app_config, content_api_factory, content_type_list
    ):
        workspace = WorkspaceApi(
            current_user=admin_user, session=session, config=app_config
        ).create_workspace("workspace_1", save_now=True)
        folder = Content(type=content_type_list.Folder.slug, owner=admin_user)
        folder.label = "folder_1"
        folder.workspace = workspace
        session.add(folder)
        session.flush()

        thread = Content(type=content_type_list.Thread.slug, owner=admin_user, parent=folder)
        thread.label = "thread_1"
        thread.workspace = workspace
        session.add(folder)
        session.flush()
        workspace = session.query(Workspace).filter(Workspace.label == "workspace_1").one()
        content_api = content_api_factory.get()
        folder = content_api.get_canonical_query().filter(Content.label == "folder_1").one()
        assert [folder] == list(workspace.get_valid_children())

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

    def test__unit__get_notifiable_roles__ok__do_not_show_without_email(
        self, admin_user, session, app_config, user_api_factory, role_api_factory
    ):
        app_config.EMAIL__REQUIRED = False
        wapi = WorkspaceApi(session=session, config=app_config, current_user=admin_user)
        workspace = wapi.create_workspace(label="workspace w", save_now=True)
        uapi = user_api_factory.get()
        user_1 = uapi.create_user(
            email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        user_2 = uapi.create_user(
            username="U42", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
        )
        assert wapi.get_notifiable_roles(workspace=workspace) == []

        rapi = role_api_factory.get()
        role_1 = rapi.create_one(user_1, workspace, UserRoleInWorkspace.READER, with_notif=True)
        role_2 = rapi.create_one(user_2, workspace, UserRoleInWorkspace.READER, with_notif=True)

        assert role_1 in wapi.get_notifiable_roles(workspace=workspace)
        assert role_2 not in wapi.get_notifiable_roles(workspace=workspace)

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
        self, admin_user, session, app_config, user_api_factory, role_api_factory
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

        u = uapi.create_minimal_user("u.s@e.r", profile=Profile.USER, save_now=True)
        wapi = WorkspaceApi(session=session, current_user=u, config=app_config)
        rapi = role_api_factory.get()
        rapi.create_one(u, w4, UserRoleInWorkspace.READER, False)
        rapi.create_one(u, w3, UserRoleInWorkspace.CONTRIBUTOR, False)
        rapi.create_one(u, w2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(u, w1, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        assert [] == wapi.get_all_manageable()
        # Checks a manager gets only its own workspaces.
        u.profile = Profile.TRUSTED_USER
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

    def test_unit__create_workspace_same__ok__same_workspace_name_allowed(
        self, admin_user, session, app_config
    ):

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        wapi.create_workspace(label="business", save_now=True)
        wapi.create_workspace(label="business", save_now=True)

    def test_unit__rename_workspace_same_workspace_same_name__ok__nominal_case(
        self, admin_user, session, app_config
    ):

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        workspace1 = wapi.create_workspace(label="business", save_now=True)
        modified_datetime = workspace1.updated
        wapi.update_workspace(workspace=workspace1, label="business", description="")
        assert workspace1.updated != modified_datetime

    def test_unit__rename_workspace_same_name_other_workspace__ok__same_workspace_name_allowed(
        self, session, admin_user, app_config
    ):

        wapi = WorkspaceApi(session=session, current_user=admin_user, config=app_config)
        wapi.create_workspace(label="business", save_now=True)
        workspace2 = wapi.create_workspace(label="meeting", save_now=True)
        wapi.update_workspace(workspace=workspace2, label="business", save_now=True, description="")
