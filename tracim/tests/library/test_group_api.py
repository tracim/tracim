# coding=utf-8
import pytest

from tracim.exceptions import GroupNotExist
from tracim.lib.core.group import GroupApi
from tracim.tests import DefaultTest
from tracim.fixtures.users_and_groups import Base as BaseFixture
from tracim.fixtures.content import Content as ContentFixture


class TestGroupApi(DefaultTest):
    fixtures = [BaseFixture, ContentFixture]

    def test_unit__get_one__ok_nominal_case(self) -> None:
        """
        Get one group by id
        """
        api = GroupApi(
            current_user=None,
            session=self.session,
        )
        group = api.get_one(1)
        assert group.group_id == 1
        assert group.group_name == 'users'

    def test_unit__get_one__err__group_not_exist(self) -> None:
        """
        Get one group who does not exist by id
        """
        api = GroupApi(
            current_user=None,
            session=self.session,
        )
        with pytest.raises(GroupNotExist):
            group = api.get_one(10)

    def test_unit__get_one_group_with_name__nominal_case(self) -> None:
        """
        get one group by name
        """
        api = GroupApi(
            current_user=None,
            session=self.session,
        )
        group = api.get_one_with_name('administrators')
        assert group.group_id == 3
        assert group.group_name == 'administrators'

    def test_unit__get_one_with_name__err__group_not_exist(self) -> None:
        """
        get one group by name who does not exist
        """
        api = GroupApi(
            current_user=None,
            session=self.session,
        )
        with pytest.raises(GroupNotExist):
            group = api.get_one_with_name('unknown_group')

    def test_unit__get_all__ok__nominal_case(self):
        """
        get all groups
        """
        api = GroupApi(
            current_user=None,
            session=self.session,
        )
        groups = api.get_all()
        assert ['users', 'managers', 'administrators'] == [group.group_name for group in groups]  # nopep8
