# coding=utf-8
import pytest

from tracim_backend.exceptions import UserRoleNotFound
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.models.auth import User
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
class TestRoleApi(object):
    def test_unit__get_one__ok__nominal_case(self, admin_user, session, app_config):
        rapi = RoleApi(current_user=admin_user, session=session, config=app_config)
        rapi.get_one(admin_user.user_id, 1)

    def test_unit__get_one__err__role_does_not_exist(self, session, app_config, admin_user):
        rapi = RoleApi(current_user=admin_user, session=session, config=app_config)
        with pytest.raises(UserRoleNotFound):
            rapi.get_one(admin_user.user_id, 100)  # workspace 100 does not exist

    def test_unit__create_one__nominal_case(
        self, admin_user, session, app_config, workspace_api_factory
    ):
        workspace = workspace_api_factory.get().create_workspace("workspace_1", save_now=True)
        bob = session.query(User).filter(User.email == "bob@fsf.local").one()
        rapi = RoleApi(current_user=admin_user, session=session, config=app_config)
        created_role = rapi.create_one(
            user=bob,
            workspace=workspace,
            role_level=WorkspaceRoles.CONTENT_MANAGER.level,
            with_notif=False,
        )
        obtain_role = rapi.get_one(bob.user_id, workspace.workspace_id)
        assert created_role == obtain_role

    def test_unit__get_all_for_usages(self, admin_user, session, app_config, workspace_api_factory):
        rapi = RoleApi(current_user=admin_user, session=session, config=app_config)
        workspace = workspace_api_factory.get().create_workspace("workspace_1", save_now=True)
        roles = rapi.get_all_for_workspace(workspace)
        assert len(roles) == 1
        assert roles[0].user_id == admin_user.user_id
        assert roles[0].role == WorkspaceRoles.WORKSPACE_MANAGER.level
