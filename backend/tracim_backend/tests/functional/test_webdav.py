from http import HTTPStatus
from urllib.parse import quote

import pytest
import transaction

from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_webdav_test_remote_user"}], indirect=True
)
class TestFunctionWebdavRemoteUser(object):
    def test_functional__webdav_access_to_root_remote_auth__as_http_header(
        self, session, webdav_testapp, user_api_factory
    ) -> None:

        uapi = user_api_factory.get()

        uapi.create_user(
            "remoteuser@emoteuser.remoteuser",
            password=None,
            do_save=True,
            do_notify=False,
            profile=Profile.USER,
            auth_type=AuthType.REMOTE,
        )
        transaction.commit()
        headers_auth = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        res = webdav_testapp.get("/", status=401, headers=headers_auth)
        assert res

    def test_functional__webdav_access_to_root__remote_auth(
        self, session, webdav_testapp, user_api_factory
    ) -> None:

        uapi = user_api_factory.get()

        user = uapi.create_user(
            "remoteuser@remoteuser.remoteuser",
            password=None,
            do_save=True,
            do_notify=False,
            profile=Profile.USER,
            auth_type=AuthType.REMOTE,
        )
        uapi.save(user)
        transaction.commit()
        extra_environ = {"REMOTE_USER": "remoteuser@remoteuser.remoteuser"}
        res = webdav_testapp.get("/", status=200, extra_environ=extra_environ)
        assert res

    def test_functional__webdav_access_to_root__OK__200__insensitive_email_case(
        self, user_api_factory, webdav_testapp
    ) -> None:
        uapi = user_api_factory.get()

        user = uapi.create_user(
            "remoteuser@remoteuser.remoteuser",
            password=None,
            do_save=True,
            do_notify=False,
            profile=Profile.USER,
            auth_type=AuthType.REMOTE,
        )
        uapi.save(user)
        transaction.commit()
        extra_environ = {"REMOTE_USER": "REMOTEUSER@REMOTEUSER.REMOTEUSER"}
        res = webdav_testapp.get("/", status=200, extra_environ=extra_environ)
        assert res

        extra_environ = {"REMOTE_USER": "ReMoTeUser@rEmOteUser.REmoTEusER"}
        res = webdav_testapp.get("/", status=200, extra_environ=extra_environ)
        assert res


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_webdav_test"}], indirect=True)
class TestFunctionalWebdavGet(object):
    """
    Test for all Webdav "GET" action in different case
    """

    @pytest.mark.parametrize(
        "login", ("test@test.test", "TEST@TEST.TEST", "TeSt@tEsT.teST", "testuser")
    )
    def test_functional__webdav_access_to_root__nominal_cases(
        self, session, user_api_factory, webdav_testapp, login
    ) -> None:

        uapi = user_api_factory.get()

        uapi.create_user(
            email="test@test.test",
            password="test@test.test",
            username="testuser",
            do_save=True,
            do_notify=False,
            profile=Profile.USER,
        )
        transaction.commit()
        webdav_testapp.authorization = ("Basic", (login, "test@test.test"))
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
        workspace_api_factory,
        admin_user,
        role_api_factory,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        res = webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status="*")
        assert res.status_code == HTTPStatus.OK

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label",
        [
            # workspace_label, webdav_workspace_label
            ("myworkspace", "myworkspace"),
            ("/?\\#*", "⧸ʔ⧹#∗"),
            ("Project Z", "Project Z"),
        ],
    )
    def test_functional__webdav_access_to_workspace__dir_sub_workspace(
        self,
        session,
        workspace_label,
        webdav_workspace_label,
        user_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        webdav_testapp,
    ) -> None:
        """
        user should get this tree hierarchy:
        .
        └── parent
            └── "webdav_workspace_label"
        """
        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace_parent = workspace_api.create_workspace("parent", save_now=True)
        workspace = workspace_api.create_workspace(
            workspace_label, save_now=True, parent=workspace_parent
        )
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace_parent, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        # check availability of new created content using webdav
        webdav_testapp.get("/parent.space", status=200)
        webdav_testapp.get("/{}.space", status=404)
        webdav_testapp.get(
            "/parent.space/{}.space".format(urlencoded_webdav_workspace_label), status=200
        )

    def test_functional__webdav_access_to_workspace__orphan_space_access(
        self,
        session,
        user_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        webdav_testapp,
    ) -> None:
        """
        Check access to orphan space at root and access to partially orphany tree:
        .
        ├── other
        └── parent
            └── children
                └── //myworkspace
        with user test@test.test as READER right to "other", "children" and "//myworkspace":
        tree obtain by user should be:
        .
        ├── other
        └── children
            └── //myworkspace
        """

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        other_workspace = workspace_api.create_workspace("other", save_now=True)
        workspace_parent = workspace_api.create_workspace("parent", save_now=True)
        workspace_children = workspace_api.create_workspace("children", save_now=True)
        webdav_workspace_label = "//myworkspace"
        workspace = workspace_api.create_workspace(
            webdav_workspace_label, save_now=True, parent=workspace_parent
        )
        rapi = role_api_factory.get()
        rapi.create_one(user, other_workspace, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace_children, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        # check availability of new created content using webdav
        webdav_testapp.get("/other.space", status=200)
        webdav_testapp.get("/parent.space", status=404)
        webdav_testapp.get("/children.space", status=200)
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=404)
        webdav_testapp.get(
            "/children.space/{}.space".format(urlencoded_webdav_workspace_label), status="*"
        )

    @pytest.mark.parametrize(
        "workspace_label, webdav_workspace_label",
        [
            # workspace_label, webdav_workspace_label
            ("myworkspace", "myworkspace"),
            ("/?\\#*", "⧸ʔ⧹#∗"),
            ("Project Z", "Project Z"),
        ],
    )
    def test_functional__webdav_access_to_workspace__dir_deep_tree_workspace(
        self,
        session,
        workspace_label,
        webdav_workspace_label,
        user_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        webdav_testapp,
    ) -> None:
        """
        user should get this tree hierarchy:
        .
        └── parent
            └── child
                └── grandson
                    └── "workspace_label"
        """
        uapi = user_api_factory.get()
        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=admin_user, show_deleted=True)
        workspace_parent = workspace_api.create_workspace("parent", save_now=True)
        workspace_child = workspace_api.create_workspace(
            "child", save_now=True, parent=workspace_parent
        )
        workspace_grandson = workspace_api.create_workspace(
            "grandson", save_now=True, parent=workspace_child
        )
        workspace = workspace_api.create_workspace(
            workspace_label, save_now=True, parent=workspace_grandson
        )
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace_parent, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace_child, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace_grandson, UserRoleInWorkspace.READER, False)
        rapi.create_one(user, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # convert to %encoded for valid_url
        urlencoded_webdav_workspace_label = quote(webdav_workspace_label)
        # check availability of new created content using webdav
        webdav_testapp.get("/parent.space", status=200)
        webdav_testapp.get("/child.space", status=404)
        webdav_testapp.get("/grandson.space", status=404)
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=404)

        webdav_testapp.get("/parent.space/child.space", status=200)
        webdav_testapp.get("/parent.space/parent.space", status=404)
        webdav_testapp.get("/parent.space/grandson.space", status=404)
        webdav_testapp.get("/parent/{}.space".format(urlencoded_webdav_workspace_label), status=404)

        webdav_testapp.get("/parent.space/child.space/grandson.space", status=200)
        webdav_testapp.get("/parent.space/child.space/parent.space", status=404)
        webdav_testapp.get("/parent.space/child.space/child.space", status=404)
        webdav_testapp.get(
            "/parent.space/child.space/{}.space".format(urlencoded_webdav_workspace_label),
            status=404,
        )

        webdav_testapp.get(
            "/parent.space/child.space/grandson.space/{}.space".format(
                urlencoded_webdav_workspace_label
            ),
            status=200,
        )
        webdav_testapp.get("/parent.space/child.space/grandson.space/child.space", status=404)
        webdav_testapp.get("/parent.space/child.space/grandson.space/grandson.space", status=404)
        webdav_testapp.get("/parent.space/child.space/grandson.space/parent.space", status=404)

    def test_functional__webdav_access_to_workspace__no_role_in_workspace(
        self, user_api_factory, workspace_api_factory, webdav_testapp
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace_api.create_workspace("test", save_now=True)
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        webdav_testapp.get("/test", status=404)

    def test_functional__webdav_access_to_workspace__workspace_not_exist(
        self, session, user_api_factory, webdav_testapp
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        transaction.commit()

        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        webdav_testapp.get("/test", status=404)

    def test_functional__webdav_access_to_workspace__subworkspace_or_content_not_exist_in_workspace(
        self, session, user_api_factory, webdav_testapp, workspace_api_factory
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=user, show_deleted=True)
        workspace_api.create_workspace("parent", save_now=True)
        transaction.commit()
        webdav_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        # check availability of new created content using webdav
        webdav_testapp.get("/parent.space", status=200)
        webdav_testapp.get("/parent.space/children.space", status=404)

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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
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
        webdav_testapp.get("/workspace1.space", status=200)
        webdav_testapp.get("/workspace1.space/report.txt", status=404)

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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
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
        webdav_testapp.get("/workspace1.space", status=200)
        webdav_testapp.get("/workspace1.space/examples", status=200)
        webdav_testapp.get("/workspace1.space/examples/report.txt", status=404)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_webdav_test"}], indirect=True)
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
        admin_user,
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        webdav_testapp,
        session,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get(
            "/{}.space".format(urlencoded_webdav_workspace_label).format(), status=200
        )
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}/{}".format(
                    urlencoded_webdav_workspace_label,
                    urlencoded_webdav_dir2_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )

        # verify move
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
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
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
        event_helper,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}/{}".format(
                    urlencoded_webdav_workspace2_label,
                    urlencoded_webdav_dir2_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )
        event = event_helper.last_event
        assert event.event_type == "content.modified.file"
        assert event.fields["author"]
        # verify move
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
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
        workspace_api_factory,
        admin_user,
        role_api_factory,
        content_type_list,
        content_api_factory,
        webdav_testapp,
        session,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}/{}".format(
                    urlencoded_webdav_workspace_label,
                    urlencoded_webdav_dir1_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )
        # verify move
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
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
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace2_label, urlencoded_webdav_dir2_label),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}/{}".format(
                    urlencoded_webdav_workspace2_label,
                    urlencoded_webdav_dir2_label,
                    urlencoded_webdav_new_content_filename,
                )
            },
            status=201,
        )
        # verify move
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
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
        workspace_api_factory,
        admin_user,
        role_api_factory,
        content_type_list,
        content_api_factory,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}".format(
                    urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(
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
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        content_type_list,
        session,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(urlencoded_webdav_workspace_label, urlencoded_webdav_dir1_label),
            status=200,
        )
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}".format(
                    urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        webdav_testapp.get(
            "/{}.space/{}/{}".format(
                urlencoded_webdav_workspace_label,
                urlencoded_webdav_dir1_label,
                urlencoded_webdav_content_filename,
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(
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
        workspace_api_factory,
        admin_user,
        role_api_factory,
        content_api_factory,
        content_type_list,
        webdav_testapp,
        session,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}".format(
                    urlencoded_webdav_workspace_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(
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
        workspace_api_factory,
        role_api_factory,
        content_api_factory,
        session,
        content_type_list,
        webdav_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
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
        webdav_testapp.get("/{}.space".format(urlencoded_webdav_workspace_label), status=200)
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=200,
        )
        # do move
        webdav_testapp.request(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            method="MOVE",
            headers={
                "destination": "/{}.space/{}".format(
                    urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
                )
            },
            status=201,
        )
        # verify move
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace_label, urlencoded_webdav_content_filename
            ),
            status=404,
        )
        webdav_testapp.get(
            "/{}.space/{}".format(
                urlencoded_webdav_workspace2_label, urlencoded_webdav_new_content_filename
            ),
            status=200,
        )
