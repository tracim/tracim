# -*- coding: utf-8 -*-
import os
import subprocess

import pytest
import transaction

import tracim_backend
from tracim_backend.command import TracimCLI
from tracim_backend.exceptions import BadCommandError
from tracim_backend.exceptions import DatabaseInitializationFailed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import ForceArgumentNeeded
from tracim_backend.exceptions import GroupDoesNotExist
from tracim_backend.exceptions import NotificationDisabledCantCreateUserWithInvitation
from tracim_backend.exceptions import UserAlreadyExistError
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import AuthType
from tracim_backend.tests import TEST_CONFIG_FILE_PATH
from tracim_backend.tests import CommandFunctionalTest


class TestCommands(CommandFunctionalTest):
    """
    Test tracimcli command line ui.
    """

    config_section = "app:command_test"

    def test_func__check_commands_list__ok__nominal_case(self) -> None:
        """
        Test listing of tracimcli command: Tracim commands must be listed
        :return:
        """
        os.chdir(os.path.dirname(tracim_backend.__file__) + "/../")

        output = subprocess.check_output(["tracimcli", "-h"])
        output = output.decode("utf-8")

        assert output.find("user create") > 0
        assert output.find("user update") > 0
        assert output.find("db init") > 0
        assert output.find("db delete") > 0
        assert output.find("webdav start") > 0
        assert output.find("caldav start") > 0
        assert output.find("caldav sync") > 0
        assert output.find("search index-create") > 0
        assert output.find("search index-populate") > 0
        assert output.find("search index-upgrade-experimental") > 0
        assert output.find("search index-drop") > 0

    def test_func__user_create_command__ok__nominal_case(self) -> None:
        """
        Test User creation
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        with pytest.raises(UserDoesNotExist):
            api.get_one_by_email("command_test@user")
        self.disconnect_database()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "create",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "command_test@user",
                "-p",
                "new_password",
                "--debug",
            ]
        )
        assert result == 0
        self.connect_database()
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        new_user = api.get_one_by_email("command_test@user")
        assert new_user.email == "command_test@user"
        assert new_user.validate_password("new_password")
        assert new_user.profile.name == "users"

    def test_func__user_create_command__ok__in_admin_group(self) -> None:
        """
        Test User creation with admin as group
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        with pytest.raises(UserDoesNotExist):
            api.get_one_by_email("command_test@user")
        self.disconnect_database()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "create",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "command_test@user",
                "-p",
                "new_password",
                "-g",
                "administrators",
                "--debug",
            ]
        )
        assert result == 0
        self.connect_database()
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        new_user = api.get_one_by_email("command_test@user")
        assert new_user.email == "command_test@user"
        assert new_user.validate_password("new_password")
        assert new_user.profile.name == "administrators"

    def test_func__user_create_command__err__in_unknown_group(self) -> None:
        """
        Test User creation with an unknown group
        """
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(GroupDoesNotExist):
            app.run(
                [
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-l",
                    "command_test@user",
                    "-p",
                    "new_password",
                    "-g",
                    "unknown",
                    "--debug",
                ]
            )

    def test_func__user_create_command__err_user_already_exist(self) -> None:
        """
        Test User creation with existing user login
        """
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(UserAlreadyExistError):
            app.run(
                [
                    "--debug",
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-l",
                    "admin@admin.admin",
                    "-p",
                    "new_password",
                    "--debug",
                ]
            )

    def test_func__user_create_command__err__with_email_notification_disabled(self) -> None:
        """
        Test User creation with email with notification disable
        """
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(NotificationDisabledCantCreateUserWithInvitation):
            app.run(
                [
                    "--debug",
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-l",
                    "pof@pof.pof",
                    "-p",
                    "new_password",
                    "--send-email",
                    "--debug",
                ]
            )

    def test_func__user_create_command__err__password_required(self) -> None:
        """
        Test User creation without filling password
        """
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(BadCommandError):
            app.run(
                [
                    "--debug",
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-l",
                    "admin@admin.admin",
                    "--debug",
                ]
            )

    def test_func__user_update_command__ok__nominal_case(self) -> None:
        """
        Test user password update
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "update",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "admin@admin.admin",
                "-p",
                "new_password",
                "--debug",
            ]
        )
        assert result == 0
        self.connect_database()
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        new_user = api.get_one_by_email("admin@admin.admin")
        assert new_user.email == "admin@admin.admin"
        assert new_user.validate_password("new_password")
        assert not new_user.validate_password("admin@admin.admin")

    def test_func__user_update_command__err_password_modification_failed__external_auth(
        self
    ) -> None:
        """
        Test user password update
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        user.auth_type = AuthType.LDAP
        assert user.auth_type == AuthType.LDAP
        self.session.add(user)
        self.session.flush()
        transaction.commit()
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(ExternalAuthUserPasswordModificationDisallowed):
            app.run(
                [
                    "user",
                    "update",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-l",
                    "admin@admin.admin",
                    "-p",
                    "new_ldap_password",
                    "--debug",
                ]
            )

    def test_func__user_update_command__ok__remove_group(self) -> None:
        """
        Test user password update
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        assert user.profile.name == "administrators"
        self.disconnect_database()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "update",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "admin@admin.admin",
                "-p",
                "new_password",
                "-rmg",
                "administrators",
                "--debug",
            ]
        )
        assert result == 0
        self.connect_database()
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        new_user = api.get_one_by_email("admin@admin.admin")
        assert new_user.email == "admin@admin.admin"
        assert new_user.validate_password("new_password")
        assert not new_user.validate_password("admin@admin.admin")
        assert new_user.profile.name == "trusted-users"

    def test__init__db__ok_db_already_exist(self):
        """
        Test database initialisation
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(DatabaseInitializationFailed):
            app.run(
                ["db", "init", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH), "--debug"]
            )

    def test__init__db__ok_nominal_case(self):
        """
        Test database initialisation
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()
        app = TracimCLI()
        # delete config to be sure command will work
        app.run(
            [
                "db",
                "delete",
                "--force",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "--debug",
            ]
        )
        result = app.run(
            ["db", "init", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH), "--debug"]
        )
        assert result == 0

    def test__init__db__no_config_file(self):
        """
        Test database initialisation
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()

        app = TracimCLI()
        with pytest.raises(FileNotFoundError):
            app.run(["db", "init", "-c", "filewhonotexit.ini#command_test", "--debug"])
        result = app.run(["db", "init", "-c", "filewhonotexit.ini#command_test"])
        assert result == 1

    def test__delete__db__ok_nominal_case(self):
        """
        Test database deletion
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()
        app = TracimCLI()
        result = app.run(
            [
                "db",
                "delete",
                "--force",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "--debug",
            ]
        )
        assert result == 0

    def test__delete__db__err_no_force_param(self):
        """
        Test database deletion
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(ForceArgumentNeeded):
            app.run(
                ["db", "delete", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH), "--debug"]
            )
        result = app.run(["db", "delete", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH)])
        assert result == 1

    def test__delete__db__err_no_config_file(self):
        """
        Test database deletion
        """
        api = UserApi(current_user=None, session=self.session, config=self.app_config)
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        self.disconnect_database()
        app = TracimCLI()
        with pytest.raises(FileNotFoundError):
            app.run(["db", "delete", "-c", "donotexit.ini#command_test", "--debug"])
        result = app.run(["db", "delete", "-c", "donotexist.ini#command_test"])
        assert result == 1
