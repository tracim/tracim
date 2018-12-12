# coding=utf-8
import pytest
from sqlalchemy.orm.exc import NoResultFound
from tracim_backend.exceptions import UserRoleNotFound

from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.models.auth import User
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.tests import DefaultTest
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.fixtures.content import Content as ContentFixture


class TestRoleApi(DefaultTest):

    fixtures = [BaseFixture, ContentFixture]

    def test_unit__get_one__ok__nominal_case(self):
        admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        rapi = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        rapi.get_one(admin.user_id, 1)

    def test_unit__get_one__err__role_does_not_exist(self):
        admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        rapi = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(UserRoleNotFound):
            rapi.get_one(admin.user_id, 100)  # workspace 100 does not exist

    def test_unit__create_one__nominal_case(self):
        admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        workspace = self._create_workspace_and_test(
            'workspace_1',
            admin
        )
        bob = self.session.query(User)\
            .filter(User.email == 'bob@fsf.local').one()
        rapi = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        created_role = rapi.create_one(
            user=bob,
            workspace=workspace,
            role_level=WorkspaceRoles.CONTENT_MANAGER.level,
            with_notif=False,
        )
        obtain_role = rapi.get_one(bob.user_id, workspace.workspace_id)
        assert created_role == obtain_role

    def test_unit__get_all_for_usages(self):
        admin = self.session.query(User)\
            .filter(User.email == 'admin@admin.admin').one()
        rapi = RoleApi(
            current_user=admin,
            session=self.session,
            config=self.app_config,
        )
        workspace = self._create_workspace_and_test(
            'workspace_1',
            admin
        )
        roles = rapi.get_all_for_workspace(workspace)
        len(roles) == 1
        roles[0].user_id == admin.user_id
        roles[0].role == WorkspaceRoles.WORKSPACE_MANAGER.level

