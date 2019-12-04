# -*- coding: utf-8 -*-
"""
Tests for /api/v2/users subpath endpoints.
"""

import pytest
import transaction

from tracim_backend import AuthType
from tracim_backend.error import ErrorCode
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import create_1000px_png_test_image


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserRecentlyActiveContentEndpoint(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/recently_active
    """

    def test_api__get_recently_active_content__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        res = res.json_body
        assert len(res) == 7
        for elem in res:
            assert isinstance(elem["content_id"], int)
            assert isinstance(elem["content_type"], str)
            assert elem["content_type"] != "comments"
            assert isinstance(elem["is_archived"], bool)
            assert isinstance(elem["is_deleted"], bool)
            assert isinstance(elem["label"], str)
            assert isinstance(elem["parent_id"], int) or elem["parent_id"] is None
            assert isinstance(elem["show_in_ui"], bool)
            assert isinstance(elem["slug"], str)
            assert isinstance(elem["status"], str)
            assert isinstance(elem["sub_content_types"], list)
            for sub_content_type in elem["sub_content_types"]:
                assert isinstance(sub_content_type, str)
            assert isinstance(elem["workspace_id"], int)
        # comment is newest than page2
        assert res[0]["content_id"] == firstly_created_but_recently_commented.content_id
        assert res[1]["content_id"] == secondly_created_but_not_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[2]["content_id"] == firstly_created_but_recently_updated.content_id
        assert res[3]["content_id"] == secondly_created_but_not_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[4]["content_id"] == secondly_created.content_id
        assert res[5]["content_id"] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[6]["content_id"] == main_folder.content_id

    def test_api__get_recently_active_content__err__400__no_access_to_workspace(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        content_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )

        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api__get_recently_active_content__ok__200__user_itself(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        res = res.json_body
        assert len(res) == 7
        for elem in res:
            assert isinstance(elem["content_id"], int)
            assert isinstance(elem["content_type"], str)
            assert elem["content_type"] != "comments"
            assert isinstance(elem["is_archived"], bool)
            assert isinstance(elem["is_deleted"], bool)
            assert isinstance(elem["label"], str)
            assert isinstance(elem["parent_id"], int) or elem["parent_id"] is None
            assert isinstance(elem["show_in_ui"], bool)
            assert isinstance(elem["slug"], str)
            assert isinstance(elem["status"], str)
            assert isinstance(elem["sub_content_types"], list)
            for sub_content_type in elem["sub_content_types"]:
                assert isinstance(sub_content_type, str)
            assert isinstance(elem["workspace_id"], int)
        # comment is newest than page2
        assert res[0]["content_id"] == firstly_created_but_recently_commented.content_id
        assert res[1]["content_id"] == secondly_created_but_not_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[2]["content_id"] == firstly_created_but_recently_updated.content_id
        assert res[3]["content_id"] == secondly_created_but_not_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[4]["content_id"] == secondly_created.content_id
        assert res[5]["content_id"] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[6]["content_id"] == main_folder.content_id

    def test_api__get_recently_active_content__err__403__other_user(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
        admin_user,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api__get_recently_active_content__ok__200__limit_2_multiple(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # TODO - G.M - 2018-07-20 - Better fix for this test, do not use sleep()
        # anymore to fix datetime lack of precision.

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)

        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"limit": 2}
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 2
        for elem in res:
            assert isinstance(elem["content_id"], int)
            assert isinstance(elem["content_type"], str)
            assert elem["content_type"] != "comments"
            assert isinstance(elem["is_archived"], bool)
            assert isinstance(elem["is_deleted"], bool)
            assert isinstance(elem["label"], str)
            assert isinstance(elem["parent_id"], int) or elem["parent_id"] is None
            assert isinstance(elem["show_in_ui"], bool)
            assert isinstance(elem["slug"], str)
            assert isinstance(elem["status"], str)
            assert isinstance(elem["sub_content_types"], list)
            for sub_content_type in elem["sub_content_types"]:
                assert isinstance(sub_content_type, str)
            assert isinstance(elem["workspace_id"], int)
        # comment is newest than page2
        assert res[0]["content_id"] == firstly_created_but_recently_commented.content_id
        assert res[1]["content_id"] == secondly_created_but_not_commented.content_id

        params = {"limit": 2, "before_content_id": secondly_created_but_not_commented.content_id}
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 2
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[0]["content_id"] == firstly_created_but_recently_updated.content_id
        assert res[1]["content_id"] == secondly_created_but_not_updated.content_id

    def test_api__get_recently_active_content__err__400__bad_before_content_id(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # TODO - G.M - 2018-07-20 - Better fix for this test, do not use sleep()
        # anymore to fix datetime lack of precision.

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)

        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"before_content_id": 4000}
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserReadStatusEndpoint(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status
    """

    def test_api__get_read_status__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        admin_user,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        res = res.json_body
        assert len(res) == 7
        for elem in res:
            assert isinstance(elem["content_id"], int)
            assert isinstance(elem["read_by_user"], bool)
        # comment is newest than page2
        assert res[0]["content_id"] == firstly_created_but_recently_commented.content_id
        assert res[1]["content_id"] == secondly_created_but_not_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[2]["content_id"] == firstly_created_but_recently_updated.content_id
        assert res[3]["content_id"] == secondly_created_but_not_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[4]["content_id"] == secondly_created.content_id
        assert res[5]["content_id"] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[6]["content_id"] == main_folder.content_id

    def test_api__get_read_status__ok__200__user_itself(
        self,
        workspace_api_factory,
        admin_user,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        selected_contents_id = [
            firstly_created_but_recently_commented.content_id,
            firstly_created_but_recently_updated.content_id,
            firstly_created.content_id,
            main_folder.content_id,
        ]
        params = {
            "content_ids": "{cid1},{cid2},{cid3},{cid4}".format(
                cid1=selected_contents_id[0],
                cid2=selected_contents_id[1],
                cid3=selected_contents_id[2],
                cid4=selected_contents_id[3],
            )
        }
        url = "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
            workspace_id=workspace.workspace_id, user_id=test_user.user_id
        )
        res = web_testapp.get(url=url, status=200, params=params)
        res = res.json_body
        assert len(res) == 4
        for elem in res:
            assert isinstance(elem["content_id"], int)
            assert isinstance(elem["read_by_user"], bool)
        # comment is newest than page2
        assert res[0]["content_id"] == firstly_created_but_recently_commented.content_id
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert res[1]["content_id"] == firstly_created_but_recently_updated.content_id
        # creation order is inverted here as last created is last active
        assert res[2]["content_id"] == firstly_created.content_id
        # folder subcontent modification does not change folder order
        assert res[3]["content_id"] == main_folder.content_id

    def test_api__get_read_status__err__403__other_user(
        self,
        workspace_api_factory,
        user_api_factory,
        admin_user,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        selected_contents_id = [
            firstly_created_but_recently_commented.content_id,
            firstly_created_but_recently_updated.content_id,
            firstly_created.content_id,
            main_folder.content_id,
        ]
        params = {
            "content_ids": "{cid1},{cid2},{cid3},{cid4}".format(
                cid1=selected_contents_id[0],
                cid2=selected_contents_id[1],
                cid3=selected_contents_id[2],
                cid4=selected_contents_id[3],
            )
        }
        url = "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
            workspace_id=workspace.workspace_id, user_id=admin_user.user_id
        )
        res = web_testapp.get(url=url, status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSetContentAsRead(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read
    """

    def test_api_set_content_as_read__ok__200__admin(
        self,
        admin_user,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(firstly_created)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # before
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
        # read
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

    def test_api_set_content_as_read__ok__200__admin_workspace_do_not_exist(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(firstly_created)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # read
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=4000, content_id=firstly_created.content_id, user_id=test_user.user_id
            ),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api_set_content_as_read__ok__200__admin_content_do_not_exist(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(firstly_created)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # read
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id, content_id=4000, user_id=test_user.user_id
            ),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api_set_content_as_read__ok__200__user_itself(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(firstly_created)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # before
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        # read
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

    def test_api_set_content_as_read__ok__403__other_user(
        self,
        workspace_api_factory,
        admin_user,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(firstly_created)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # read
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin_user.user_id,
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api_set_content_as_read__ok__200__admin_with_comments_read_content(
        self,
        admin_user,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        comments = api.create_comment(workspace, firstly_created, "juste a super comment", True)
        api.mark_unread(firstly_created)
        api.mark_unread(comments)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # before
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

    def test_api_set_content_as_read__ok__200__admin_with_comments_read_comment(
        self,
        workspace_api_factory,
        admin_user,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        comments = api.create_comment(workspace, firstly_created, "juste a super comment", True)
        api.mark_read(firstly_created)
        api.mark_unread(comments)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # before
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=comments.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSetContentAsUnread(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread
    """

    def test_api_set_content_as_unread__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
        admin_user,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_read(firstly_created)
        api2.mark_read(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # before
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        # unread
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

    def test_api_set_content_as_unread__err__400__admin_workspace_do_not_exist(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
        admin_user,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_read(firstly_created)
        api2.mark_read(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # unread
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=4000, content_id=firstly_created.content_id, user_id=test_user.user_id
            ),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api_set_content_as_unread__err__400__admin_content_do_not_exist(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_read(firstly_created)
        api2.mark_read(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        # unread
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id, content_id=4000, user_id=test_user.user_id
            ),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api_set_content_as_unread__ok__200__user_itself(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_read(firstly_created)
        api2.mark_read(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # before
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        # unread
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

    def test_api_set_content_as_unread__err__403__other_user(
        self,
        admin_user,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_read(firstly_created)
        api2.mark_read(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))

        # unread
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin_user.user_id,
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api_set_content_as_unread__ok__200__with_comments_read_content(
        self,
        session,
        content_type_list,
        workspace_api_factory,
        content_api_factory,
        admin_user,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        api = content_api_factory.get()
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        comments = api.create_comment(workspace, firstly_created, "juste a super comment", True)
        api.mark_read(firstly_created)
        api.mark_read(comments)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

    def test_api_set_content_as_unread__ok__200__with_comments_read_comment_only(
        self,
        session,
        content_type_list,
        workspace_api_factory,
        content_api_factory,
        admin_user,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        api = content_api_factory.get()
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        comments = api.create_comment(workspace, firstly_created, "juste a super comment", True)
        api.mark_read(firstly_created)
        api.mark_read(comments)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=comments.content_id,
                user_id=admin_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/v2/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSetWorkspaceAsRead(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/read
    """

    def test_api_set_content_as_read__ok__200__admin(
        self,
        workspace_api_factory,
        content_type_list,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(main_folder)
        api.mark_unread(firstly_created)
        api2.mark_unread(main_folder)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
        assert res.json_body[1]["content_id"] == main_folder.content_id
        assert res.json_body[1]["read_by_user"] is False
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        assert res.json_body[1]["content_id"] == main_folder.content_id
        assert res.json_body[1]["read_by_user"] is True

    def test_api_set_content_as_read__ok__200__user_itself(
        self,
        workspace_api_factory,
        content_type_list,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(main_folder)
        api.mark_unread(firstly_created)
        api2.mark_unread(main_folder)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
        assert res.json_body[1]["content_id"] == main_folder.content_id
        assert res.json_body[1]["read_by_user"] is False
        web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        assert res.json_body[1]["content_id"] == main_folder.content_id
        assert res.json_body[1]["read_by_user"] is True

    def test_api_set_content_as_read__err__403__other_user(
        self,
        workspace_api_factory,
        content_type_list,
        user_api_factory,
        admin_user,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        api = content_api_factory.get()
        api2 = content_api_factory.get(current_user=test_user)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.mark_unread(main_folder)
        api.mark_unread(firstly_created)
        api2.mark_unread(main_folder)
        api2.mark_unread(firstly_created)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.put(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin_user.user_id,
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserEnableWorkspaceNotification(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/activate
    """

    def test_api_enable_user_workspace_notification__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=False)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False
        session.close()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/activate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=204,
        )
        rapi = role_api_factory.get()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True

    def test_api_enable_user_workspace_notification__ok__200__user_itself(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=False)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False
        session.close()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/activate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=204,
        )
        rapi = role_api_factory.get()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True

    def test_api_enable_user_workspace_notification__err__403__other_user(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="boby",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=False)
        rapi.create_one(test_user2, workspace, UserRoleInWorkspace.READER, with_notif=False)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False
        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        res = web_testapp.put_json(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/activate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserDisableWorkspaceNotification(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate
    """

    def test_api_disable_user_workspace_notification__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=True)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True
        session.close()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=204,
        )
        rapi = role_api_factory.get()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False

    def test_api_disable_user_workspace_notification__ok__200__user_itself(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=True)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True
        session.close()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=204,
        )
        rapi = role_api_factory.get()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False

    def test_api_disable_user_workspace_notification__err__403__other_user(
        self,
        workspace_api_factory,
        user_api_factory,
        group_api_factory,
        role_api_factory,
        session,
        content_api_factory,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="boby",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=True)
        rapi.create_one(test_user2, workspace, UserRoleInWorkspace.READER, with_notif=False)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True
        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        res = web_testapp.put_json(
            "/api/v2/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=403,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserWorkspaceEndpoint(object):
    """
    Tests for /api/v2/users/{user_id}/workspaces
    """

    def test_api__get_user_workspaces__ok_200__with_filter(
        self,
        workspace_api_factory,
        user_api_factory,
        admin_user,
        application_api_factory,
        web_testapp,
        group_api_factory,
        role_api_factory,
    ):
        """
        Check obtain all workspaces reachables for user with different filter
        """

        workspace_api = workspace_api_factory.get()
        owned_and_role_workspace = workspace_api.create_workspace(label="owned_and_role")
        owned_only_workspace = workspace_api.create_workspace("owned_only")
        user_api = user_api_factory.get()
        user_api.create_user("toto@toto.toto", do_notify=False)
        group_api = group_api_factory.get()
        groups = [group_api.get_one_with_name("administrators")]
        test_user = user_api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        workspace_api_test_user = workspace_api_factory.get(test_user)
        role_only_workspace = workspace_api_test_user.create_workspace(label="role_only")
        rapi = role_api_factory.get()
        rapi.create_one(admin_user, role_only_workspace, UserRoleInWorkspace.READER, False)
        rapi.create_one(
            test_user, owned_only_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        transaction.commit()
        rapi_test_user = role_api_factory.get(test_user)
        rapi_test_user.delete_one(admin_user.user_id, owned_only_workspace.workspace_id)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {}
        res = web_testapp.get(
            "/api/v2/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "1"}
        res = web_testapp.get(
            "/api/v2/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "0"}
        res = web_testapp.get(
            "/api/v2/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "0", "show_owned_workspace": "1"}
        res = web_testapp.get(
            "/api/v2/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "0", "show_owned_workspace": "0"}
        res = web_testapp.get(
            "/api/v2/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == set()

    @pytest.mark.usefixtures("default_content_fixture")
    def test_api__get_user_workspaces__ok_200__nominal_case(
        self, workspace_api_factory, application_api_factory, web_testapp
    ):
        """
        Check obtain all workspaces reachables for user with user auth.
        """

        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.get_one(1)
        app_api = application_api_factory.get()

        default_sidebar_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace
        )  # nope8
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/users/1/workspaces", status=200)
        res = res.json_body
        workspace = res[0]
        assert workspace["workspace_id"] == 1
        assert workspace["label"] == "Business"
        assert workspace["slug"] == "business"
        assert workspace["is_deleted"] is False

        assert len(workspace["sidebar_entries"]) == len(default_sidebar_entry)
        for counter, sidebar_entry in enumerate(default_sidebar_entry):
            workspace["sidebar_entries"][counter]["slug"] = sidebar_entry.slug
            workspace["sidebar_entries"][counter]["label"] = sidebar_entry.label
            workspace["sidebar_entries"][counter]["route"] = sidebar_entry.route
            workspace["sidebar_entries"][counter]["hexcolor"] = sidebar_entry.hexcolor
            workspace["sidebar_entries"][counter]["fa_icon"] = sidebar_entry.fa_icon

    @pytest.mark.usefixtures("default_content_fixture")
    def test_api__get_user_workspaces__err_403__unallowed_user(self, web_testapp):
        """
        Check obtain all workspaces reachables for one user
        with another non-admin user auth.
        """
        web_testapp.authorization = ("Basic", ("lawrence-not-real-email@fsf.local", "foobarbaz"))
        res = web_testapp.get("/api/v2/users/1/workspaces", status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    @pytest.mark.usefixtures("default_content_fixture")
    def test_api__get_user_workspaces__err_401__unregistered_user(self, web_testapp):
        """
        Check obtain all workspaces reachables for one user
        without correct user auth (user unregistered).
        """
        web_testapp.authorization = ("Basic", ("john@doe.doe", "lapin"))
        res = web_testapp.get("/api/v2/users/1/workspaces", status=401)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] is None
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    @pytest.mark.usefixtures("default_content_fixture")
    def test_api__get_user_workspaces__err_400__user_does_not_exist(self, web_testapp):
        """
        Check obtain all workspaces reachables for one user who does
        not exist
        with a correct user auth.
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/users/5/workspaces", status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.USER_NOT_FOUND
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_allowed_space_limitation"}], indirect=True
)
class TestUserEndpointWithAllowedSpaceLimitation(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """

    def test_api__get_user__ok_200__admin(self, user_api_factory, group_api_factory, web_testapp):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["is_deleted"] is False
        assert res["lang"] == "fr"
        assert res["allowed_space"] == 134217728

    def test_api__create_user__ok_200__full_admin(self, web_testapp, user_api_factory):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        assert res["allowed_space"] == 134217728


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section",
    [{"name": "functional_test_with_trusted_user_as_default_profile"}],
    indirect=True,
)
class TestUserEndpointTrustedUserDefaultProfile(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """

    def test_api__create_user__ok_200__full_admin_default_profile(
        self, web_testapp, user_api_factory
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": None,
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "trusted-users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.email == "test@test.test"
        assert user.validate_password("mysuperpassword")


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_allowed_space_limitation"}], indirect=True
)
class TestUserDiskSpace(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}/allowed_space
    """

    def test_api__get_user_disk_space__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp, workspace_api_factory
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="test@test.test",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        workspace_api = workspace_api_factory.get(current_user=test_user, show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        transaction.commit()
        user_id = int(test_user.user_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.post(
            "/api/v2/workspaces/{}/files".format(workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=200,
        )
        res = web_testapp.get("/api/v2/users/{}/disk_space".format(user_id), status=200)
        res = res.json_body
        assert res["used_space"] == 6210
        assert res["user"]["public_name"] == "bob"
        assert res["user"]["avatar_url"] is None
        assert res["allowed_space"] == 134217728


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """

    def test_api__get_user__ok_200__admin(self, user_api_factory, group_api_factory, web_testapp):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["is_deleted"] is False
        assert res["lang"] == "fr"
        assert res["allowed_space"] == 0

    def test_api__get_user__ok_200__user_itself(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["is_deleted"] is False
        assert res["allowed_space"] == 0

    def test_api__get_user__err_403__other_normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api__create_user__ok_200__full_admin(self, web_testapp, user_api_factory):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        assert res["allowed_space"] == 0

    def test_api__create_user__ok_200__full_admin_with_allowed_space(
        self, web_testapp, user_api_factory
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "allowed_space": 134217728,
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        assert res["allowed_space"] == 134217728

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.email == "test@test.test"
        assert user.validate_password("mysuperpassword")
        assert user.allowed_space == 134217728

    def test_api__create_user__ok_200__full_admin_default_profile(
        self, web_testapp, user_api_factory
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": None,
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.email == "test@test.test"
        assert user.validate_password("mysuperpassword")

    def test_api__create_user__ok_200__email_treated_as_lowercase(self, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "ThisIsAnEmailWithUppercaseCharacters@Test.Test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["email"] == "thisisanemailwithuppercasecharacters@test.test"
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "thisisanemailwithuppercasecharacters@test.test"
        transaction.commit()
        # INFO - G.M - 2019-07-02 - check if we cannot
        # create multiples accounts with same email but different case.
        params = {
            "email": "thisisanemailwithuppercasecharacters@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == ErrorCode.EMAIL_ALREADY_EXIST_IN_DB
        params = {
            "email": "THISISANEMAILWITHUPPERCASECHARACTERS@TEST.TEST",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == ErrorCode.EMAIL_ALREADY_EXIST_IN_DB
        params = {
            "email": "ThisIsAnEmailWithUppercaseCharacters@Test.Test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == ErrorCode.EMAIL_ALREADY_EXIST_IN_DB

    def test_api__create_user__ok_200__limited_admin(self, web_testapp, user_api_factory):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"email": "test@test.test", "email_notification": False, "password": None}
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test"
        assert res["timezone"] == ""
        assert res["lang"] is None
        assert res["auth_type"] == "unknown"

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.email == "test@test.test"
        assert user.password is None

    def test_api__create_user__err_400__email_already_in_db(
        self, user_api_factory, web_testapp, group_api_factory
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EMAIL_ALREADY_EXIST_IN_DB

    def test_api__create_user__err_403__other_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {
            "email": "test2@test2.test2",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "public_name": "test user",
            "lang": "fr",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestUserWithNotificationEndpoint(object):
    """
    Tests for POST /api/v2/users/{user_id}
    """

    def test_api__create_user__ok_200__full_admin_with_notif(
        self, web_testapp, user_api_factory, mailhog
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "public_name": "test user",
            "lang": "fr",
            "email_notification": True,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.email == "test@test.test"
        assert user.validate_password("mysuperpassword")

        # check mail received
        response = mailhog.get_mailhog_mails()
        assert len(response) == 1
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "test user <test@test.test>"
        assert headers["Subject"][0] == "[TRACIM] Created account"

    def test_api__create_user__ok_200__limited_admin_with_notif(
        self, web_testapp, user_api_factory, mailhog
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"email": "test@test.test", "email_notification": True}
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test"
        assert res["timezone"] == ""
        assert res["lang"] is None

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.email == "test@test.test"
        assert user.password
        assert user.auth_type == AuthType.UNKNOWN

        # check mail received
        response = mailhog.get_mailhog_mails()
        assert len(response) == 1
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "test <test@test.test>"
        assert headers["Subject"][0] == "[TRACIM] Created account"

    def test_api_delete_user__ok_200__admin(
        sel, web_testapp, user_api_factory, group_api_factory, mailhog
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put("/api/v2/users/{}/trashed".format(user_id), status=204)
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200).json_body
        assert res["is_deleted"] is True

    def test_api_delete_user__err_400__admin_itself(self, web_testapp, admin_user):

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.put("/api/v2/users/{}/trashed".format(admin_user.user_id), status=400)
        assert res.json_body["code"] == ErrorCode.USER_CANT_DELETE_HIMSELF
        res = web_testapp.get("/api/v2/users/{}".format(admin_user.user_id), status=200).json_body
        assert res["is_deleted"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUsersEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """

    def test_api__get_user__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp, admin_user
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/users", status=200)
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == admin_user.user_id
        assert res[1]["public_name"] == admin_user.display_name
        assert res[1]["avatar_url"] is None

    def test_api__get_user__err_403__normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/v2/users", status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestKnownMembersEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """

    def test_api__get_user__ok_200__admin__by_name(
        self, user_api_factory, group_api_factory, admin_user, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_user(
        self, web_testapp, user_api_factory, group_api_factory, admin_user
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_user_ids": str(test_user2.user_id)}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_workspace(
        self,
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        admin_user,
        role_api_factory,
        web_testapp,
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(test_user2, workspace2, UserRoleInWorkspace.READER, False)
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_workspace_ids": str(workspace2.workspace_id)}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_workspace_and_user(
        self,
        admin_user,
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(test_user2, workspace2, UserRoleInWorkspace.READER, False)
        role_api.create_one(test_user3, workspace, UserRoleInWorkspace.READER, False)
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "acp": "bob",
            "exclude_workspace_ids": str(workspace2.workspace_id),
            "exclude_user_ids": str(test_user3.user_id),
        }
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name__deactivated_members(
        self, user_api_factory, group_api_factory, web_testapp, admin_user
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2.is_active = False
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_email(
        self, user_api_factory, group_api_factory, admin_user, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "test"}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None

    def test_api__get_user__err_403__admin__too_small_acp(
        self, user_api_factory, group_api_factory, admin_user, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "t"}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__get_user__ok_200__normal_user_by_email(
        self,
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        uapi.save(test_user3)

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(test_user2, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_known_member_filter_disabled"}], indirect=True
)
class TestKnownMembersEndpointKnownMembersFilterDisabled(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/v2/users/{user_id}
    """

    def test_api__get_user__ok_200__show_all_members(
        self,
        user_api_factory,
        group_api_factory,
        workspace_api_factory,
        role_api_factory,
        web_testapp,
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        uapi.save(test_user3)

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        role_api = role_api_factory.get()
        role_api.create_one(test_user, workspace, UserRoleInWorkspace.READER, False)
        role_api.create_one(test_user2, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get(
            "/api/v2/users/{user_id}/known_members".format(user_id=user_id),
            status=200,
            params=params,
        )
        res = res.json_body

        assert len(res) == 3
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None

        assert res[2]["user_id"] == test_user3.user_id
        assert res[2]["public_name"] == test_user3.display_name
        assert res[2]["avatar_url"] is None


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_ldap_and_internal_test"}], indirect=True
)
class TestSetEmailPasswordLdapEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/email
    Tests for PUT /api/v2/users/{user_id}/password

    for ldap user
    """

    def test_api__set_user_email__ok_200__ldap_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password=None,
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            auth_type=AuthType.LDAP,
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=400
        )
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"
        assert res["auth_type"] == "ldap"

    def test_api__set_user_password_ldap__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp, session
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password=None,
            auth_type=AuthType.LDAP,
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        user = uapi.get_one(user_id)
        assert not user.validate_password("mynewpassword")
        session.close()
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "admin@admin.admin",
        }
        res = web_testapp.put_json(
            "/api/v2/users/{}/password".format(user_id), params=params, status=400
        )
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED
        # Check After

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert not user.validate_password("mynewpassword")


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetEmailEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/email
    """

    def test_api__set_user_email__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "admin@admin.admin"}
        web_testapp.put_json("/api/v2/users/{}/email".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "mysuperemail@email.fr"

    def test_api__set_user_email__err_400__admin_same_email(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "admin@admin.admin", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMAIL_ALREADY_EXIST_IN_DB
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_user_email__err_403__admin_wrong_password(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "badpassword"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_user_email__err_400__admin_string_is_not_email(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "thatisnotandemail", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=400
        )
        # TODO - G.M - 2018-09-10 - Handled by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_user_email__ok_200__user_itself(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        web_testapp.put_json("/api/v2/users/{}/email".format(user_id), params=params, status=200)
        web_testapp.authorization = ("Basic", ("mysuperemail@email.fr", "password"))
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "mysuperemail@email.fr"

    def test_api__set_user_email__err_403__other_normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetPasswordEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/password
    """

    def test_api__set_user_password__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp, session
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")
        session.close()
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "admin@admin.admin",
        }
        web_testapp.put_json("/api/v2/users/{}/password".format(user_id), params=params, status=204)
        # Check After
        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert not user.validate_password("password")
        assert user.validate_password("mynewpassword")

    def test_api__set_user_password__err_403__admin_wrong_password(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "wrongpassword",
        }
        res = web_testapp.put_json(
            "/api/v2/users/{}/password".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD

        uapi = user_api_factory.get()
        # Check After
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")

    def test_api__set_user_password__err_400__admin_passwords_do_not_match(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")
        assert not user.validate_password("mynewpassword2")
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword2",
            "loggedin_user_password": "admin@admin.admin",
        }
        res = web_testapp.put_json(
            "/api/v2/users/{}/password".format(user_id), params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.PASSWORD_DO_NOT_MATCH
        # Check After

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")
        assert not user.validate_password("mynewpassword2")

    def test_api__set_user_password__ok_200__user_itself(
        self, user_api_factory, group_api_factory, web_testapp, session
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")
        session.close()
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "password",
        }
        web_testapp.put_json("/api/v2/users/{}/password".format(user_id), params=params, status=204)
        # Check After
        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert not user.validate_password("password")
        assert user.validate_password("mynewpassword")

    def test_api__set_user_email__err_403__other_normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            lang="fr",
            timezone="Europe/Paris",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserInfoEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}
    """

    def test_api__set_user_info__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        # Set params
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        web_testapp.put_json("/api/v2/users/{}".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "updated"
        assert res["timezone"] == "Europe/London"
        assert res["lang"] == "en"

    def test_api__set_user_info__ok_200__user_itself(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        # Set params
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        web_testapp.put_json("/api/v2/users/{}".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "updated"
        assert res["timezone"] == "Europe/London"
        assert res["lang"] == "en"

    def test_api__set_user_info__err_403__other_normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set params
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        res = web_testapp.put_json("/api/v2/users/{}".format(user_id), params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserProfileEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/profile
    """

    def test_api__set_user_profile__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["profile"] == "users"
        # Set params
        params = {"profile": "administrators"}
        web_testapp.put_json("/api/v2/users/{}/profile".format(user_id), params=params, status=204)
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["profile"] == "administrators"

    def test_api__set_user_profile__err_400__admin_itself(self, web_testapp, admin_user):
        """
        Trying to set is own profile as user with admin right.
        Return 400 because of "not allow to set own profile check"
        """

        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(admin_user.user_id), status=200)
        res = res.json_body
        assert res["user_id"] == admin_user.user_id
        assert res["profile"] == "administrators"
        # Set params
        params = {"profile": "users"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/profile".format(admin_user.user_id), params=params, status=400
        )
        assert res.json_body["code"] == ErrorCode.USER_CANT_CHANGE_IS_OWN_PROFILE
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(admin_user.user_id), status=200)
        res = res.json_body
        assert res["user_id"] == admin_user.user_id
        assert res["profile"] == "administrators"

    def test_api__set_user_profile__err_403__other_normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):
        """
        Set user profile of user normal user as normal user
        Return 403 error because of no right to do this as simple user
        """

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set params
        params = {"profile": "administrators"}
        res = web_testapp.put_json(
            "/api/v2/users/{}/profile".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserAllowedSpaceEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/allowed_space
    """

    def test_api__set_user_allowed_space__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["allowed_space"] == 0
        # Set params
        params = {"allowed_space": 134217728}
        web_testapp.put_json(
            "/api/v2/users/{}/allowed_space".format(user_id), params=params, status=204
        )
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["allowed_space"] == 134217728

    def test_api__set_user_allowed_space__err_403__other_normal_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):
        """
        Set user allowed_space of user normal user as normal user
        Return 403 error because of no right to do this as simple user
        """

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set params
        params = {"allowed_space": 134217728}
        res = web_testapp.put_json(
            "/api/v2/users/{}/allowed_space".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserEnableDisableEndpoints(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/v2/users/{user_id}/enabled
    and PUT /api/v2/users/{user_id}/disabled
    """

    def test_api_enable_user__ok_200__admin(self, user_api_factory, group_api_factory, web_testapp):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.disable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is False
        web_testapp.put_json("/api/v2/users/{}/enabled".format(user_id), status=204)
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True

    def test_api_disable_user__ok_200__admin(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True
        web_testapp.put_json("/api/v2/users/{}/disabled".format(user_id), status=204)
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is False

    def test_api_disable_user__err_400__cant_disable_myself_admin(self, admin_user, web_testapp):

        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True
        res = web_testapp.put_json("/api/v2/users/{}/disabled".format(user_id), status=400)
        assert res.json_body["code"] == ErrorCode.USER_CANT_DISABLE_HIMSELF
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body

        assert res["user_id"] == user_id
        assert res["is_active"] is True

    def test_api_enable_user__err_403__other_account(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.disable(test_user, do_save=True)
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        res = web_testapp.put_json("/api/v2/users/{}/enabled".format(user_id), status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api_disable_user__err_403__other_account(
        self, user_api_factory, group_api_factory, web_testapp
    ):

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test2",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        res = web_testapp.put_json("/api/v2/users/{}/disabled".format(user_id), status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api_disable_user__err_403__cant_disable_myself_user(
        self, user_api_factory, group_api_factory, web_testapp
    ):
        """
        Trying to disable himself as simple user, raise 403 because no
        right to disable anyone as simple user. (check of right is before
        self-disable not allowed_check).
        """

        uapi = user_api_factory.get()
        gapi = group_api_factory.get()
        groups = [gapi.get_one_with_name("users")]
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            groups=groups,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True
        res = web_testapp.put_json("/api/v2/users/{}/disabled".format(user_id), status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE
        # Check After
        res = web_testapp.get("/api/v2/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_ldap_test"}], indirect=True)
class TestUserEnpointsLDAPAuth(object):
    @pytest.mark.ldap
    def test_api_set_user_password__err__400__setting_password_unallowed_for_ldap_user(
        self, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        res = web_testapp.get("/api/v2/auth/whoami", status=200)
        user_id = res.json_body["user_id"]
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "professor",
        }
        res = web_testapp.put_json(
            "/api/v2/users/{}/password".format(user_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED

    @pytest.mark.ldap
    def test_api_set_user_email__err__400__setting_email_unallowed_for_ldap_user(self, web_testapp):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        res = web_testapp.get("/api/v2/auth/whoami", status=200)
        user_id = res.json_body["user_id"]
        # Set password
        params = {
            "email": "hubertnewemail@planetexpress.com",
            "loggedin_user_password": "professor",
        }
        res = web_testapp.put_json(
            "/api/v2/users/{}/email".format(user_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED

    @pytest.mark.ldap
    def test_api__create_user__ok_200__full_admin(
        self, web_testapp, user_api_factory, group_api_factory
    ):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        web_testapp.get("/api/v2/auth/whoami", status=200)
        api = user_api_factory.get(current_user=None)
        user = api.get_one_by_email("hubert@planetexpress.com")
        gapi = group_api_factory.get(current_user=user)
        api.update(
            user, auth_type=user.auth_type, groups=[gapi.get_one_with_name("administrators")]
        )
        api.save(user)
        transaction.commit()
        params = {
            "email": "test@test.test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/v2/users", status=200, params=params)
        res = res.json_body
        assert res["auth_type"] == "unknown"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["profile"] == "users"
