# -*- coding: utf-8 -*-
from depot.manager import DepotManager
import os
from os.path import dirname
import pytest
from sqlalchemy.orm.exc import NoResultFound
import subprocess
import transaction

import tracim_backend
from tracim_backend.command import TracimCLI
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.reaction import ReactionLib
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import EmailNotificationType
from tracim_backend.models.data import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.reaction import Reaction
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.user_custom_properties import UserCustomProperties
from tracim_backend.models.userconfig import UserConfig
from tracim_backend.tests.fixtures import *  # noqa: F403,F401
from tracim_backend.tests.utils import TEST_CONFIG_FILE_PATH
from tracim_backend.tests.utils import create_1000px_png_test_image

COMMAND_CONFIG_PATH = dirname(dirname(dirname(dirname(__file__)))) + "/test_commands.ini"


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

        # space
        assert output.find("space move") > 0
        assert output.find("space delete") > 0
        # user
        assert output.find("user create") > 0
        assert output.find("user update") > 0
        assert output.find("user delete") > 0
        assert output.find("user update") > 0
        # db
        assert output.find("db init") > 0
        assert output.find("db delete") > 0
        assert output.find("db update-naming-conventions") > 0
        assert output.find("db migrate-mysql-charset") > 0
        # search
        assert output.find("search index-create") > 0
        assert output.find("search index-populate") > 0
        assert output.find("search index-upgrade-experimental") > 0
        assert output.find("search index-drop") > 0
        # webdav
        assert output.find("webdav start") > 0
        # caldav
        assert output.find("caldav start") > 0
        assert output.find("caldav sync") > 0
        #
        assert output.find("dev parameters list") > 0
        assert output.find("dev parameters value") > 0
        assert output.find("dev test live-messages") > 0
        assert output.find("dev test smtp") > 0
        assert output.find("dev custom-properties extract-translation-source") > 0
        assert output.find("dev custom-properties checker") > 0
        # content
        assert output.find("content delete") > 0
        assert output.find("content show") > 0
        # revision
        assert output.find("revision delete") > 0


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
        res = app.run(
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
            ]
        )
        assert res == 1

    def test_func__user_create_command__err_user_already_exist(self, hapic, session) -> None:
        """
        Test User creation with existing user login
        """
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        res = app.run(
            [
                "user",
                "create",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-e",
                "admin@admin.admin",
                "-p",
                "new_password",
            ]
        )
        assert res == 1

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
        res = app.run(
            [
                "user",
                "create",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-e",
                "pof@pof.pof",
                "-p",
                "new_password",
                "--send-email",
            ]
        )
        assert res == 1

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
        res = app.run(
            [
                "user",
                "update",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-l",
                "admin@admin.admin",
                "-p",
                "new_ldap_password",
            ]
        )
        assert res == 1

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
            ]
        )
        assert result == 0
        api = user_api_factory.get()
        new_user = api.get_one_by_email("admin@admin.admin")
        assert new_user.email == "admin@admin.admin"
        assert new_user.validate_password("new_password")
        assert not new_user.validate_password("admin@admin.admin")
        assert new_user.profile.slug == "trusted-users"

    def test_func__workspace_move_command__ok__nominal_case(
        self, session, workspace_api_factory
    ) -> None:
        """
        Test Workspace Move
        """
        api = workspace_api_factory.get()
        workspace_api = workspace_api_factory.get()
        test_workspace_parent = workspace_api.create_workspace("parent")
        session.add(test_workspace_parent)
        test_workspace = workspace_api.create_workspace("child", parent=test_workspace_parent)
        session.add(test_workspace)
        test_workspace_new_parent = workspace_api.create_workspace("new_parent")
        session.add(test_workspace_new_parent)
        session.flush()
        workspace_id = test_workspace.workspace_id
        new_parent_workspace_id = test_workspace_new_parent.workspace_id
        transaction.commit()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI needs the context to be reset when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "space",
                "move",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-s",
                str(workspace_id),
                "-p",
                str(new_parent_workspace_id),
            ]
        )
        assert result == 0
        api = workspace_api_factory.get()
        workspace = api.get_one(workspace_id)
        assert workspace.parent_id == new_parent_workspace_id

    def test_func__workspace_move_command__ok__to_root(
        self, session, workspace_api_factory
    ) -> None:
        """
        Test Workspace Move
        """
        api = workspace_api_factory.get()
        workspace_api = workspace_api_factory.get()
        test_workspace_parent = workspace_api.create_workspace("parent")
        session.add(test_workspace_parent)
        test_workspace = workspace_api.create_workspace("child", parent=test_workspace_parent)
        session.add(test_workspace)
        test_workspace_new_parent = workspace_api.create_workspace("new_parent")
        session.add(test_workspace_new_parent)
        session.flush()
        workspace_id = test_workspace.workspace_id
        transaction.commit()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI needs the context to be reset when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "space",
                "move",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-s",
                str(workspace_id),
                "-p",
                str(0),
            ]
        )
        assert result == 0
        api = workspace_api_factory.get()
        workspace = api.get_one(workspace_id)
        assert workspace.parent_id is None

    def test_func__workspace_move_command__err__bad_workspace_id(
        self, session, workspace_api_factory
    ) -> None:
        """
        Test Workspace Move
        """
        api = workspace_api_factory.get()
        workspace_api = workspace_api_factory.get()
        test_workspace_parent = workspace_api.create_workspace("parent")
        session.add(test_workspace_parent)
        test_workspace = workspace_api.create_workspace("child", parent=test_workspace_parent)
        session.add(test_workspace)
        test_workspace_new_parent = workspace_api.create_workspace("new_parent")
        session.add(test_workspace_new_parent)
        session.flush()
        workspace_id = test_workspace.workspace_id
        new_parent_workspace_id = test_workspace_new_parent.workspace_id
        workspace_parent_id = test_workspace_parent.workspace_id
        transaction.commit()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI needs the context to be reset when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "space",
                "move",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-s",
                "9999",
                "-p",
                str(new_parent_workspace_id),
                "-d",
            ]
        )
        assert result == 1
        api = workspace_api_factory.get()
        workspace = api.get_one(workspace_id)
        assert workspace.parent_id == workspace_parent_id

    def test_func__workspace_move_command__err__to_itself(
        self, session, workspace_api_factory
    ) -> None:
        """
        Test Workspace Move
        """
        api = workspace_api_factory.get()
        workspace_api = workspace_api_factory.get()
        test_workspace_parent = workspace_api.create_workspace("parent")
        session.add(test_workspace_parent)
        test_workspace = workspace_api.create_workspace("child", parent=test_workspace_parent)
        session.add(test_workspace)
        test_workspace_new_parent = workspace_api.create_workspace("new_parent")
        session.add(test_workspace_new_parent)
        session.flush()
        workspace_id = test_workspace.workspace_id
        workspace_parent_id = test_workspace_parent.workspace_id
        transaction.commit()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI needs the context to be reset when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "space",
                "move",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-s",
                str(workspace_id),
                "-p",
                str(workspace_id),
            ]
        )
        assert result == 1
        api = workspace_api_factory.get()
        workspace = api.get_one(workspace_id)
        assert workspace.parent_id == workspace_parent_id

    def test_func__workspace_move_command__err__bad_parent_workspace_id(
        self, session, workspace_api_factory
    ) -> None:
        """
        Test Workspace Move
        """
        api = workspace_api_factory.get()
        workspace_api = workspace_api_factory.get()
        test_workspace_parent = workspace_api.create_workspace("parent")
        session.add(test_workspace_parent)
        test_workspace = workspace_api.create_workspace("child", parent=test_workspace_parent)
        session.add(test_workspace)
        test_workspace_new_parent = workspace_api.create_workspace("new_parent")
        session.add(test_workspace_new_parent)
        session.flush()
        workspace_id = test_workspace.workspace_id
        workspace_parent_id = test_workspace_parent.workspace_id
        transaction.commit()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI needs the context to be reset when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "space",
                "move",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-s",
                str(workspace_id),
                "-p",
                "9999",
                "-d",
            ]
        )
        assert result == 1
        api = workspace_api_factory.get()
        workspace = api.get_one(workspace_id)
        assert workspace.parent_id == workspace_parent_id

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
        res = app.run(["db", "init", "-c", COMMAND_CONFIG_PATH])
        assert res == 1

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
        app.run(["db", "delete", "--force", "-c", COMMAND_CONFIG_PATH, "-d"])
        result = app.run(["db", "init", "-c", COMMAND_CONFIG_PATH, "-d"])
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
        res = app.run(["db", "init", "-c", "filewhonotexit.ini#command_test"])
        assert res == 1
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
                "-d",
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
        res = app.run(["db", "delete", "-c", "{}#command_test".format(TEST_CONFIG_FILE_PATH)])
        assert res == 1
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
        res = app.run(["db", "delete", "-c", "donotexit.ini#command_test"])
        assert res == 1
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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
            ]
        )
        assert result == 0
        with pytest.raises(NoResultFound):
            session.query(User).filter(User.user_id == user_id).one()
        with pytest.raises(NoResultFound):
            session.query(UserConfig).filter(UserConfig.user_id == user_id).one()

        with pytest.raises(NoResultFound):
            session.query(UserCustomProperties).filter(
                UserCustomProperties.user_id == user_id
            ).one()

    def test_func__delete_user__ok__with_deleting_owned_workspaces(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
        admin_user,
        event_helper,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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
        with pytest.raises(NoResultFound):
            session.query(UserCustomProperties).filter(
                UserCustomProperties.user_id == user_id
            ).one()

        events = event_helper.last_events(count=1)
        deleted_user_event = events[-1]
        assert deleted_user_event.event_type == "user.deleted"
        assert deleted_user_event.user["public_name"] == "Global manager"

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
            email_notification_type=EmailNotificationType.NONE,
        )
        content_api = content_api_factory.get(
            show_deleted=True,
            show_active=True,
            show_archived=True,
            current_user=test_user,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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
            email_notification_type=EmailNotificationType.NONE,
        )
        session.add(admin_workspace)
        session.add(user_workspace)
        session.flush()
        user_id = test_user.user_id
        admin_workspace_id = admin_workspace.workspace_id
        user_workspace_id = user_workspace.workspace_id
        # INFO - G.M - 2019-12-20 - in user workspace
        content_api = content_api_factory.get(
            show_deleted=True,
            show_active=True,
            show_archived=True,
            current_user=test_user,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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
        with pytest.raises(NoResultFound):
            session.query(UserCustomProperties).filter(
                UserCustomProperties.user_id == user_id
            ).one()

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
        event_helper,
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
            email_notification_type=EmailNotificationType.NONE,
        )
        session.add(admin_workspace)
        session.add(user_workspace)
        session.flush()
        user_id = test_user.user_id
        admin_workspace_id = admin_workspace.workspace_id
        user_workspace_id = user_workspace.workspace_id
        # INFO - G.M - 2019-12-20 - in user workspace
        content_api = content_api_factory.get(
            show_deleted=True,
            show_active=True,
            show_archived=True,
            current_user=test_user,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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

        with pytest.raises(NoResultFound):
            session.query(UserCustomProperties).filter(
                UserCustomProperties.user_id == user_id
            ).one()

        events = event_helper.last_events(count=3)
        remove_user_from_space_2 = events[-3]
        deleted_user_event = events[-2]
        anonymized_user_event = events[-1]
        assert remove_user_from_space_2.event_type == "workspace_member.deleted"
        assert remove_user_from_space_2.user["public_name"] == "bob"
        assert deleted_user_event.event_type == "user.deleted"
        assert deleted_user_event.user["public_name"] == "bob"
        assert anonymized_user_event.event_type == "user.modified"
        assert anonymized_user_event.user["public_name"] == "Custom Name"

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
            email_notification_type=EmailNotificationType.NONE,
        )
        content_api = content_api_factory.get(
            show_deleted=True,
            show_active=True,
            show_archived=True,
            current_user=test_user,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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

        with pytest.raises(NoResultFound):
            session.query(UserCustomProperties).filter(
                UserCustomProperties.user_id == user_id
            ).one()

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
            show_deleted=True,
            show_active=True,
            show_archived=True,
            current_user=test_user,
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

    def test_func__delete_user__ok__dry_run(
        self,
        session,
        user_api_factory,
    ) -> None:
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
        event_helper,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )

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

        events = event_helper.last_events(count=2)
        deleted_user_event = events[0]
        anonymized_user_event = events[1]
        assert deleted_user_event.event_type == "user.deleted"
        assert deleted_user_event.user["public_name"] == "bob"
        assert anonymized_user_event.event_type == "user.modified"
        assert anonymized_user_event.user["public_name"] == "Deleted user"

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
        event_helper,
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
        assert (
            session.query(UserCustomProperties)
            .filter(UserCustomProperties.user_id == user_id)
            .one()
        )
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
        events = event_helper.last_events(count=2)
        deleted_user_event = events[0]
        anonymized_user_event = events[1]
        assert deleted_user_event.event_type == "user.deleted"
        assert deleted_user_event.user["public_name"] == "bob"
        assert anonymized_user_event.event_type == "user.modified"
        assert anonymized_user_event.user["public_name"] == "Custom Name"

    def test_func__delete_content__ok__nominal_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
    ) -> None:
        """
        Test Content deletion : nominal case, content whith 4 revision and is set to be deleted
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test content",
            do_save=True,
            do_notify=False,
        )
        content_id = content.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )

        with new_revision(
            session=session, tm=transaction.manager, content=content, force_create_new_revision=True
        ):
            content = content_api.update_file_data(
                content, "fo.png", "image/png", create_1000px_png_test_image()
            )
        with new_revision(
            session=session, tm=transaction.manager, content=content, force_create_new_revision=True
        ):
            content = content_api.update_file_data(
                content, "f.png", "image/png", create_1000px_png_test_image()
            )
        content.is_deleted = True
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "content",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-i",
                "{}".format(content_id),
            ]
        )
        assert result == 0
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_id)
            .all()
            == []
        )
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.content_id == content_id).one()

    def test_func__delete_content__ok__force_delete_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
    ) -> None:
        """
        Test Content deletion : content whith an under content and reaction, delete by force
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test content",
            do_save=True,
            do_notify=False,
        )
        content_id = content.content_id
        content2 = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=content,
            label="Test content 2",
            do_save=True,
            do_notify=False,
        )
        content_id2 = content2.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        reactionApi = ReactionLib(session=session)
        reaction = reactionApi.create(
            user=user,
            content=content,
            value="😀",
            do_save=True,
        )
        reaction_id = reaction.reaction_id
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "content",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-f",
                "-i",
                "{}".format(content_id),
            ]
        )
        assert result == 0
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_id)
            .all()
            == []
        )
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.content_id == content_id).one()
        with pytest.raises(NoResultFound):
            session.query(Content).filter(Content.content_id == content_id2).one()
        with pytest.raises(NoResultFound):
            session.query(Reaction).filter(Reaction.reaction_id == reaction_id).one()

    def test_func__delete_content__ok__refuse_delete_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
    ) -> None:
        """
        Test Content deletion : content whith a single revision not force and delete rejected
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        content_id = content.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "content",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-i",
                "{}".format(content_id),
            ]
        )
        assert result == 0
        assert len(session.query(Content).filter(Content.content_id == content_id).all()) == 1

    def test_func__delete_workspace__ok__input_no_delete_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
        monkeypatch,
    ) -> None:
        """
        Test Workspace deletion : Workspace whith content and revision didn't force and cancel delete
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        workspace_id = test_workspace.workspace_id
        content_id = content.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        # NOTE - FS - 2023-06-05: Use monkeypatch to send the input to the second verification
        monkeypatch.setattr("builtins.input", lambda: "no")
        result = app.run(
            [
                "space",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-i",
                "{}".format(workspace_id),
            ]
        )
        assert result == 0
        assert len(session.query(Content).filter(Content.content_id == content_id).all()) == 1
        assert (
            len(
                session.query(ContentRevisionRO)
                .filter(ContentRevisionRO.content_id == content_id)
                .all()
            )
            == 2
        )
        assert (
            len(session.query(Workspace).filter(Workspace.workspace_id == workspace_id).all()) == 1
        )

    def test_func__delete_workspace__ok__input_yes_delete_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
        monkeypatch,
    ) -> None:
        """
        Test Workspace deletion : Workspace whith content and revision didn't force and agree to delete
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        workspace_id = test_workspace.workspace_id
        content_id = content.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        # NOTE - FS - 2023-06-05: Use monkeypatch to send the input to the second verification
        monkeypatch.setattr("builtins.input", lambda: "yes")
        result = app.run(
            [
                "space",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-i",
                "{}".format(workspace_id),
            ]
        )
        assert result == 0
        assert len(session.query(Content).filter(Content.content_id == content_id).all()) == 0
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_id)
            .all()
            == []
        )
        assert (
            len(session.query(Workspace).filter(Workspace.workspace_id == workspace_id).all()) == 0
        )

    def test_func__delete_workspace__ok__force_delete_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
    ) -> None:
        """
        Test Workspace deletion : Workspace whith content and revision force delete
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        workspace_id = test_workspace.workspace_id
        content_id = content.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "space",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-f",
                "-i",
                "{}".format(workspace_id),
            ]
        )
        assert result == 0
        assert len(session.query(Content).filter(Content.content_id == content_id).all()) == 0
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_id)
            .all()
            == []
        )
        assert (
            len(session.query(Workspace).filter(Workspace.workspace_id == workspace_id).all()) == 0
        )

    def test_func__delete_revision__ok__nominal_case(
        self,
        session,
        user_api_factory,
        hapic,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
    ) -> None:
        """
        Test Revision deletion : nominal case, delete last of the 4 revision of a content
        """
        uapi = user_api_factory.get()
        user = uapi.get_one_by_email("admin@admin.admin")

        workspace_api = workspace_api_factory.get(current_user=user)
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True, current_user=user
        )
        content = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        content_id = content.content_id
        with new_revision(session=session, tm=transaction.manager, content=content):
            content = content_api.update_file_data(
                content, "foo.png", "image/png", create_1000px_png_test_image()
            )
        with new_revision(
            session=session, tm=transaction.manager, content=content, force_create_new_revision=True
        ):
            content = content_api.update_file_data(
                content, "fo.png", "image/png", create_1000px_png_test_image()
            )
        with new_revision(
            session=session, tm=transaction.manager, content=content, force_create_new_revision=True
        ):
            content = content_api.update_file_data(
                content, "f.png", "image/png", create_1000px_png_test_image()
            )
        revision_id = content.cached_revision_id
        transaction.commit()
        session.close()
        # NOTE GM 2019-07-21: Unset Depot configuration. Done here and not in fixture because
        # TracimCLI need reseted context when ran.
        DepotManager._clear()
        app = TracimCLI()
        result = app.run(
            [
                "revision",
                "delete",
                "-c",
                "{}#command_test".format(TEST_CONFIG_FILE_PATH),
                "-i",
                "{}".format(revision_id),
            ]
        )
        assert result == 0
        assert (
            len(
                session.query(ContentRevisionRO)
                .filter(ContentRevisionRO.content_id == content_id)
                .all()
            )
            == 3
        )
        with pytest.raises(NoResultFound):
            session.query(ContentRevisionRO).filter(
                ContentRevisionRO.revision_id == revision_id
            ).one()
