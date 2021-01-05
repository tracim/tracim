import pytest

from tracim_backend import AuthType
from tracim_backend.exceptions import UserRoleNotFound
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests.fixtures import *  # noqa:F401,F403


class RemoveFromAllSpacesPlugin:
    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        wapi = WorkspaceApi(context.dbsession, None, context.app_config)
        rapi = RoleApi(context.dbsession, None, context.app_config)
        for workspace in wapi.get_all_for_user(role.user):
            rapi.delete_one(role.user.user_id, workspace.workspace_id, flush=False)


@pytest.mark.usefixtures("base_fixture")
class TestChildRemovalPlugin(object):
    def test__remove_user_from_descendant_workspaces__ok__nominal_case(
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

    def test__remove_user_from_descendant_workspaces__ok__also_removed_in_another_plugin(
        self,
        admin_user,
        session,
        app_config,
        workspace_api_factory,
        role_api_factory,
        user_api_factory,
        load_child_removal_plugin,
        test_context,
    ):
        """
        Test if users are correctly removed from descendant workspaces with child_removal enabled
        """
        test_context.plugin_manager.register(RemoveFromAllSpacesPlugin())
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
