# coding=utf-8
import pytest

from tracim_backend.exceptions import GroupDoesNotExist
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestGroupApi(object):
    def test_unit__get_one__ok_nominal_case(self, session, app_config) -> None:
        """
        Get one group by id
        """
        api = GroupApi(current_user=None, session=session, config=app_config)
        group = api.get_one(1)
        assert group.group_id == 1
        assert group.group_name == "users"

    def test_unit__get_one__err__group_not_exist(self, session, app_config) -> None:
        """
        Get one group who does not exist by id
        """
        api = GroupApi(current_user=None, session=session, config=app_config)
        with pytest.raises(GroupDoesNotExist):
            api.get_one(10)

    def test_unit__get_one_group_with_name__nominal_case(self, session, app_config) -> None:
        """
        get one group by name
        """
        api = GroupApi(current_user=None, session=session, config=app_config)
        group = api.get_one_with_name("administrators")
        assert group.group_id == 3
        assert group.group_name == "administrators"

    def test_unit__get_one_with_name__err__group_not_exist(self, session, app_config) -> None:
        """
        get one group by name who does not exist
        """
        api = GroupApi(current_user=None, session=session, config=app_config)
        with pytest.raises(GroupDoesNotExist):
            api.get_one_with_name("unknown_group")

    def test_unit__get_all__ok__nominal_case(self, session, app_config):
        """
        get all groups
        """
        api = GroupApi(current_user=None, session=session, config=app_config)
        groups = api.get_all()
        assert ["users", "trusted-users", "administrators"] == [
            group.group_name for group in groups
        ]
