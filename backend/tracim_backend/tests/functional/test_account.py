# -*- coding: utf-8 -*-
"""
Tests for /api/users subpath endpoints.
"""

import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import create_1000px_png_test_image


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountRecentlyActiveContentEndpoint(object):
    """
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/contents/recently_active
    """

    def test_api__get_recently_active_content__ok__200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)

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
            "/api/users/me/workspaces/{workspace_id}/contents/recently_active".format(
                workspace_id=workspace.workspace_id
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

    def test_api__get_recently_active_content__ok__200__limit_2_multiple(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
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
            "/api/users/me/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
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
            "/api/users/me/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
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
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
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
            "/api/users/me/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
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
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/contents/read_status
    """

    def test_api__get_read_status__ok__200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
        workspace2 = workspace_api_factory.get().create_workspace("test workspace2", save_now=True)
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
        url = "/api/users/me/workspaces/{workspace_id}/contents/read_status".format(
            workspace_id=workspace.workspace_id
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


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSetContentAsRead(object):
    """
    Tests for /api/users/me/workspaces/{workspace_id}/contents/{content_id}/read
    """

    def test_api_set_content_as_read__ok__200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        # read
        web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSetContentAsUnread(object):
    """
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread
    """

    def test_api_set_content_as_unread__ok__200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        # unread
        web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        # after
        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserSetWorkspaceAsRead(object):
    """
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/read
    """

    def test_api_set_content_as_read__ok__200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
        assert res.json_body[1]["content_id"] == main_folder.content_id
        assert res.json_body[1]["read_by_user"] is False
        web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/read".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=test_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        assert res.json_body[1]["content_id"] == main_folder.content_id
        assert res.json_body[1]["read_by_user"] is True


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountEnableWorkspaceNotification(object):
    """
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/notifications/activate
    """

    def test_api_enable_account_workspace_notification__ok__200__user_nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
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
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=False)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False
        session.close()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/users/{user_id}/workspaces/{workspace_id}/notifications/activate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=204,
        )
        rapi = role_api_factory.get()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountDisableWorkspaceNotification(object):
    """
    Tests for /api/users/me/workspaces/{workspace_id}/notifications/deactivate
    """

    def test_api_enable_account_workspace_notification__ok__200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        # init DB

        workspace = workspace_api_factory.get().create_workspace("test workspace", save_now=True)
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
        rapi = role_api_factory.get()
        rapi.create_one(test_user, workspace, UserRoleInWorkspace.READER, with_notif=True)
        transaction.commit()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is True
        session.close()
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/users/me/workspaces/{workspace_id}/notifications/deactivate".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=204,
        )
        rapi = role_api_factory.get()
        role = rapi.get_one(test_user.user_id, workspace.workspace_id)
        assert role.do_notify is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountWorkspaceEndpoint(object):
    """
    Tests for /api/users/me/workspaces
    """

    def test_api__get_user_workspaces__ok_200__with_filter(
        self,
        workspace_api_factory,
        user_api_factory,
        admin_user,
        application_api_factory,
        web_testapp,
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

        test_user = user_api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=Profile.ADMIN,
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
        res = web_testapp.get("/api/users/me/workspaces", status=200, params=params)
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "1"}
        res = web_testapp.get("/api/users/me/workspaces", status=200, params=params)
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "0"}
        res = web_testapp.get("/api/users/me/workspaces", status=200, params=params)
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "0", "show_owned_workspace": "1"}
        res = web_testapp.get("/api/users/me/workspaces", status=200, params=params)
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "0", "show_owned_workspace": "0"}
        res = web_testapp.get("/api/users/me/workspaces", status=200, params=params)
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == set()

    @pytest.mark.usefixtures("default_content_fixture")
    def test_api__get_account_workspaces__ok_200__nominal_case(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        application_api_factory,
        content_type_list,
        session,
        web_testapp,
        app_config,
    ):
        """
        Check obtain all workspaces reachables for user with user auth.
        """

        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.get_one(1)
        app_api = application_api_factory.get()

        default_sidebar_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/users/me/workspaces", status=200)
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


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_allowed_space_limitation"}], indirect=True
)
class TestAccountDiskSpaceEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/me/disk_space
    """

    def test_api__get_user_disk_space__ok_200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="test@test.test",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        workspace_api = workspace_api_factory.get(current_user=test_user, show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        transaction.commit()
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.post(
            "/api/workspaces/{}/files".format(workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=200,
        )
        res = web_testapp.get("/api/users/me/disk_space", status=200)
        res = res.json_body
        assert res["used_space"] == 6210
        assert res["user"]["public_name"] == "bob"
        assert res["user"]["avatar_url"] is None
        assert res["allowed_space"] == 134217728


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/me
    """

    def test_api__get_user__ok_200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["is_deleted"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_known_member_filter_disabled"}], indirect=True
)
class TestAccountKnownMembersEndpointKnownMembersFilterDisabled(object):
    def test_api__get_user__ok_200__show_all_members(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            profile=profile,
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
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
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
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAccountKnownMembersEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/me
    """

    def test_api__get_user__ok_200__admin__by_name(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_user(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_user_ids": str(test_user2.user_id)}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_workspace(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
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
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_workspace_ids": str(workspace2.workspace_id)}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_workspace_and_user(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            profile=profile,
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
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "acp": "bob",
            "exclude_workspace_ids": str(workspace2.workspace_id),
            "exclude_user_ids": str(test_user3.user_id),
        }
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name__deactivated_members(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user2.is_active = False
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_email(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        uapi.save(test_user2)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "test"}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None

    def test_api__get_user__err_403__admin__too_small_acp(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
    ):

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
        uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        uapi.save(test_user)
        transaction.commit()
        int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "t"}
        res = web_testapp.get("/api/users/me/known_members", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__get_user__ok_200__normal_user_by_email(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="bob2",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        test_user3 = uapi.create_user(
            email="test3@test3.test3",
            password="password",
            name="bob3",
            profile=profile,
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
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get("/api/users/me/known_members", status=200, params=params)
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == test_user2.user_id
        assert res[1]["public_name"] == test_user2.display_name
        assert res[1]["avatar_url"] is None


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_ldap_and_internal_test"}], indirect=True
)
class TestAccountSetPasswordEmailLDAPAuthEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/me/email
    Tests for PUT /api/users/me/password
    for ldap user
    """

    @pytest.mark.ldap
    def test_api_set_account_password__err__400__setting_password_unallowed_for_ldap_user(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        user_id = res.json_body["user_id"]
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "professor",
        }
        res = web_testapp.put_json("/api/users/me/password", params=params, status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED

        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "hubert@planetexpress.com"
        assert res["auth_type"] == "ldap"

    @pytest.mark.ldap
    def test_api_set_account_email__err__400__setting_email_unallowed_for_ldap_user(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        user_id = res.json_body["user_id"]
        # Set password
        params = {
            "email": "hubertnewemail@planetexpress.com",
            "loggedin_user_password": "professor",
        }
        res = web_testapp.put_json("/api/users/me/email", params=params, status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED

        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "hubert@planetexpress.com"
        assert res["auth_type"] == "ldap"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetEmailEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/me/email
    """

    def test_api__set_account_email__err_400__admin_same_email(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        uapi.save(test_user)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "admin@admin.admin", "loggedin_user_password": "password"}
        res = web_testapp.put_json("/api/users/me/email", params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMAIL_ALREADY_EXIST_IN_DB
        # Check After
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_account_email__err_403__admin_wrong_password(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        uapi.save(test_user)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "badpassword"}
        res = web_testapp.put_json("/api/users/me/email", params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD
        # Check After
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_account_email__ok_200__user_nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        uapi.save(test_user)
        transaction.commit()
        int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        web_testapp.put_json("/api/users/me/email", params=params, status=200)
        web_testapp.authorization = ("Basic", ("mysuperemail@email.fr", "password"))
        # Check After
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["email"] == "mysuperemail@email.fr"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetPasswordEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/me/password
    """

    def test_api__set_account_password__err_403__admin_wrong_password(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        res = web_testapp.put_json("/api/users/me/password", params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD

        uapi = user_api_factory.get()
        # Check After
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")

    def test_api__set_account_password__err_400__admin_passwords_do_not_match(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        res = web_testapp.put_json("/api/users/me/password", params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.PASSWORD_DO_NOT_MATCH
        # Check After

        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert user.validate_password("password")
        assert not user.validate_password("mynewpassword")
        assert not user.validate_password("mynewpassword2")

    def test_api__set_account_password__ok_200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        web_testapp.put_json("/api/users/me/password", params=params, status=204)
        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert not user.validate_password("password")
        assert user.validate_password("mynewpassword")


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserInfoEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/me
    """

    def test_api__set_account_info__ok_200__nominal(
        self,
        workspace_api_factory,
        user_api_factory,
        content_api_factory,
        role_api_factory,
        content_type_list,
        session,
        web_testapp,
    ):

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
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "bob"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        # Set params
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        web_testapp.put_json("/api/users/me", params=params, status=200)
        # Check After
        res = web_testapp.get("/api/users/me", status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "updated"
        assert res["timezone"] == "Europe/London"
        assert res["lang"] == "en"
