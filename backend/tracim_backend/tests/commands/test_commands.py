# -*- coding: utf-8 -*-
import os
import subprocess

from depot.manager import DepotManager
import pytest
from sqlalchemy.orm.exc import NoResultFound
import transaction

import tracim_backend
from tracim_backend.command import TracimCLI
from tracim_backend.exceptions import DatabaseInitializationFailed
from tracim_backend.exceptions import EmailAlreadyExists
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import ForceArgumentNeeded
from tracim_backend.exceptions import NotificationDisabledCantCreateUserWithInvitation
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.userconfig import UserConfig
from tracim_backend.tests.fixtures import *  # noqa: F403,F401
from tracim_backend.tests.utils import TEST_CONFIG_FILE_PATH
from tracim_backend.tests.utils import create_1000px_png_test_image


class TestCommandsList(object):
    """
    Test tracimcli command line ui: from command line
    """

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
        assert output.find("dev parameters list") > 0
        assert output.find("dev parameters value") > 0


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "app:command_test"}], indirect=True)
class TestCommands(object):
    """
    Test tracimcli command line ui
    """

    def test_func__user_create_command__ok__nominal_case(self, session, user_api_factory) -> None:
        """
        Test User creation
        """
        api = user_api_factory.get()
        with pytest.raises(UserDoesNotExist):
            api.get_one_by_email("command_test@user")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI needs the context to be reset when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "create",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-e",
                "command_test@user",
                "-p",
                "new_password",
                "--debug",
            ]
        )
        assert result == 0
        api = user_api_factory.get()
        new_user = api.get_one_by_email("command_test@user")
        assert new_user.email == "command_test@user"
        assert new_user.validate_password("new_password")
        assert new_user.profile.slug == "users"

    def test_func__user_create_command__ok__in_admin_profile(
        self, session, user_api_factory, hapic
    ) -> None:
        """
        Test User creation with admin as profile
        """
        api = user_api_factory.get()
        with pytest.raises(UserDoesNotExist):
            api.get_one_by_email("command_test@user")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "create",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-e",
                "command_test@user",
                "-p",
                "new_password",
                "--profile",
                "administrators",
                "--debug",
            ]
        )
        assert result == 0
        api = user_api_factory.get()
        new_user = api.get_one_by_email("command_test@user")
        assert new_user.email == "command_test@user"
        assert new_user.validate_password("new_password")
        assert new_user.profile.slug == "administrators"

    def test_func__user_create_command__err__in_unknown_profile(self, hapic, session) -> None:
        """
        Test User creation with an unknown profile
        """
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        with pytest.raises(SystemExit):
            app.run(
                [
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-e",
                    "command_test@user",
                    "-p",
                    "new_password",
                    "--profile",
                    "unknown",
                    "--debug",
                ]
            )

    def test_func__user_create_command__err_user_already_exist(self, hapic, session) -> None:
        """
        Test User creation with existing user login
        """
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        with pytest.raises(EmailAlreadyExists):
            app.run(
                [
                    "--debug",
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-e",
                    "admin@admin.admin",
                    "-p",
                    "new_password",
                    "--debug",
                ]
            )

    def test_func__user_create_command__err__with_email_notification_disabled(
        self, hapic, session
    ) -> None:
        """
        Test User creation with email with notification disable
        """
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        with pytest.raises(NotificationDisabledCantCreateUserWithInvitation):
            app.run(
                [
                    "--debug",
                    "user",
                    "create",
                    "-c",
                    "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                    "-e",
                    "pof@pof.pof",
                    "-p",
                    "new_password",
                    "--send-email",
                    "--debug",
                ]
            )

    def test_func__user_update_command__ok__nominal_case(
        self, hapic, session, user_api_factory
    ) -> None:
        """
        Test user password update
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
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
        api = user_api_factory.get()
        new_user = api.get_one_by_email("admin@admin.admin")
        assert new_user.email == "admin@admin.admin"
        assert new_user.validate_password("new_password")
        assert not new_user.validate_password("admin@admin.admin")

    def test_func__user_update_command__err_password_modification_failed__external_auth(
        self, hapic, session, user_api_factory
    ) -> None:
        """
        Test user password update
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        user.auth_type = AuthType.LDAP
        assert user.auth_type == AuthType.LDAP
        session.add(user)
        session.flush()
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
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

    def test_func__user_update_command__ok__update_profile(
        self, hapic, session, user_api_factory
    ) -> None:
        """
        Test user password update
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        assert user.profile.slug == "administrators"
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
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
                "--profile",
                "trusted-users",
                "--debug",
            ]
        )
        assert result == 0
        api = user_api_factory.get()
        new_user = api.get_one_by_email("admin@admin.admin")
        assert new_user.email == "admin@admin.admin"
        assert new_user.validate_password("new_password")
        assert not new_user.validate_password("admin@admin.admin")
        assert new_user.profile.slug == "trusted-users"

    def test__init__db__ok_db_already_exist(self, hapic, session, user_api_factory):
        """
        Test database initialisation
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        with pytest.raises(DatabaseInitializationFailed):
            app.run(
                ["db", "init", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH), "--debug"]
            )

    def test__init__db__ok_nominal_case(self, hapic, session, user_api_factory):
        """
        Test database initialisation
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
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

    def test__init__db__no_config_file(self, hapic, session, user_api_factory):
        """
        Test database initialisation
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()

        app = TracimCLI()
        with pytest.raises(FileNotFoundError):
            app.run(["db", "init", "-c", "filewhonotexit.ini#command_test", "--debug"])
        result = app.run(["db", "init", "-c", "filewhonotexit.ini#command_test"])
        assert result == 1

    def test__delete__db__ok_nominal_case(self, hapic, session, user_api_factory):
        """
        Test database deletion
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
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

    def test__delete__db__err_no_force_param(self, hapic, session, user_api_factory):
        """
        Test database deletion
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        with pytest.raises(ForceArgumentNeeded):
            app.run(
                ["db", "delete", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH), "--debug"]
            )
        result = app.run(["db", "delete", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH)])
        assert result == 1

    def test__delete__db__err_no_config_file(self, hapic, session, user_api_factory):
        """
        Test database deletion
        """
        api = user_api_factory.get()
        user = api.get_one_by_email("admin@admin.admin")
        assert user.email == "admin@admin.admin"
        assert user.validate_password("admin@admin.admin")
        assert not user.validate_password("new_password")
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        with pytest.raises(FileNotFoundError):
            app.run(["db", "delete", "-c", "donotexit.ini#command_test", "--debug"])
        result = app.run(["db", "delete", "-c", "donotexist.ini#command_test"])
        assert result == 1

    def test_func__delete_user__err__workspace_left(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User deletion : nominal case, user has change nothing in other user workspace
        """
        user_id = admin_user.user_id
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        workspace_id = test_workspace.workspace_id
        transaction.commit()
        assert session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "admin@admin.admin",
                "-d",
            ]
        )
        assert result == 1

    def test_func__delete_user__ok__nominal_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
    ) -> None:
        """
        Test User deletion : nominal case, user has change nothing in other user workspace
        """
        uapi = user_api_factory.get()
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        session.add(test_user)
        session.flush()
        transaction.commit()
        user_id = test_user.user_id
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
                "-d",
            ]
        )
        assert result == 0
        with pytest.raises(NoResultFound):
            session.query(User).filter(User.user_id == user_id).one()
        with pytest.raises(NoResultFound):
            session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

    def test_func__delete_user__ok__with_deleting_owned_workspaces(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User deletion : nominal case, user has change nothing in other user workspace
        """
        user_id = admin_user.user_id
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True
        )
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        workspace_id = test_workspace.workspace_id
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        transaction.commit()
        assert session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        assert session.query(Content).filter(Content.id == folder2_id).one()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "-w",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "admin@admin.admin",
            ]
        )
        assert result == 0
        with pytest.raises(NoResultFound):
            session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.id == file_id).one()
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.id == folder_id).one()
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.id == folder2_id).one()
        with pytest.raises(NoResultFound):
            session.query(User).filter(User.user_id == user_id).one()
        with pytest.raises(NoResultFound):
            session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

    def test_func__delete_user__err__cannot_remove_user(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User deletion cannot delete user because user has changed file in another user workspace
        """
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        test_workspace = workspace_api.create_workspace("test_workspace")

        uapi = user_api_factory.get()

        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        role_api = role_api_factory.get(current_user=test_user)
        role_api.create_one(
            test_user,
            test_workspace,
            role_level=UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
        )
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=test_user
        )
        session.add(test_workspace)
        session.flush()
        user_id = test_user.user_id
        workspace_id = test_workspace.workspace_id
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        transaction.commit()
        assert session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        assert session.query(Content).filter(Content.id == folder2_id).one()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
            ]
        )
        assert result == 1
        user_retrieved = session.query(User).filter(User.user_id == user_id).one()
        assert user_retrieved
        assert user_retrieved.email == "test@test.test"
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

    def test_func__delete_user__ok__anonymize_with_best_effort(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User deletion with best effort option
        """
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        admin_workspace = workspace_api.create_workspace("test_workspace")

        uapi = user_api_factory.get()

        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.TRUSTED_USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        workspace_api2 = workspace_api_factory.get(current_user=test_user)
        user_workspace = workspace_api2.create_workspace("test_workspace2")

        role_api = role_api_factory.get(current_user=test_user)
        role_api.create_one(
            test_user,
            admin_workspace,
            role_level=UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
        )
        session.add(admin_workspace)
        session.add(user_workspace)
        session.flush()
        user_id = test_user.user_id
        admin_workspace_id = admin_workspace.workspace_id
        user_workspace_id = user_workspace.workspace_id
        # INFO - G.M - 2019-12-20 - in user workspace
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=test_user
        )
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=user_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id

        # INFO - G.M - 2019-12-20 - in admin workspace
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=admin_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=admin_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        transaction.commit()
        assert session.query(Workspace).filter(Workspace.workspace_id == admin_workspace_id).one()
        assert session.query(Workspace).filter(Workspace.workspace_id == user_workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        assert session.query(Content).filter(Content.id == folder2_id).one()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "-b",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
            ]
        )
        assert result == 0
        with pytest.raises(NoResultFound):
            assert (
                session.query(Workspace).filter(Workspace.workspace_id == user_workspace_id).one()
            )
        assert session.query(Workspace).filter(Workspace.workspace_id == admin_workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.id == folder2_id).one()
        test_user_retrieve = session.query(User).filter(User.user_id == user_id).one()
        assert test_user_retrieve.display_name == "Deleted user"
        assert test_user_retrieve.email.endswith("@anonymous.local")
        with pytest.raises(NoResultFound):
            session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

    def test_func__delete_user__ok__anonymize_with_best_effort_specific_display_name(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User deletion with best-effort option and custom display name for anonymous user
        """
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        admin_workspace = workspace_api.create_workspace("test_workspace")

        uapi = user_api_factory.get()
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.TRUSTED_USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        workspace_api2 = workspace_api_factory.get(current_user=test_user)
        user_workspace = workspace_api2.create_workspace("test_workspace2")

        role_api = role_api_factory.get(current_user=test_user)
        role_api.create_one(
            test_user,
            admin_workspace,
            role_level=UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
        )
        session.add(admin_workspace)
        session.add(user_workspace)
        session.flush()
        user_id = test_user.user_id
        admin_workspace_id = admin_workspace.workspace_id
        user_workspace_id = user_workspace.workspace_id
        # INFO - G.M - 2019-12-20 - in user workspace
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=test_user
        )
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=user_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id

        # INFO - G.M - 2019-12-20 - in admin workspace
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=admin_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=admin_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        transaction.commit()
        assert session.query(Workspace).filter(Workspace.workspace_id == admin_workspace_id).one()
        assert session.query(Workspace).filter(Workspace.workspace_id == user_workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        assert session.query(Content).filter(Content.id == folder2_id).one()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "-b",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
                "--anonymize-name",
                "Custom Name",
            ]
        )
        assert result == 0
        with pytest.raises(NoResultFound):
            assert (
                session.query(Workspace).filter(Workspace.workspace_id == user_workspace_id).one()
            )
        assert session.query(Workspace).filter(Workspace.workspace_id == admin_workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.id == folder2_id).one()
        test_user_retrieve = session.query(User).filter(User.user_id == user_id).one()
        assert test_user_retrieve.display_name == "Custom Name"
        assert test_user_retrieve.email.endswith("@anonymous.local")

        with pytest.raises(NoResultFound):
            session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

    def test_func__delete_user__ok__force_delete_all_user_content(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User deletion with force option
        """
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        test_workspace = workspace_api.create_workspace("test_workspace")

        uapi = user_api_factory.get()
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        role_api = role_api_factory.get(current_user=test_user)
        role_api.create_one(
            test_user,
            test_workspace,
            role_level=UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
        )
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=test_user
        )
        session.add(test_workspace)
        session.flush()
        user_id = test_user.user_id
        workspace_id = test_workspace.workspace_id
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        transaction.commit()
        assert session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        assert session.query(Content).filter(Content.id == file_id).one()
        assert session.query(Content).filter(Content.id == folder_id).one()
        assert session.query(Content).filter(Content.id == folder2_id).one()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "--force",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
            ]
        )
        assert result == 0

        assert session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        assert (
            session.query(ContentRevisionRO).filter(ContentRevisionRO.content_id == file_id).all()
            == []
        )
        assert (
            session.query(ContentRevisionRO).filter(ContentRevisionRO.content_id == folder_id).all()
            == []
        )
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == folder2_id)
            .all()
            == []
        )
        with pytest.raises(NoResultFound):
            session.query(User).filter(User.user_id == user_id).one()

        with pytest.raises(NoResultFound):
            session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

    def test_func__delete_user__ok__force_delete_and_deleted_workspace(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Non-regression test when force deleting a user which owns a is_deleted=True workspace.
        """
        uapi = user_api_factory.get()
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.TRUSTED_USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        workspace_api = workspace_api_factory.get(current_user=test_user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=test_user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        workspace_api.delete(test_workspace)
        transaction.commit()

        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "--force",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
            ]
        )
        assert result == 0

    def test_func__delete_user__ok__dry_run(self, session, user_api_factory,) -> None:
        """
        Non-regression test for an error that occured with dry-run and user config.
        """
        uapi = user_api_factory.get()
        uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.TRUSTED_USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "delete",
                "--force",
                "--dry-run",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
            ]
        )
        assert result == 0

    def test_func__anonymize_user__ok__nominal_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User anonymization
        """
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        user_id = test_user.user_id
        transaction.commit()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "anonymize",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
            ]
        )
        assert result == 0

        test_user_retrieve = session.query(User).filter(User.user_id == user_id).one()
        assert test_user_retrieve.display_name == "Deleted user"
        assert test_user_retrieve.email.endswith("@anonymous.local")
        assert test_user_retrieve.config.fields == {}

    def test_func__anonymize_user__ok__specific_display_name(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Test User anonymization
        """
        uapi = user_api_factory.get()
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.USER,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        user_id = test_user.user_id
        transaction.commit()
        assert session.query(User).filter(User.user_id == user_id).one()
        assert session.query(UserConfig).filter(UserConfig.user_id == user_id).one()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "user",
                "anonymize",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "test@test.test",
                "--anonymize-name",
                "Custom Name",
            ]
        )
        assert result == 0

        test_user_retrieve = session.query(User).filter(User.user_id == user_id).one()
        assert test_user_retrieve.display_name == "Custom Name"
        assert test_user_retrieve.email.endswith("@anonymous.local")
        assert test_user_retrieve.config.fields == {}
