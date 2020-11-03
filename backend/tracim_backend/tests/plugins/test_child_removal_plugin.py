import pytest

from tracim_backend import AuthType
from tracim_backend.exceptions import UserRoleNotFound
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
        load_child_removal_plugin,
    ):
        """
        Test if users are correctly removed from descendant workspaces with child_removal enabled
        """
        with load_child_removal_plugin:
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
            for workspace in (parent_workspace, child_workspace, grandson_workspace):
                role_api.create_one(user_1, workspace, WorkspaceRoles.CONTENT_MANAGER.level, False)
            role_api.delete_one(user_1.user_id, parent_workspace.workspace_id)
            with pytest.raises(UserRoleNotFound):
                assert role_api.get_one(user_1.user_id, child_workspace.workspace_id)
            with pytest.raises(UserRoleNotFound):
                assert role_api.get_one(user_1.user_id, grandson_workspace.workspace_id)
