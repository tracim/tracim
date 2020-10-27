import pytest

from tracim_backend import AuthType
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests.fixtures import *  # noqa:F401,F403


@pytest.mark.usefixtures("base_fixture")
class TestAutoInvitePlugin(object):
    @pytest.mark.parametrize(
        "workspace_access_type,workspace_default_role, users_role",
        [
            (WorkspaceAccessType.OPEN, WorkspaceRoles.READER, WorkspaceRoles.READER),
            (WorkspaceAccessType.OPEN, WorkspaceRoles.CONTRIBUTOR, WorkspaceRoles.CONTRIBUTOR),
            (
                WorkspaceAccessType.OPEN,
                WorkspaceRoles.WORKSPACE_MANAGER,
                WorkspaceRoles.WORKSPACE_MANAGER,
            ),
            (WorkspaceAccessType.ON_REQUEST, WorkspaceRoles.READER, WorkspaceRoles.NOT_APPLICABLE),
            (
                WorkspaceAccessType.CONFIDENTIAL,
                WorkspaceRoles.CONTENT_MANAGER,
                WorkspaceRoles.NOT_APPLICABLE,
            ),
        ],
    )
    def test__add_new_user_to_open_workspaces__ok__nominal_case(
        self,
        admin_user,
        session,
        app_config,
        workspace_api_factory,
        user_api_factory,
        workspace_access_type,
        workspace_default_role,
        users_role,
        load_auto_invite_plugin,
    ):
        """
        Test if new users are correctly added to open workspaces with auto_invite_plugin enabled
        """
        with load_auto_invite_plugin:
            wapi = workspace_api_factory.get()
            workspace = wapi.create_workspace(
                label="myworkspace",
                default_user_role=workspace_default_role,
                access_type=workspace_access_type,
            )
            uapi = user_api_factory.get()
            user_1 = uapi.create_user(
                email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
            )
            user_2 = uapi.create_user(
                email="u.2@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
            )
            uapi = user_api_factory.get()
            assert workspace.get_user_role(admin_user) == WorkspaceRoles.WORKSPACE_MANAGER.level
            assert workspace.get_user_role(user_1) == users_role.level
            assert workspace.get_user_role(user_2) == users_role.level

    @pytest.mark.parametrize(
        "workspace_access_type,workspace_default_role, users_role",
        [
            (WorkspaceAccessType.OPEN, WorkspaceRoles.READER, WorkspaceRoles.READER),
            (WorkspaceAccessType.OPEN, WorkspaceRoles.CONTRIBUTOR, WorkspaceRoles.CONTRIBUTOR),
            (
                WorkspaceAccessType.OPEN,
                WorkspaceRoles.WORKSPACE_MANAGER,
                WorkspaceRoles.WORKSPACE_MANAGER,
            ),
            (WorkspaceAccessType.ON_REQUEST, WorkspaceRoles.READER, WorkspaceRoles.NOT_APPLICABLE),
            (
                WorkspaceAccessType.CONFIDENTIAL,
                WorkspaceRoles.CONTENT_MANAGER,
                WorkspaceRoles.NOT_APPLICABLE,
            ),
        ],
    )
    def test__add_user_to_new_open_workspaces__ok__nominal_case(
        self,
        admin_user,
        session,
        app_config,
        workspace_api_factory,
        user_api_factory,
        workspace_access_type,
        workspace_default_role,
        users_role,
        load_auto_invite_plugin,
    ):
        """
        Test if existing users are correctly added to new open workspaces with auto_invite_plugin enabled
        """
        with load_auto_invite_plugin:
            uapi = user_api_factory.get()
            user_1 = uapi.create_user(
                email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
            )
            user_2 = uapi.create_user(
                email="u.2@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
            )
            wapi = workspace_api_factory.get()
            workspace = wapi.create_workspace(
                label="myworkspace",
                default_user_role=workspace_default_role,
                access_type=workspace_access_type,
            )
            uapi = user_api_factory.get()
            assert workspace.get_user_role(admin_user) == WorkspaceRoles.WORKSPACE_MANAGER.level
            assert workspace.get_user_role(user_1) == users_role.level
            assert workspace.get_user_role(user_2) == users_role.level
