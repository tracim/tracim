# -*- coding: utf-8 -*-
import os
import subprocess

import pytest
import transaction
from pkg_resources import load_entry_point
from sqlalchemy.orm.exc import NoResultFound

import tracim
from tracim.command import TracimCLI
from tracim.command.user import UserCommand
from tracim.exceptions import UserAlreadyExistError, BadCommandError, \
    GroupNotExist, UserNotExist
from tracim.lib.core.user import UserApi
from tracim.tests import CommandFunctionalTest


class TestCommands(CommandFunctionalTest):
    """
    Test tracimcli command line ui.
    """

    config_section = 'app:command_test'

    def test_func__check_commands_list__ok__nominal_case(self) -> None:
        """
        Test listing of tracimcli command: Tracim commands must be listed
        :return:
        """
        os.chdir(os.path.dirname(tracim.__file__) + '/../')

        output = subprocess.check_output(["tracimcli", "-h"])
        output = output.decode('utf-8')

        assert output.find('user create') > 0
        assert output.find('user update') > 0
        assert output.find('db init') > 0
        assert output.find('db delete') > 0
        assert output.find('webdav start') > 0

    def test_func__user_create_command__ok__nominal_case(self) -> None:
        """
        Test User creation
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(UserNotExist):
            api.get_one_by_email('command_test@user')
        app = TracimCLI()
        result = app.run([
            'user', 'create',
            '-c', 'tests_configs.ini#command_test',
            '-l', 'command_test@user',
            '-p', 'new_password',
            '--debug',
        ])
        new_user = api.get_one_by_email('command_test@user')
        assert new_user.email == 'command_test@user'
        assert new_user.validate_password('new_password')
        assert new_user.profile.name == 'users'

    def test_func__user_create_command__ok__in_admin_group(self) -> None:
        """
        Test User creation with admin as group
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        with pytest.raises(UserNotExist):
            api.get_one_by_email('command_test@user')
        app = TracimCLI()
        result = app.run([
            'user', 'create',
            '-c', 'tests_configs.ini#command_test',
            '-l', 'command_test@user',
            '-p', 'new_password',
            '-g', 'administrators',
            '--debug',
        ])
        new_user = api.get_one_by_email('command_test@user')
        assert new_user.email == 'command_test@user'
        assert new_user.validate_password('new_password')
        assert new_user.profile.name == 'administrators'

    def test_func__user_create_command__err__in_unknown_group(self) -> None:
        """
        Test User creation with an unknown group
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        app = TracimCLI()
        with pytest.raises(GroupNotExist):
            result = app.run([
                'user', 'create',
                '-c', 'tests_configs.ini#command_test',
                '-l', 'command_test@user',
                '-p', 'new_password',
                '-g', 'unknown',
                '--debug',
            ])

    def test_func__user_create_command__err_user_already_exist(self) -> None:
        """
        Test User creation with existing user login
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        app = TracimCLI()
        with pytest.raises(UserAlreadyExistError):
            result = app.run([
                '--debug',
                'user', 'create',
                '-c', 'tests_configs.ini#command_test',
                '-l', 'admin@admin.admin',
                '-p', 'new_password',
                '--debug',
            ])

    def test_func__user_create_command__err__password_required(self) -> None:
        """
        Test User creation without filling password
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        app = TracimCLI()
        with pytest.raises(BadCommandError):
            result = app.run([
                '--debug',
                'user', 'create',
                '-c', 'tests_configs.ini#command_test',
                '-l', 'admin@admin.admin',
                '--debug',
            ])

    def test_func__user_update_command__ok__nominal_case(self) -> None:
        """
        Test user password update
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        user = api.get_one_by_email('admin@admin.admin')
        assert user.email == 'admin@admin.admin'
        assert user.validate_password('admin@admin.admin')
        assert not user.validate_password('new_password')

        app = TracimCLI()
        result = app.run([
            'user', 'update',
            '-c', 'tests_configs.ini#command_test',
            '-l', 'admin@admin.admin',
            '-p', 'new_password',
            '--debug',
        ])
        new_user = api.get_one_by_email('admin@admin.admin')
        assert new_user.email == 'admin@admin.admin'
        assert new_user.validate_password('new_password')
        assert not new_user.validate_password('admin@admin.admin')

    def test_func__user_update_command__ok__remove_group(self) -> None:
        """
        Test user password update
        """
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        user = api.get_one_by_email('admin@admin.admin')
        assert user.email == 'admin@admin.admin'
        assert user.validate_password('admin@admin.admin')
        assert not user.validate_password('new_password')
        assert user.profile.name == 'administrators'
        app = TracimCLI()
        result = app.run([
            'user', 'update',
            '-c', 'tests_configs.ini#command_test',
            '-l', 'admin@admin.admin',
            '-p', 'new_password',
            '-rmg', 'administrators',
            '--debug',
        ])
        new_user = api.get_one_by_email('admin@admin.admin')
        assert new_user.email == 'admin@admin.admin'
        assert new_user.validate_password('new_password')
        assert not new_user.validate_password('admin@admin.admin')
        assert new_user.profile.name == 'managers'