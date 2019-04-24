from urllib.parse import quote

from parameterized import parameterized
import pytest
import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import WebdavFunctionalTest


class TestFunctionWebdavRemoteUser(WebdavFunctionalTest):
    config_section = "functional_webdav_test_remote_user"

    def test_functional__webdav_access_to_root_remote_auth__as_http_header(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "remoteuser@emoteuser.remoteuser",
            password=None,
            do_save=True,
            do_notify=False,
            groups=groups,
            auth_type=AuthType.REMOTE,
        )
        transaction.commit()
        headers_auth = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        res = self.testapp.get("/", status=401, headers=headers_auth)
        assert res

    def test_functional__webdav_access_to_root__remote_auth(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "remoteuser@remoteuser.remoteuser",
            password=None,
            do_save=True,
            do_notify=False,
            groups=groups,
            auth_type=AuthType.REMOTE,
        )
        uapi.save(user)
        transaction.commit()
        extra_environ = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        res = self.testapp.get("/", status=200, extra_environ=extra_environ)
        assert res


class TestFunctionalWebdavGet(WebdavFunctionalTest):
    """
    Test for all Webdav "GET" action in different case
    """

    def test_functional__webdav_access_to_root__nominal_case(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of root using webdav
        res = self.testapp.get("/", status=200)
        assert res

    def test_functional__webdav_access_to_root__user_not_exist(self) -> None:
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of root using webdav
        self.testapp.get("/", status=401)

    @parameterized.expand(
        [
            # workspace_label, webdav_workspace_label
            ("myworkspace", "myworkspace"),
            ("/?\\#*", "⧸ʔ⧹#∗"),
            ("Project Z", "Project Z"),
        ]
    )
    def test_functional__webdav_access_to_workspace__nominal_case(
        self, workspace_label, webdav_workspace_label
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        # check availability of new created content using webdav
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)

    def test_functional__webdav_access_to_workspace__no_role_in_workspace(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace_api.create_workspace("test", save_now=True)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        self.testapp.get("/test", status=404)

    def test_functional__webdav_access_to_workspace__workspace_not_exist(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        self.testapp.get("/test", status=404)

    @parameterized.expand(
        [
            # workspace_label, webdav_workspace_label,
            # content_filename, webdav_content_filename
            ("myworkspace", "myworkspace", "myfile.txt", "myfile.txt"),
            ("/?\\#*", "⧸ʔ⧹#∗", "/?\\#*.txt", "⧸ʔ⧹#∗.txt"),
            ("Project Z", "Project Z", "report product 47.txt", "report product 47.txt"),
        ]
    )
    def test_functional__webdav_access_to_content__ok__nominal_case(
        self, workspace_label, webdav_workspace_label, content_filename, webdav_content_filename
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        # check availability of new created content using webdav
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )

    def test_functional__webdav_access_to_content__err__file_not_exist(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace_api.create_workspace("workspace1", save_now=True)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check availability of new created content using webdav
        self.testapp.get("/workspace1", status=200)
        self.testapp.get("/workspace1/report.txt", status=404)

    @parameterized.expand(
        [
            # workspace_label, webdav_workspace_label,
            # dir_label, webdav_dir_label
            # content_filename, webdav_content_filename
            ("myworkspace", "myworkspace", "mydir", "mydir", "myfile.txt", "myfile.txt"),
            ("/?\\#*", "⧸ʔ⧹#∗", "/?\\#*", "⧸ʔ⧹#∗", "/?\\#*.txt", "⧸ʔ⧹#∗.txt"),
            (
                "Project Z",
                "Project Z",
                "Product 47",
                "Product 47",
                "report product 47.txt",
                "report product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_access_to_subdir_content__ok__nominal_case(
        self,
        workspace_label,
        webdav_workspace_label,
        dir_label,
        webdav_dir_label,
        content_filename,
        webdav_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        folder = api.create(
            content_type_list.Folder.slug, workspace, None, dir_label, do_save=True, do_notify=False
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                folder,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir_label = quote(webdav_dir_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        # check availability of new created content using webdav
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir_label),
            status=200,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )

    def test_functional__webdav_access_to_subdir_content__err__file_not_exist(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace("workspace1", save_now=True)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            "examples",
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check availability of new created content using webdav
        self.testapp.get("/workspace1", status=200)
        self.testapp.get("/workspace1/examples", status=200)
        self.testapp.get("/workspace1/examples/report.txt", status=404)


class TestFunctionalWebdavMoveSimpleFile(WebdavFunctionalTest):
    """
    Test for all Webdav "MOVE" action for simple file in different case
    """

    # move same workspaces : file
    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # dir1_label, webdav_dir1_label
                "folder1",
                "folder1",
                # dir2_label, webdav_dir2_label
                "folder2",
                "folder2",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # dir1_label, webdav_dir1_label
                "/?\\#*dir1",
                "⧸ʔ⧹#∗dir1",
                # dir2_label, webdav_dir2_label
                "/?\\#*dir2",
                "⧸ʔ⧹#∗dir2",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # dir1_label, webdav_dir1_label
                "Product 21",
                "Product 21",
                # dir2_label, webdav_dir2_label
                "Product 47",
                "Product 47",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__same_workspace_folder_to_folder(
        self,
        workspace_label,
        webdav_workspace_label,
        dir1_label,
        webdav_dir1_label,
        dir2_label,
        webdav_dir2_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        dir1_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir2_label,
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                dir1_folder,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)
        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label).format(), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}/{}/{}".format(
                    urlencoded_webdav_workspace_label,
                    urlencoded_webdav_dir2_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )

        # verify move
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir2_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # workspace2_label, webdav_workspace2_label,
                "workspace2",
                "workspace2",
                # dir1_label, webdav_dir1_label
                "folder1",
                "folder1",
                # dir2_label, webdav_dir2_label
                "folder2",
                "folder2",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # workspace2_label, webdav_workspace2_label,
                "/?\\#*wp2",
                "⧸ʔ⧹#∗wp2",
                # dir1_label, webdav_dir1_label
                "/?\\#*dir1",
                "⧸ʔ⧹#∗dir1",
                # dir2_label, webdav_dir2_label
                "/?\\#*dir2",
                "⧸ʔ⧹#∗dir2",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # workspace2_label, webdav_workspace2_label,
                "Project Y",
                "Project Y",
                # dir1_label, webdav_dir1_label
                "Product 21",
                "Product 21",
                # dir2_label, webdav_dir2_label
                "Product 47",
                "Product 47",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__different_workspace_folder_to_folder(
        self,
        workspace_label,
        webdav_workspace_label,
        workspace2_label,
        webdav_workspace2_label,
        dir1_label,
        webdav_dir1_label,
        dir2_label,
        webdav_dir2_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label=dir2_label,
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)
        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}/{}/{}".format(
                    urlencoded_webdav_workspace2_label,
                    urlencoded_webdav_dir2_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace2_label,
                urlencoded_webdav_dir2_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # dir1_label, webdav_dir1_label
                "folder1",
                "folder1",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # dir1_label, webdav_dir1_label
                "/?\\#*dir1",
                "⧸ʔ⧹#∗dir1",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # dir1_label, webdav_dir1_label
                "Product 21",
                "Product 21",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__same_workspace_root_to_folder(
        self,
        workspace_label,
        webdav_workspace_label,
        dir1_label,
        webdav_dir1_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:

        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))

        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            method="MOVE",
            headers={
                "destination": "/{}/{}/{}".format(
                    urlencoded_webdav_workspace_label,
                    urlencoded_webdav_dir1_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # workspace2_label, webdav_workspace2_label,
                "workspace2",
                "workspace2",
                # dir1_label, webdav_dir1_label
                "folder1",
                "folder1",
                # dir2_label, webdav_dir2_label
                "folder2",
                "folder2",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # workspace2_label, webdav_workspace2_label,
                "/?\\#*wp2",
                "⧸ʔ⧹#∗wp2",
                # dir1_label, webdav_dir1_label
                "/?\\#*dir1",
                "⧸ʔ⧹#∗dir1",
                # dir2_label, webdav_dir2_label
                "/?\\#*dir2",
                "⧸ʔ⧹#∗dir2",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # workspace2_label, webdav_workspace2_label,
                "Project Y",
                "Project Y",
                # dir1_label, webdav_dir1_label
                "Product 21",
                "Product 21",
                # dir2_label, webdav_dir2_label
                "Product 47",
                "Product 47",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__different_workspace_root_to_folder(
        self,
        workspace_label,
        webdav_workspace_label,
        workspace2_label,
        webdav_workspace2_label,
        dir1_label,
        webdav_dir1_label,
        dir2_label,
        webdav_dir2_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label=dir2_label,
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)  # noqa: F841
        urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)
        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            method="MOVE",
            headers={
                "destination": "/{}/{}/{}".format(
                    urlencoded_webdav_workspace2_label,
                    urlencoded_webdav_dir2_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace2_label,
                urlencoded_webdav_dir2_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # dir1_label, webdav_dir1_label
                "folder1",
                "folder1",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # dir1_label, webdav_dir1_label
                "/?\\#*dir1",
                "⧸ʔ⧹#∗dir1",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # dir1_label, webdav_dir1_label
                "Product 21",
                "Product 21",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__same_workspace_folder_to_root(
        self,
        workspace_label,
        webdav_workspace_label,
        dir1_label,
        webdav_dir1_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}/{}".format(
                    urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        self.testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # workspace2_label, webdav_workspace2_label,
                "workspace2",
                "workspace2",
                # dir1_label, webdav_dir1_label
                "folder1",
                "folder1",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # workspace2_label, webdav_workspace2_label,
                "/?\\#*wp2",
                "⧸ʔ⧹#∗wp2",
                # dir1_label, webdav_dir1_label
                "/?\\#*dir1",
                "⧸ʔ⧹#∗dir1",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # workspace2_label, webdav_workspace2_label,
                "Project Y",
                "Project Y",
                # dir1_label, webdav_dir1_label
                "Product 21",
                "Product 21",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__different_workspace_folder_to_root(
        self,
        workspace_label,
        webdav_workspace_label,
        workspace2_label,
        webdav_workspace2_label,
        dir1_label,
        webdav_dir1_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                example_folder,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}/{}".format(
                    urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        self.testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    @pytest.mark.xfail(reason="To be determined")
    def test_functional__webdav_move_file__ok__rename_file_at_root(
        self,
        workspace_label,
        webdav_workspace_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))

        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            method="MOVE",
            headers={
                "destination": "/{}/{}".format(
                    urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        self.testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )

    @parameterized.expand(
        [
            (
                # workspace_label, webdav_workspace_label,
                "workspace1",
                "workspace1",
                # workspace2_label, webdav_workspace2_label,
                "workspace2",
                "workspace2",
                # content_filename, webdav_content_filename
                "myfile.txt",
                "myfile.txt",
                # content_new_filename, webdav_content_new_filename
                "myfilerenamed.txt",
                "myfilerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "/?\\#*wp",
                "⧸ʔ⧹#∗wp",
                # workspace2_label, webdav_workspace2_label,
                "/?\\#*wp2",
                "⧸ʔ⧹#∗wp2",
                # content_filename, webdav_content_filename
                "/?\\#*file.txt",
                "⧸ʔ⧹#∗file.txt",
                # content_new_filename, webdav_content_new_filename
                "/?\\#*filerenamed.txt",
                "⧸ʔ⧹#∗filerenamed.txt",
            ),
            (
                # workspace_label, webdav_workspace_label,
                "Project Z",
                "Project Z",
                # workspace2_label, webdav_workspace2_label,
                "Project Y",
                "Project Y",
                # content_filename, webdav_content_filename
                "report product 47.txt",
                "report product 47.txt",
                # content_new_filename, webdav_content_new_filename
                "Report Product 47.txt",
                "Report Product 47.txt",
            ),
        ]
    )
    def test_functional__webdav_move_file__ok__different_workspace_root_to_root(
        self,
        workspace_label,
        webdav_workspace_label,
        workspace2_label,
        webdav_workspace2_label,
        content_filename,
        webdav_content_filename,
        new_content_filename,
        webdav_new_content_filename,
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        with dbsession.no_autoflush:
            file = api.create(
                content_type_list.File.slug,
                workspace,
                None,
                filename=content_filename,
                do_save=False,
                do_notify=False,
            )
            api.update_file_data(file, content_filename, "text/plain", b"test_content")
            api.save(file)
        transaction.commit()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))

        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)

        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        self.testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        # do move
        self.testapp.request(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            method="MOVE",
            headers={
                "destination": "/{}/{}".format(
                    urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        self.testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        self.testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )


# class TestFunctionalWebdavMoveFolder(WebdavFunctionalTest):
#     """
#     Test for all Webdav "MOVE" action for folder in different case
#     """
#     # move same workspaces: folder
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # workspace2_label, webdav_workspace2_label,
#             'workspace2',
#             'workspace2',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # workspace2_label, webdav_workspace2_label,
#             '/?\\#*wp2',
#             '⧸ʔ⧹#∗wp2',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # workspace2_label, webdav_workspace2_label,
#             'Project Y',
#             'Project Y',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__same_workspace_folder_to_folder(
#             self,
#             workspace_label,
#             webdav_workspace_label,
#             dir1_label,
#             webdav_dir1_label,
#             dir2_label,
#             webdav_dir2_label,
#             dir3_label,
#             webdav_dir3_label,
#             content_filename,
#             webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory, transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label, save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         example_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace,
#             None,
#             label=dir1_label,
#             do_save=True,
#             do_notify=False,
#         )
#         product_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace,
#             None,
#             label=dir2_label,
#             do_save=True,
#             do_notify=False,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 example_folder,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=200)
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_dir3_label,urlencoded_webdav_content_filename), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label), status=200)
#         # do move
#         self.testapp.request(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename),
#             method='MOVE',
#             headers={'destination': '/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_dir3_label,urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_dir3_label), status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label), status=200)
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label,urlencoded_webdav_dir3_label), status=200)
#
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # workspace_label, webdav_workspace_label,
#             'workspace2',
#             'workspace2',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # workspace2_label, webdav_workspace2_label,
#             '/?\\#*wp2',
#             '⧸ʔ⧹#∗wp2',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # workspace2_label, webdav_workspace2_label,
#             'Project Y',
#             'Project Y',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__different_workspace_folder_to_folder(
#         self,
#         workspace_label,
#         webdav_workspace_label,
#         workspace2_label,
#         webdav_workspace2_label,
#         dir1_label,
#         webdav_dir1_label,
#         dir2_label,
#         webdav_dir2_label,
#         dir3_label,
#         webdav_dir3_label,
#         content_filename,
#         webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory,
#                                    transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label,
#                                                    save_now=True)
#         workspace2 = workspace_api.create_workspace(workspace2_label,
#                                                     save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace,
#                         UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         rapi.create_one(user, workspace2,
#                         UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         example_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace,
#             None,
#             label=dir1_label,
#             do_save=True,
#             do_notify=False,
#         )
#         product_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace2,
#             None,
#             label=dir2_label,
#             do_save=True,
#             do_notify=False,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 example_folder,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                         urlencoded_webdav_dir1_label),
#                                         status=200)
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_dir3_filename),
#             status=200)
#         self.testapp.get(
#             '/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                   urlencoded_webdav_dir1_label,
#                                   urlencoded_webdav_dir3_label,
#                                   urlencoded_webdav_content_filename),
#             status=200)
#         self.testapp.get(
#             '/{}/{}'.format(
#                 urlencoded_webdav_workspace2_label,
#                 urlencoded_webdav_dir2_label
#             ),
#             status=200
#         )
#         # do move
#         self.testapp.request(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename),
#             method='MOVE',
#             headers={'destination': '/{}/{}'.format(
#                 urlencoded_webdav_workspace2_label,
#                 urlencoded_webdav_dir2_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename),
#             status=404)
#         self.testapp.get(
#             '/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                   urlencoded_webdav_dir1_label,
#                                   urlencoded_webdav_dir3_label,
#                                   urlencoded_webdav_content_filename),
#             status=404)
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_dir3_label), status=404)
#         self.testapp.get('/{}/{}/{}'.format(
#                 urlencoded_webdav_workspace2_label,
#                 urlencoded_webdav_dir2_label,
#                 urlencoded_webdav_dir3_label
#             ),
#             status=200
#         )
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace2_label,
#                                          urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label, urlencoded_webdav_content_filename)
#         , status=200)
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # workspace2_label, webdav_workspace2_label,
#             'workspace2',
#             'workspace2',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # workspace2_label, webdav_workspace2_label,
#             '/?\\#*wp2',
#             '⧸ʔ⧹#∗wp2',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # workspace2_label, webdav_workspace2_label,
#             'Project Y',
#             'Project Y',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__same_workspace_root_to_folder(
#         self,
#         workspace_label,
#         webdav_workspace_label,
#         workspace2_label,
#         webdav_workspace2_label,
#         dir1_label,
#         webdav_dir1_label,
#         dir2_label,
#         webdav_dir2_label,
#         dir3_label,
#         webdav_dir3_label,
#         content_filename,
#         webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory, transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label, save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         product_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace,
#             None,
#             label=dir2_label,
#             do_save=True,
#             do_notify=False,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 None,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label), status=200)
#         # do move
#         self.testapp.request(
#             '/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
#             method='MOVE',
#             headers={'destination': '/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label), status=200)
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label,urlencoded_webdav_dir3_label), status=200)
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__different_workspace_root_to_folder(
#         self,
#         workspace_label,
#         webdav_workspace_label,
#         workspace2_label,
#         webdav_workspace2_label,
#         dir1_label,
#         webdav_dir1_label,
#         dir2_label,
#         webdav_dir2_label,
#         dir3_label,
#         webdav_dir3_label,
#         content_filename,
#         webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory,
#                                    transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label,
#                                                    save_now=True)
#         workspace2 = workspace_api.create_workspace(workspace2_label,
#                                                     save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace,
#                         UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         rapi.create_one(user, workspace2,
#                         UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         product_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace2,
#             None,
#             label=dir2_label,
#             do_save=True,
#             do_notify=False,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 None,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                          urlencoded_webdav_dir1_label),
#                          status=200)
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename)
#         , status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace2_label,
#                                          urlencoded_webdav_dir2_label)
#         , status=200)
#         # do move
#         self.testapp.request(
#             '/{}/{}'.format(urlencoded_webdav_workspace_label,
#                             urlencoded_webdav_dir1_label),
#             method='MOVE',
#             headers={'destination': '/{}/{}/{}'.format(
#                 urlencoded_webdav_workspace2_label,
#                 urlencoded_webdav_dir2_label,
#                 urlencoded_webdav_dir3_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                          urlencoded_webdav_dir1_label),
#                          status=404)
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename)
#         , status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace2_label,
#                                          urlencoded_webdav_dir2_label, urlencoded_webdav_dir3_label)
#         , status=200)
#         self.testapp.get('/{}/{}/{}/{}'.format(
#             urlencoded_webdav_workspace2_label,
#             urlencoded_webdav_dir2_label,
#             urlencoded_webdav_dir3_label,
#             urlencoded_webdav_content_filename)
#         , status=200)
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # workspace2_label, webdav_workspace2_label,
#             'workspace2',
#             'workspace2',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # workspace2_label, webdav_workspace2_label,
#             '/?\\#*wp2',
#             '⧸ʔ⧹#∗wp2',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # workspace2_label, webdav_workspace2_label,
#             'Project Y',
#             'Project Y',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__same_workspace_folder_to_root(
#             self,
#             workspace_label,
#             webdav_workspace_label,
#             workspace2_label,
#             webdav_workspace2_label,
#             dir1_label,
#             webdav_dir1_label,
#             dir2_label,
#             webdav_dir2_label,
#             dir3_label,
#             webdav_dir3_label,
#             content_filename,
#             webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory, transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label, save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         example_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace,
#             None,
#             label=dir1_label,
#             do_save=True,
#             do_notify=False,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 example_folder,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=200)
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_dir3_label,urlencoded_webdav_content_filename), status=200)
#         # do move
#         self.testapp.request(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename),
#             method='MOVE',
#             headers={'destination': '/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_dir3_label,urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_content_filename), status=200)
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__different_workspace_folder_to_root(
#             self,
#             workspace_label,
#             webdav_workspace_label,
#             workspace2_label,
#             webdav_workspace2_label,
#             dir1_label,
#             webdav_dir1_label,
#             dir2_label,
#             webdav_dir2_label,
#             dir3_label,
#             webdav_dir3_label,
#             content_filename,
#             webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory,
#                                    transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label,
#                                                    save_now=True)
#         workspace2 = workspace_api.create_workspace(workspace2_label,
#                                                     save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace,
#                         UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         rapi.create_one(user, workspace2,
#                         UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         example_folder = api.create(
#             content_type_list.Folder.slug,
#             workspace,
#             None,
#             label=dir1_label,
#             do_save=True,
#             do_notify=False,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 example_folder,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                         urlencoded_webdav_dir1_label),
#                                         status=200)
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename),
#             status=200)
#         self.testapp.get(
#             '/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                   urlencoded_webdav_dir1_label,
#                                   urlencoded_webdav_dir3_label,
#                                   urlencoded_webdav_content_filename),
#             status=200)
#         # do move
#         self.testapp.request(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename),
#             method='MOVE',
#             headers={'destination': '/{}/{}'.format(
#                 urlencoded_webdav_workspace2_label,
#                 urlencoded_webdav_dir2_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                urlencoded_webdav_dir1_label,
#                                urlencoded_webdav_content_filename),
#             status=404)
#         self.testapp.get(
#             '/{}/{}/{}/{}'.format(urlencoded_webdav_workspace_label,
#                                   urlencoded_webdav_dir1_label,
#                                   urlencoded_webdav_dir3_label,
#                                   urlencoded_webdav_content_filename),
#             status=404)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace2_label,
#                                          urlencoded_webdav_dir2_label),
#                          status=200)
#         self.testapp.get(
#             '/{}/{}/{}'.format(urlencoded_webdav_workspace2_label,
#                                urlencoded_webdav_dir2_label,
#                                urlencoded_webdav_content_filename),
#             status=200)
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__rename_file_at_root(
#         self,
#         workspace_label,
#         webdav_workspace_label,
#         workspace2_label,
#         webdav_workspace2_label,
#         dir1_label,
#         webdav_dir1_label,
#         dir2_label,
#         webdav_dir2_label,
#         dir3_label,
#         webdav_dir3_label,
#         content_filename,
#         webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory, transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label, save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER,
#                         False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 None,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=200)
#
#         # do move
#         self.testapp.request(
#             '/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
#             method='MOVE',
#             headers={'destination': '/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label, urlencoded_webdav_content_filename), status=200)
#
#     # move different workspace: folder
#
#     @parameterized.expand([
#         (
#             # workspace_label, webdav_workspace_label,
#             'workspace1',
#             'workspace1',
#             # dir1_label, webdav_dir1_label
#             'folder1',
#             'folder1',
#             # dir2_label, webdav_dir2_label
#             'folder2',
#             'folder2',
#             # dir3_label, webdav_dir3_label
#             'folder3',
#             'folder3',
#             # content_filename, webdav_content_filename
#             'myfile.txt',
#             'myfile.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             '/?\\#*wp',
#             '⧸ʔ⧹#∗wp',
#             # dir1_label, webdav_dir1_label
#             '/?\\#*dir1',
#             '⧸ʔ⧹#∗dir1',
#             # dir2_label, webdav_dir2_label
#             '/?\\#*dir2',
#             '⧸ʔ⧹#∗dir2',
#             # dir2_label, webdav_dir3_label
#             '/?\\#*dir3',
#             '⧸ʔ⧹#∗dir3',
#             # content_filename, webdav_content_filename
#             '/?\\#*file.txt',
#             '⧸ʔ⧹#∗file.txt',
#         ),
#         (
#             # workspace_label, webdav_workspace_label,
#             'Project Z',
#             'Project Z',
#             # dir1_label, webdav_dir1_label
#             'Product 21',
#             'Product 21',
#             # dir2_label, webdav_dir2_label
#             'Product 47',
#             'Product 47',
#             # dir3_label, webdav_dir3_label
#             'technical_doc',
#             'technical_doc',
#             # content_filename, webdav_content_filename
#             'report product 47.txt',
#             'report product 47.txt',
#         ),
#     ])
#     def test_functional__webdav_move_folder__ok__different_workspace_root_to_root(
#             self,
#             workspace_label,
#             webdav_workspace_label,
#             workspace2_label,
#             webdav_workspace2_label,
#             dir1_label,
#             webdav_dir1_label,
#             dir2_label,
#             webdav_dir2_label,
#             dir3_label,
#             webdav_dir3_label,
#             content_filename,
#             webdav_content_filename,
#     ) -> None:
#         dbsession = get_tm_session(self.session_factory, transaction.manager)
#         admin = dbsession.query(User) \
#             .filter(User.email == 'admin@admin.admin') \
#             .one()
#         uapi = UserApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         gapi = GroupApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         groups = [gapi.get_one_with_name('users')]
#         user = uapi.create_user('test@test.test', password='test@test.test',
#                                 do_save=True, do_notify=False,
#                                 groups=groups)
#         workspace_api = WorkspaceApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#             show_deleted=True,
#         )
#         workspace = workspace_api.create_workspace(workspace_label, save_now=True)
#         workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
#         rapi = RoleApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
#         rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
#         api = ContentApi(
#             current_user=admin,
#             session=dbsession,
#             config=self.app_config,
#         )
#         with dbsession.no_autoflush:
#             example_product_folder = api.create(
#                 content_type_list.Folder.slug,
#                 workspace,
#                 None,
#                 label=dir3_label,
#                 do_save=True,
#                 do_notify=False,
#             )
#             file = api.create(
#                 content_type_list.File.slug,
#                 workspace,
#                 example_product_folder,
#                 filename=content_filename,
#                 do_save=False,
#                 do_notify=False,
#             )
#             api.update_file_data(
#                 file,
#                 content_filename,
#                 'text/plain',
#                 b'test_content'
#             )
#             api.save(file)
#         transaction.commit()
#
#
#         self.testapp.authorization = (
#             'Basic',
#             (
#                 'test@test.test',
#                 'test@test.test'
#             )
#         )
#         # convert to %encoded for valid_url
#         urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
#         urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
#         urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
#         urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
#         urlencoded_webdav_dir3_label = quote(webdav_dir3_label)
#         urlencoded_webdav_content_filename = quote(webdav_content_filename)
#         # check availability of content
#         self.testapp.get('/{}'.format(urlencoded_webdav_workspace_label), status=200)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=200)
#
#         # do move
#         self.testapp.request(
#             '/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
#             method='MOVE',
#             headers={'destination': '/{}/{}'.format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label)},
#             status=201
#         )
#         # verify move
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label), status=404)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label, urlencoded_webdav_content_filename), status=404)
#         self.testapp.get('/{}/{}'.format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label), status=200)
#         self.testapp.get('/{}/{}/{}'.format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label, urlencoded_webdav_content_filename), status=200)
