import pytest

from tracim_backend import AuthType
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests.fixtures import *  # noqa:F401,F403


@pytest.mark.usefixtures("base_fixture")
class TestParentAccessPlugin(object):
    def test__add_new_user_to_parent_workspaces__ok__nominal_case(
        self,
        admin_user,
        session,
        app_config,
        workspace_api_factory,
        role_api_factory,
        user_api_factory,
        load_parent_access_plugin,
    ):
        """
        Test if new users are correctly added to open workspace with auto_invite_plugin enabled
        """
        with load_parent_access_plugin:
            wapi = workspace_api_factory.get()
            parent_workspace = wapi.create_workspace(
                label="parent", default_user_role=WorkspaceRoles.READER
            )
            child_workspace = wapi.create_workspace(
                label="child", parent=parent_workspace, default_user_role=WorkspaceRoles.CONTRIBUTOR
            )
            grandson_workspace = wapi.create_workspace(
                label="grandson", parent=child_workspace, default_user_role=WorkspaceRoles.READER
            )
            uapi = user_api_factory.get()
            user_1 = uapi.create_user(
                email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
            )
            role_api = role_api_factory.get()
            role_api.create_one(
                user_1, grandson_workspace, WorkspaceRoles.CONTENT_MANAGER.level, False
            )

            assert grandson_workspace.get_user_role(user_1) == WorkspaceRoles.CONTENT_MANAGER.level
            assert child_workspace.get_user_role(user_1) == WorkspaceRoles.CONTRIBUTOR.level
            assert parent_workspace.get_user_role(user_1) == WorkspaceRoles.READER.level
