from urllib.parse import quote

import pytest
import transaction

from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.models.auth import AuthType
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
@pytest.mark.parametrize("config_section", ["functional_webdav_test_remote_user"])
class TestFunctionWebdavRemoteUser(object):
    def test_functional__webdav_access_to_root_remote_auth__as_http_header(
        self, session, webdav_testapp, user_api_factory, group_api_factory
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
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
        res = webdav_testapp.get("/", status=401, headers=headers_auth)
        assert res

    def test_functional__webdav_access_to_root__remote_auth(
        self, session, webdav_testapp, user_api_factory, group_api_factory
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
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
        res = webdav_testapp.get("/", status=200, extra_environ=extra_environ)
        assert res


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
@pytest.mark.parametrize("config_section", ["functional_webdav_test"])
class TestFunctionalWebdavGet(object):
    """
    Test for all Webdav "GET" action in different case
    """

    def test_functional__webdav_access_to_root__nominal_case(
        self, session, user_api_factory, group_api_factory, webdav_testapp
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()
        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of root using webdav
        res = webdav_testapp.get("/", status=200)
        assert res

    def test_functional__webdav_access_to_root__user_not_exist(
        self, session, webdav_testapp
    ) -> None:
        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of root using webdav
        webdav_testapp.get("/", status=401)

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label",
        [
            # workspace_label, webdav_workspace_label
            ("myworkspace", "myworkspace"),
            ("/?\\#*", "⧸ʔ⧹#∗"),
            ("Project Z", "Project Z"),
        ],
    )
    def test_functional__webdav_access_to_workspace__nominal_case(
        self,
        session,
        workspace_label,
        webdav_workspace_label,
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        # check availability of new created content using webdav
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)

    def test_functional__webdav_access_to_workspace__no_role_in_workspace(
        self, user_api_factory, group_api_factory, workspace_api_factory, webdav_testapp
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace_api.create_workspace("test", save_now=True)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        webdav_testapp.get("/test", status=404)

    def test_functional__webdav_access_to_workspace__workspace_not_exist(
        self, session, user_api_factory, group_api_factory, webdav_testapp
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        webdav_testapp.get("/test", status=404)

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, content_filename, webdav_content_filename",
        [
            # workspace_label, webdav_workspace_label,
            # content_filename, webdav_content_filename
            ("myworkspace", "myworkspace", "myfile.txt", "myfile.txt"),
            ("/?\\#*", "⧸ʔ⧹#∗", "/?\\#*.txt", "⧸ʔ⧹#∗.txt"),
            ("Project Z", "Project Z", "report product 47.txt", "report product 47.txt"),
        ],
    )
    def test_functional__webdav_access_to_content__ok__nominal_case(
        self,
        session,
        workspace_label,
        webdav_workspace_label,
        content_filename,
        webdav_content_filename,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        admin_user,
        webdav_testapp,
    ) -> None:

        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        api = content_api_factory.get()
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        # check availability of new created content using webdav
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )

    def test_functional__webdav_access_to_content__err__file_not_exist(
        self, session, workspace_api_factory, webdav_testapp
    ) -> None:

        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace_api.create_workspace("workspace1", save_now=True)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check availability of new created content using webdav
        webdav_testapp.get("/workspace1", status=200)
        webdav_testapp.get("/workspace1/report.txt", status=404)

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, dir_label, webdav_dir_label, content_filename, webdav_content_filename",
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
        ],
    )
    def test_functional__webdav_access_to_subdir_content__ok__nominal_case(
        self,
        workspace_label,
        webdav_workspace_label,
        dir_label,
        webdav_dir_label,
        content_filename,
        webdav_content_filename,
        workspace_api_factory,
        admin_user,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
    ) -> None:

        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        api = content_api_factory.get()
        folder = api.create(
            content_type_list.Folder.slug, workspace, None, dir_label, do_save=True, do_notify=False
        )
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir_label = quote(webdav_dir_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        # check availability of new created content using webdav
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )

    def test_functional__webdav_access_to_subdir_content__err__file_not_exist(
        self, session, workspace_api_factory, content_api_factory, content_type_list, webdav_testapp
    ) -> None:

        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("workspace1", save_now=True)
        api = content_api_factory.get()
        api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            "examples",
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check availability of new created content using webdav
        webdav_testapp.get("/workspace1", status=200)
        webdav_testapp.get("/workspace1/examples", status=200)
        webdav_testapp.get("/workspace1/examples/report.txt", status=404)


@pytest.mark.parametrize("tracim_fixtures", [[BaseFixture]])
@pytest.mark.parametrize("config_section", ["functional_webdav_test"])
class TestFunctionalWebdavMoveSimpleFile(object):
    """
    Test for all Webdav "MOVE" action for simple file in different case
    """

    # move same workspaces : file
    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, dir1_label, webdav_dir1_label, dir2_label, webdav_dir2_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        admin_user,
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        webdav_testapp,
        session,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
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
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)
        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label).format(), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir2_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, workspace2_label, webdav_workspace2_label, dir1_label, webdav_dir1_label, dir2_label, webdav_dir2_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
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
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)
        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace2_label,
                urlencoded_webdav_dir2_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, dir1_label, webdav_dir1_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        content_type_list,
        content_api_factory,
        webdav_testapp,
        session,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
        api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))

        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, workspace2_label, webdav_workspace2_label, dir1_label, webdav_dir1_label, dir2_label, webdav_dir2_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
        api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            label=dir2_label,
            do_save=True,
            do_notify=False,
        )
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)  # noqa: F841
        urlencoded_webdav_dir2_label = quote(webdav_dir2_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)
        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace2_label,
                urlencoded_webdav_dir2_label,
                urlencoded_webdav_new_content_filename,
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, dir1_label, webdav_dir1_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        content_type_list,
        content_api_factory,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, workspace2_label, webdav_workspace2_label, dir1_label, webdav_dir1_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
        example_folder = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            label=dir1_label,
            do_save=True,
            do_notify=False,
        )
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)
        urlencoded_webdav_dir1_label = quote(webdav_dir1_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        content_api_factory,
        content_type_list,
        webdav_testapp,
        session,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))

        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label, workspace2_label, webdav_workspace2_label, content_filename, webdav_content_filename, new_content_filename, webdav_new_content_filename",
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
        ],
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
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        session,
        content_type_list,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace(workspace_label, save_now=True)
        workspace2 = workspace_api.create_workspace(workspace2_label, save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        rapi.create_one(user, workspace2, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api = content_api_factory.get()
        with session.no_autoflush:
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

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))

        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        urlencoded_webdav_workspace2_label = quote(webdav_workspace2_label)

        urlencoded_webdav_content_filename = quote(webdav_content_filename)
        urlencoded_webdav_new_content_filename = quote(webdav_new_content_filename)

        # check availability of content
        webdav_testapp.get("/{}".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=200,
        )
        # do move
        webdav_testapp.request(
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
        webdav_testapp.get(
            "/{}/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename),
            status=404,
        )
        webdav_testapp.get(
            "/{}/{}".format(
                urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )
