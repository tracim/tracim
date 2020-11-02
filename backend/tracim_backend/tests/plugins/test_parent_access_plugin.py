import pytest
import transaction

from tracim_backend import AuthType
from tracim_backend.models.data import WorkspaceAccessType
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
        Test if new users are correctly added to ancestor workspaces with parent_access enabled
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

    def test__add_new_user_to_parent_workspaces__ok__several_child_workspaces(
        self,
        admin_user,
        session,
        app_config,
        workspace_api_factory,
        role_api_factory,
        user_api_factory,
        load_parent_access_plugin,
        load_auto_invite_plugin,
    ):
        """
        Non-regression tests to verify that parent access doesn't try to add several times
        the same role if a user is added to several spaces in the same tree.
        """
        wapi = workspace_api_factory.get()
        parent_workspace = wapi.create_workspace(
            label="parent", default_user_role=WorkspaceRoles.READER
        )
        child2_workspace = wapi.create_workspace(
            label="child2", parent=parent_workspace, default_user_role=WorkspaceRoles.CONTRIBUTOR,
        )
        grandchild_workspace = wapi.create_workspace(
            label="grandchild",
            parent=child2_workspace,
            default_user_role=WorkspaceRoles.CONTRIBUTOR,
            access_type=WorkspaceAccessType.OPEN,
        )
        child_workspace = wapi.create_workspace(
            label="child",
            parent=parent_workspace,
            default_user_role=WorkspaceRoles.CONTRIBUTOR,
            access_type=WorkspaceAccessType.OPEN,
        )
        with load_auto_invite_plugin, load_parent_access_plugin:
            uapi = user_api_factory.get()
            user_1 = uapi.create_user(
                email="u.1@u.u", auth_type=AuthType.INTERNAL, do_save=True, do_notify=False
            )
            session.flush()
            assert grandchild_workspace.get_user_role(user_1) == WorkspaceRoles.CONTRIBUTOR.level
            assert child_workspace.get_user_role(user_1) == WorkspaceRoles.CONTRIBUTOR.level
            assert child2_workspace.get_user_role(user_1) == WorkspaceRoles.CONTRIBUTOR.level
            assert parent_workspace.get_user_role(user_1) == WorkspaceRoles.READER.level
            transaction.commit()
