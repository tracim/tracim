# coding=utf-8
import unittest
import pytest
from tracim.exceptions import RoleDoesNotExist
from tracim.models.roles import WorkspaceRoles


class TestWorkspacesRoles(unittest.TestCase):
    """
    Test for WorkspaceRoles Enum Object
    """
    def test_workspace_roles__ok__all_list(self):
        roles = list(WorkspaceRoles)
        assert len(roles) == 5
        for role in roles:
            assert role
            assert role.slug
            assert isinstance(role.slug, str)
            assert role.level or role.level == 0
            assert isinstance(role.level, int)
            assert role.label
            assert isinstance(role.slug, str)
        assert WorkspaceRoles['READER']
        assert WorkspaceRoles['NOT_APPLICABLE']
        assert WorkspaceRoles['CONTRIBUTOR']
        assert WorkspaceRoles['WORKSPACE_MANAGER']
        assert WorkspaceRoles['CONTENT_MANAGER']

    def test__workspace_roles__ok__check_model(self):
        role = WorkspaceRoles.WORKSPACE_MANAGER
        assert role
        assert role.slug
        assert isinstance(role.slug, str)
        assert role.level
        assert isinstance(role.level, int)
        assert role.label
        assert isinstance(role.slug, str)

    def test_workspace_roles__ok__get_all_valid_roles(self):
        roles = WorkspaceRoles.get_all_valid_role()
        assert len(roles) == 4
        for role in roles:
            assert role
            assert role.slug
            assert isinstance(role.slug, str)
            assert role.level or role.level == 0
            assert isinstance(role.level, int)
            assert role.level > 0
            assert role.label
            assert isinstance(role.slug, str)

    def test_workspace_roles__ok__get_role__from_level__ok__nominal_case(self):
        role = WorkspaceRoles.get_role_from_level(0)

        assert role
        assert role.slug
        assert isinstance(role.slug, str)
        assert role.level == 0
        assert isinstance(role.level, int)
        assert role.label
        assert isinstance(role.slug, str)

    def test_workspace_roles__ok__get_role__from_slug__ok__nominal_case(self):
        role = WorkspaceRoles.get_role_from_slug('reader')

        assert role
        assert role.slug
        assert isinstance(role.slug, str)
        assert role.level > 0
        assert isinstance(role.level, int)
        assert role.label
        assert isinstance(role.slug, str)

    def test_workspace_roles__ok__get_role__from_level__err__role_does_not_exist(self):  # nopep8
        with pytest.raises(RoleDoesNotExist):
            WorkspaceRoles.get_role_from_level(-1000)

    def test_workspace_roles__ok__get_role__from_slug__err__role_does_not_exist(self):  # nopep8
        with pytest.raises(RoleDoesNotExist):
            WorkspaceRoles.get_role_from_slug('this slug does not exist')
