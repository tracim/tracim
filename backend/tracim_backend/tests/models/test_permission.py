# coding=utf-8
import transaction

from tracim_backend.models.auth import Permission
from tracim_backend.tests.fixtures import *  # noqa: F403,F401


class TestPermissionModel(object):
    """
    Test for permission model
    """

    def test_unit__create__ok__nominal_case(self, session):
        session.flush()
        transaction.commit()

        name = "my_permission"
        description = "my_perm_description"
        permission = Permission()
        permission.permission_name = name
        permission.description = description

        session.add(permission)
        session.flush()
        transaction.commit()

        new_permission = session.query(Permission).filter(permission.permission_name == name).one()

        assert new_permission.permission_name == name
        assert new_permission.description == description
        assert new_permission.permission_id
        assert isinstance(new_permission.permission_id, int)
        # TODO - G.M -24-05-2018 - Do test for groups

    def test_unit__repr__ok__nominal_case(self):
        name = "my_permission"
        description = "my_perm_description"
        permission = Permission()
        permission.permission_name = name
        permission.description = description

        assert permission.__repr__() == "<Permission: name='my_permission'>"

    def test_unit__unicode__ok__nominal_case(self):
        name = "my_permission"
        description = "my_perm_description"
        permission = Permission()
        permission.permission_name = name
        permission.description = description

        assert permission.__unicode__() == name
