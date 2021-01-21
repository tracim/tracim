# -*- coding: utf-8 -*-
"""
Tests for /api/users subpath endpoints.
"""
import io
import typing

from PIL import Image
import pytest
import transaction
from webtest import TestApp

from tracim_backend import AuthType
from tracim_backend.error import ErrorCode
from tracim_backend.exceptions import EmailAlreadyExists
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import ContentApiFactory
from tracim_backend.tests.utils import UserApiFactory
from tracim_backend.tests.utils import WorkspaceApiFactory
from tracim_backend.tests.utils import create_1000px_png_test_image
from tracim_backend.tests.utils import create_png_test_image


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserRecentlyActiveContentEndpoint(object):
    """
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/contents/recently_active
    """

    def test_api__get_recently_active_content__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
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
        content_api_factory,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/recently_active".format(
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
            "/api/users/1/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
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
            "/api/users/1/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
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
            "/api/users/1/workspaces/{}/contents/recently_active".format(workspace.workspace_id),
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

    def test_api__get_read_status__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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
        url = "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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
        url = "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read
    """

    def test_api_set_content_as_read__ok__200__admin(
        self,
        admin_user,
        workspace_api_factory,
        user_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
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

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # read
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # read
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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

    def test_api_set_content_as_read__ok__403__other_user(
        self,
        workspace_api_factory,
        admin_user,
        user_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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
        # read
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
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

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is False
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

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread
    """

    def test_api_set_content_as_unread__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # before
        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=test_user.user_id, workspace_id=workspace.workspace_id
            ),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
                user_id=admin_user.user_id, workspace_id=workspace.workspace_id
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

        res = web_testapp.get(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/read_status".format(
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # unread
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        # unread
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
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
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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

    def test_api_set_content_as_unread__err__403__other_user(
        self,
        admin_user,
        workspace_api_factory,
        user_api_factory,
        role_api_factory,
        content_type_list,
        content_api_factory,
        web_testapp,
        session,
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

        # unread
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
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
            "/api/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=firstly_created.content_id,
                user_id=admin_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
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
            "/api/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
            status=200,
        )
        assert res.json_body[0]["content_id"] == firstly_created.content_id
        assert res.json_body[0]["read_by_user"] is True
        web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread".format(
                workspace_id=workspace.workspace_id,
                content_id=comments.content_id,
                user_id=admin_user.user_id,
            )
        )
        res = web_testapp.get(
            "/api/users/1/workspaces/{}/contents/read_status".format(workspace.workspace_id),
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

    def test_api_set_content_as_read__ok__200__admin(
        self,
        workspace_api_factory,
        content_type_list,
        user_api_factory,
        role_api_factory,
        session,
        content_api_factory,
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
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

    def test_api_set_content_as_read__ok__200__user_itself(
        self,
        workspace_api_factory,
        content_type_list,
        user_api_factory,
        role_api_factory,
        session,
        content_api_factory,
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

    def test_api_set_content_as_read__err__403__other_user(
        self,
        workspace_api_factory,
        content_type_list,
        user_api_factory,
        admin_user,
        role_api_factory,
        session,
        content_api_factory,
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
        res = web_testapp.put(
            "/api/users/{user_id}/workspaces/{workspace_id}/read".format(
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
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/notifications/activate
    """

    def test_api_enable_user_workspace_notification__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        role_api_factory,
        session,
        content_api_factory,
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
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/users/{user_id}/workspaces/{workspace_id}/notifications/activate".format(
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
        role_api_factory,
        session,
        content_api_factory,
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

    def test_api_enable_user_workspace_notification__err__403__other_user(
        self,
        workspace_api_factory,
        user_api_factory,
        role_api_factory,
        session,
        content_api_factory,
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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="boby",
            profile=profile,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/notifications/activate".format(
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
    Tests for /api/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate
    """

    def test_api_disable_user_workspace_notification__ok__200__admin(
        self,
        workspace_api_factory,
        user_api_factory,
        role_api_factory,
        session,
        content_api_factory,
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
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json(
            "/api/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate".format(
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
        role_api_factory,
        session,
        content_api_factory,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate".format(
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
        role_api_factory,
        session,
        content_api_factory,
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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="boby",
            profile=profile,
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
            "/api/users/{user_id}/workspaces/{workspace_id}/notifications/deactivate".format(
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
    Tests for /api/users/{user_id}/workspaces
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
        profile = Profile.ADMIN
        test_user = user_api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
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
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "1"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "0"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "0", "show_owned_workspace": "1"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "0", "show_owned_workspace": "0"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == set()

    def test_api__get_user_workspaces__ok_200__with_filter_and_parent_ids(
        self,
        workspace_api_factory,
        user_api_factory,
        admin_user,
        application_api_factory,
        web_testapp,
        role_api_factory,
    ):
        """
        Check the retrieval of all workspaces reachable by user with different filters
        """

        workspace_api = workspace_api_factory.get()
        owned_and_role_workspace = workspace_api.create_workspace(label="owned_and_role")
        owned_only_workspace = workspace_api.create_workspace(
            "owned_only", parent=owned_and_role_workspace
        )
        user_api = user_api_factory.get()
        user_api.create_user("toto@toto.toto", do_notify=False)
        profile = Profile.ADMIN
        test_user = user_api.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        workspace_api_test_user = workspace_api_factory.get(test_user)
        role_only_workspace = workspace_api_test_user.create_workspace(
            label="role_only", parent=owned_only_workspace
        )
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
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "1"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }
        params = {"show_workspace_with_role": "1", "show_owned_workspace": "1", "parent_ids": "0"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {owned_and_role_workspace.workspace_id}
        params = {
            "show_workspace_with_role": "1",
            "show_owned_workspace": "1",
            "parent_ids": role_only_workspace.workspace_id,
        }
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == set()

        params = {"show_workspace_with_role": "1", "show_owned_workspace": "0"}
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {
            role_only_workspace.workspace_id,
            owned_and_role_workspace.workspace_id,
        }
        parent_ids = ",".join(
            [str(role_only_workspace.workspace_id), str(owned_only_workspace.workspace_id)]
        )
        params = {
            "show_workspace_with_role": "1",
            "show_owned_workspace": "0",
            "parent_ids": parent_ids,
        }
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(admin_user.user_id), status=200, params=params
        )
        workspaces_ids = [workspace["workspace_id"] for workspace in res.json_body]
        assert set(workspaces_ids) == {role_only_workspace.workspace_id}

    def test_api__get_users_workspaces__ok_200__with_parent_ids_as_admin(
        self, workspace_api_factory, web_testapp, admin_user
    ):
        """
        Check the retrieval of all users workspaces reachable by user with user auth with explicit parent_ids
        """
        user = admin_user
        workspace_api = workspace_api_factory.get()
        parent1 = workspace_api.create_workspace("parent1")
        child1_1 = workspace_api.create_workspace("child1_1", parent=parent1)
        child1_2 = workspace_api.create_workspace("child1_2", parent=parent1)
        parent2 = workspace_api.create_workspace("parent2")
        child2_1 = workspace_api.create_workspace("child2_1", parent=parent2)
        workspace_api.create_workspace("child2_2", parent=parent2)
        grandson2_1_1 = workspace_api.create_workspace("grandson2_1_1", parent=child2_1)
        grandson1_2_2 = workspace_api.create_workspace("grandson1_2_1", parent=child1_2)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        implicit_all = web_testapp.get("/api/users/{}/workspaces".format(user.user_id), status=200)
        assert len(implicit_all.json_body) == 8

        parent_ids_list = [
            "0",
            parent1.workspace_id,
            parent2.workspace_id,
            child2_1.workspace_id,
            child1_2.workspace_id,
        ]
        parent_ids = ",".join([str(item) for item in parent_ids_list])
        explicit_all = web_testapp.get(
            "/api/users/{}/workspaces".format(user.user_id),
            status=200,
            params={"parent_ids": parent_ids},
        )
        assert explicit_all.json_body == implicit_all.json_body

        res = web_testapp.get(
            "/api/users/{}/workspaces".format(user.user_id),
            status=200,
            params={"parent_ids": child2_1.workspace_id},
        )
        assert len(res.json_body) == 1
        assert res.json_body[0]["workspace_id"] == grandson2_1_1.workspace_id

        res = web_testapp.get(
            "/api/users/{}/workspaces".format(user.user_id),
            status=200,
            params={"parent_ids": child1_2.workspace_id},
        )
        assert len(res.json_body) == 1
        assert res.json_body[0]["workspace_id"] == grandson1_2_2.workspace_id

        res = web_testapp.get(
            "/api/users/{}/workspaces".format(user.user_id), status=200, params={"parent_ids": "0"}
        )
        assert len(res.json_body) == 2
        assert res.json_body[0]["workspace_id"] == parent1.workspace_id
        assert res.json_body[1]["workspace_id"] == parent2.workspace_id

        parent_ids = parent1.workspace_id
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(user.user_id),
            status=200,
            params={"parent_ids": parent_ids},
        )
        assert len(res.json_body) == 2
        assert res.json_body[0]["workspace_id"] == child1_1.workspace_id
        assert res.json_body[1]["workspace_id"] == child1_2.workspace_id

        parent_ids = "0,{}".format(parent1.workspace_id)
        res = web_testapp.get(
            "/api/users/{}/workspaces".format(user.user_id),
            status=200,
            params={"parent_ids": parent_ids},
        )
        assert len(res.json_body) == 4
        # INFO - G.M - 2020-10-05 - workspace are sorted by label in this endpoint
        assert res.json_body[0]["workspace_id"] == child1_1.workspace_id
        assert res.json_body[1]["workspace_id"] == child1_2.workspace_id
        assert res.json_body[2]["workspace_id"] == parent1.workspace_id
        assert res.json_body[3]["workspace_id"] == parent2.workspace_id

    @pytest.mark.usefixtures("default_content_fixture")
    def test_api__get_user_workspaces__ok_200__nominal_case(
        self, workspace_api_factory, application_api_factory, web_testapp, app_config
    ):
        """
        Check obtain all workspaces reachables for user with user auth.
        """

        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.get_one(1)
        app_api = application_api_factory.get()

        default_sidebar_entry = app_api.get_default_workspace_menu_entry(
            workspace=workspace, app_config=app_config
        )  # nope8
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/users/1/workspaces", status=200)
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
        res = web_testapp.get("/api/users/1/workspaces", status=403)
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
        res = web_testapp.get("/api/users/1/workspaces", status=401)
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
        res = web_testapp.get("/api/users/5/workspaces", status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.USER_NOT_FOUND
        assert "message" in res.json.keys()
        assert "details" in res.json.keys()

    @pytest.mark.parametrize(
        "workspace_access_type, accessible_workspaces_count, user_credentials",
        [
            (WorkspaceAccessType.CONFIDENTIAL, 0, "foo@bar.par"),
            (WorkspaceAccessType.OPEN, 1, "foo@bar.par"),
            (WorkspaceAccessType.ON_REQUEST, 1, "foo@bar.par"),
            (WorkspaceAccessType.OPEN, 0, "admin@admin.admin"),
        ],
    )
    def test_api__get_accessible_workspaces__ok__200__nominal_cases(
        self,
        web_testapp,
        user_api_factory,
        workspace_api_factory,
        workspace_access_type,
        accessible_workspaces_count,
        user_credentials,
    ):
        """
        Check accessible spaces API with different nominal cases:
        - CONFIDENTIAL not in accessible
        - OPEN in accessible
        - ON_REQUEST in accessible
        - if user is member, space is not in accessible
        """
        with transaction.manager:
            uapi = user_api_factory.get()
            try:
                user = uapi.create_user(
                    email=user_credentials, password=user_credentials, do_notify=False
                )
            except EmailAlreadyExists:
                user = uapi.get_one_by_email(user_credentials)
            wapi = workspace_api_factory.get()
            wapi.create_workspace(
                label="Hello", description="Foo", access_type=workspace_access_type
            )

        web_testapp.authorization = ("Basic", (user_credentials, user_credentials))
        res = web_testapp.get(
            "/api/users/{}/accessible_workspaces".format(user.user_id), status=200
        )
        assert isinstance(res.json_body, list)
        assert len(res.json_body) == accessible_workspaces_count
        # only check label and workspace_id,
        # just to be sure to retrieve workspace like object
        assert not len(res.json_body) or set(res.json_body[0].keys()).issuperset(
            {"label", "workspace_id"}
        )

    def test_api__get_accessible_workspaces__ok__403__other_user(
        self, web_testapp, user_api_factory
    ):
        """
        Check that accessible workspaces of a given user is not authorized for another.
        """
        user_credentials = "foo@bar.par"
        with transaction.manager:
            uapi = user_api_factory.get()
            uapi.create_user(email=user_credentials, password=user_credentials, do_notify=False)

        web_testapp.authorization = ("Basic", (user_credentials, user_credentials))
        web_testapp.get("/api/users/1/accessible_workspaces", status=403)

    @pytest.mark.parametrize(
        "default_user_role", [WorkspaceRoles.READER, WorkspaceRoles.CONTRIBUTOR]
    )
    def test_api__join_workspace__ok_200__nominal_cases(
        self,
        workspace_api_factory,
        user_api_factory,
        web_testapp,
        app_config,
        default_user_role: WorkspaceRoles,
    ):
        """
        Join an open workspace.
        """
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            label="Foo", access_type=WorkspaceAccessType.OPEN, default_user_role=default_user_role
        )
        user_credentials = "john.doe@world.biz"
        user = user_api_factory.get().create_user(
            email=user_credentials, password=user_credentials, do_notify=False
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", (user_credentials, user_credentials))
        res = web_testapp.post_json(
            "/api/users/{}/workspaces".format(user.user_id),
            params={"workspace_id": workspace.workspace_id},
            status=200,
        )
        result = res.json_body
        assert result["workspace_id"] == workspace.workspace_id
        assert result["label"] == "Foo"
        member = web_testapp.get(
            "/api/workspaces/{}/members/{}".format(workspace.workspace_id, user.user_id), status=200
        ).json_body
        assert member["role"] == default_user_role.label

    @pytest.mark.parametrize(
        "access_type", [WorkspaceAccessType.ON_REQUEST, WorkspaceAccessType.CONFIDENTIAL]
    )
    def test_api__join_workspace__ok_400__wrong_access_type(
        self,
        workspace_api_factory,
        user_api_factory,
        web_testapp,
        app_config,
        access_type: WorkspaceAccessType,
    ):
        """
        Error cases for joining a workspace: not OPEN access type
        """
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(label="Foo", access_type=access_type)
        user_credentials = "john.doe@world.biz"
        user = user_api_factory.get().create_user(
            email=user_credentials, password=user_credentials, do_notify=False
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", (user_credentials, user_credentials))
        res = web_testapp.post_json(
            "/api/users/{}/workspaces".format(user.user_id),
            params={"workspace_id": workspace.workspace_id},
            status=400,
        )
        assert res.json_body["code"] == 1002


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_allowed_space_limitation"}], indirect=True
)
class TestUserEndpointWithAllowedSpaceLimitation(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/{user_id}
    """

    def test_api__get_user__ok_200__admin(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            username="boby",
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["username"] == "boby"
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
            "username": "testu",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["username"] == "testu"
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
    Tests for GET /api/users/{user_id}
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
        res = web_testapp.post_json("/api/users", status=200, params=params)
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
    Tests for GET /api/users/{user_id}/allowed_space
    """

    def test_api__get_user_disk_space__ok_200__admin(
        self, user_api_factory, web_testapp, workspace_api_factory
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
        user_id = int(test_user.user_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        web_testapp.post(
            "/api/workspaces/{}/files".format(workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=200,
        )
        res = web_testapp.get("/api/users/{}/disk_space".format(user_id), status=200)
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
    Tests for GET /api/users/{user_id}
    """

    def test_api__get_user__ok_200__admin(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            username="testu",
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["created"]
        assert res["is_active"] is True
        assert res["profile"] == "users"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "bob"
        assert res["username"] == "testu"
        assert res["timezone"] == "Europe/Paris"
        assert res["is_deleted"] is False
        assert res["lang"] == "fr"
        assert res["allowed_space"] == 0

    def test_api__get_user__ok_200__user_itself(self, user_api_factory, web_testapp):
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
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

    def test_api__get_user__err_403__other_normal_user(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
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
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        res = web_testapp.get("/api/users/{}".format(user_id), status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api__create_user__ok_200__full_admin(
        self, web_testapp, user_api_factory, event_helper
    ):
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
        res = web_testapp.post_json("/api/users", status=200, params=params)
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

        last_event = event_helper.last_event
        assert last_event.event_type == "user.created"
        assert last_event.fields["user"] == res
        assert last_event.fields["client_token"] is None
        author = web_testapp.get("/api/users/1", status=200).json_body
        assert last_event.fields["author"] == author

    @pytest.mark.parametrize("email_required,status", ((True, 400), (False, 200)))
    def test_api__create_user__with_only_username(
        self, web_testapp, user_api_factory, email_required, status
    ):
        web_testapp.app.registry.settings["CFG"].EMAIL__REQUIRED = email_required
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "username": "testu",
            "email_notification": False,
        }
        web_testapp.post_json("/api/users", status=status, params=params)

    def test_api__create_user__err_400__with_no_username_and_no_email(
        self, web_testapp, user_api_factory, app_config
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == 2001
        assert res["message"] == "Validation error of input data"

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
        res = web_testapp.post_json("/api/users", status=200, params=params)
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
        res = web_testapp.post_json("/api/users", status=200, params=params)
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
        res = web_testapp.post_json("/api/users", status=200, params=params)
        res = res.json_body
        assert res["user_id"]
        user_id = res["user_id"]
        assert res["email"] == "thisisanemailwithuppercasecharacters@test.test"
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
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
        res = web_testapp.post_json("/api/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == ErrorCode.EMAIL_ALREADY_EXISTS
        params = {
            "email": "THISISANEMAILWITHUPPERCASECHARACTERS@TEST.TEST",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == ErrorCode.EMAIL_ALREADY_EXISTS
        params = {
            "email": "ThisIsAnEmailWithUppercaseCharacters@Test.Test",
            "password": "mysuperpassword",
            "profile": "users",
            "timezone": "Europe/Paris",
            "lang": "fr",
            "public_name": "test user",
            "email_notification": False,
        }
        res = web_testapp.post_json("/api/users", status=400, params=params)
        res = res.json_body
        assert res["code"] == ErrorCode.EMAIL_ALREADY_EXISTS

    def test_api__create_user__ok_200__limited_admin(self, web_testapp, user_api_factory):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"email": "test@test.test", "email_notification": False, "password": None}
        res = web_testapp.post_json("/api/users", status=200, params=params)
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

    def test_api__update_user__ok_200__infos(self, web_testapp, user_api_factory, event_helper):
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
        res = web_testapp.post_json("/api/users", status=200, params=params).json_body
        user_id = res["user_id"]

        res = web_testapp.put_json(
            "/api/users/{}".format(user_id),
            status=200,
            params={"timezone": "Europe/London", "lang": "en", "public_name": "John Doe"},
        ).json_body
        assert res["timezone"] == "Europe/London"
        assert res["lang"] == "en"
        assert res["public_name"] == "John Doe"
        last_event = event_helper.last_event
        assert last_event.event_type == "user.modified"
        assert last_event.fields["user"]["public_name"] == "John Doe"

    def test_api__create_user__err_400__email_already_in_db(self, user_api_factory, web_testapp):
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
        res = web_testapp.post_json("/api/users", status=400, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EMAIL_ALREADY_EXISTS

    def test_api__create_user__err_403__other_user(self, user_api_factory, web_testapp):
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
        res = web_testapp.post_json("/api/users", status=403, params=params)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestUserWithNotificationEndpoint(object):
    """
    Tests for POST /api/users/{user_id}
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
        res = web_testapp.post_json("/api/users", status=200, params=params)
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
        assert headers["From"][0] == "Global manager via Tracim <test_user_from+1@localhost>"
        assert headers["To"][0] == "test user <test@test.test>"
        assert headers["Subject"][0] == "[Tracim] Created account"

    def test_api__create_user__ok_200__limited_admin_with_notif(
        self, web_testapp, user_api_factory, mailhog
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"email": "test@test.test", "email_notification": True}
        res = web_testapp.post_json("/api/users", status=200, params=params)
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
        assert headers["From"][0] == "Global manager via Tracim <test_user_from+1@localhost>"
        assert headers["To"][0] == "test <test@test.test>"
        assert headers["Subject"][0] == "[Tracim] Created account"

    def test_api_delete_user__ok_200__admin(sel, web_testapp, user_api_factory, event_helper):
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
        web_testapp.put("/api/users/{}/trashed".format(user_id), status=204)
        res = web_testapp.get("/api/users/{}".format(user_id), status=200).json_body
        assert res["is_deleted"] is True
        last_event = event_helper.last_event
        assert last_event.event_type == "user.deleted"

    def test_api_delete_user__err_400__admin_itself(self, web_testapp, admin_user):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.put("/api/users/{}/trashed".format(admin_user.user_id), status=400)
        assert res.json_body["code"] == ErrorCode.USER_CANT_DELETE_HIMSELF
        res = web_testapp.get("/api/users/{}".format(admin_user.user_id), status=200).json_body
        assert res["is_deleted"] is False


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUsersEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/{user_id}
    """

    def test_api__get_user__ok_200__admin(self, user_api_factory, web_testapp, admin_user):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            username="TheTestUSer",
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/users", status=200)
        res = res.json_body
        assert len(res) == 2
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

        assert res[1]["user_id"] == admin_user.user_id
        assert res[1]["public_name"] == admin_user.display_name
        assert res[1]["username"] == admin_user.username
        assert res[1]["avatar_url"] is None

    def test_api__get_user__err_403__normal_user(self, user_api_factory, web_testapp):
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

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users", status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestKnownMembersEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/{user_id}
    """

    def test_api__get_user__ok_200__admin__by_name(self, user_api_factory, admin_user, web_testapp):
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
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
        self, web_testapp, user_api_factory, admin_user
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_user_ids": str(test_user2.user_id)}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_workspace(
        self, user_api_factory, workspace_api_factory, admin_user, role_api_factory, web_testapp
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob", "exclude_workspace_ids": str(workspace2.workspace_id)}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_exclude_workspace_and_user(
        self, admin_user, user_api_factory, workspace_api_factory, role_api_factory, web_testapp
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "acp": "bob",
            "exclude_workspace_ids": str(workspace2.workspace_id),
            "exclude_user_ids": str(test_user3.user_id),
        }
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_name_include_workspace_and__exclude_user(
        self, admin_user, user_api_factory, workspace_api_factory, role_api_factory, web_testapp
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "acp": "bob",
            "include_workspace_ids": str(workspace.workspace_id),
            "exclude_user_ids": str(test_user3.user_id),
        }
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__known_members_fails_when_both_including_and_excluding_workspaces(
        self, admin_user, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=admin_user.user_id),
            status=400,
            params={
                "acp": "bob",
                "exclude_workspace_ids": str([1]),
                "include_workspace_ids": str([1]),
            },
        )

    def test_api__get_user__ok_200__admin__by_name__deactivated_members(
        self, user_api_factory, web_testapp, admin_user
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "bob"}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
        )
        res = res.json_body
        assert len(res) == 1
        assert res[0]["user_id"] == test_user.user_id
        assert res[0]["public_name"] == test_user.display_name
        assert res[0]["avatar_url"] is None

    def test_api__get_user__ok_200__admin__by_email(
        self, user_api_factory, admin_user, web_testapp
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "test"}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
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
        self, user_api_factory, admin_user, web_testapp
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
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"acp": "t"}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=400, params=params
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.ACP_STRING_TOO_SHORT

    def test_api__get_user__ok_200__normal_user_by_email(
        self, user_api_factory, workspace_api_factory, role_api_factory, web_testapp
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
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
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
    "config_section", [{"name": "test_known_member_filter_disabled"}], indirect=True
)
class TestKnownMembersEndpointKnownMembersFilterDisabled(object):
    # -*- coding: utf-8 -*-
    """
    Tests for GET /api/users/{user_id}
    """

    def test_api__get_user__ok_200__show_all_members(
        self, user_api_factory, workspace_api_factory, role_api_factory, web_testapp
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
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        params = {"acp": "test"}
        res = web_testapp.get(
            "/api/users/{user_id}/known_members".format(user_id=user_id), status=200, params=params
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
    Tests for PUT /api/users/{user_id}/email
    Tests for PUT /api/users/{user_id}/password

    for ldap user
    """

    def test_api__set_user_email__ok_200__ldap_user(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password=None,
            name="bob",
            profile=profile,
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=400)
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"
        assert res["auth_type"] == "ldap"

    def test_api__set_user_password_ldap__ok_200__admin(
        self, user_api_factory, web_testapp, session
    ):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password=None,
            auth_type=AuthType.LDAP,
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
        assert not user.validate_password("mynewpassword")
        session.close()
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "admin@admin.admin",
        }
        res = web_testapp.put_json(
            "/api/users/{}/password".format(user_id), params=params, status=400
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
    Tests for PUT /api/users/{user_id}/email
    """

    def test_api__set_user_email__ok_200__admin(self, user_api_factory, web_testapp):
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "admin@admin.admin"}
        web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "mysuperemail@email.fr"

    def test_api__set_user_email__err_400__admin_same_email(self, user_api_factory, web_testapp):
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "admin@admin.admin", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMAIL_ALREADY_EXISTS
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_user_email__err_403__admin_wrong_password(
        self, user_api_factory, web_testapp
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "badpassword"}
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_user_email__err_400__admin_string_is_not_email(
        self, user_api_factory, web_testapp
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "thatisnotandemail", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=400)
        # TODO - G.M - 2018-09-10 - Handled by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

    def test_api__set_user_email__ok_200__user_itself(self, user_api_factory, web_testapp):
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "test@test.test"

        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=200)
        web_testapp.authorization = ("Basic", ("mysuperemail@email.fr", "password"))
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["email"] == "mysuperemail@email.fr"

    def test_api__set_user_email__err_403__other_normal_user(self, user_api_factory, web_testapp):
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
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUsernameEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/{user_id}/username
    """

    def test_api__set_user_username__ok_200__admin(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ) -> None:
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert not res["username"]

        # Set username
        params = {"username": "MyHero", "loggedin_user_password": "admin@admin.admin"}
        web_testapp.put_json("/api/users/{}/username".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["username"] == "MyHero"

    def test_api__set_user_username__err_400__admin_already_exist_username(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ) -> None:
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            username="TheHero",
            password="password",
            email="boby@boba.fet",
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["username"] == "TheHero"

        # Set username
        params = {"username": "TheAdmin", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json(
            "/api/users/{}/username".format(user_id), params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.USERNAME_ALREADY_EXISTS
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["username"] == "TheHero"

    def test_api__set_user_username__err_403__admin_wrong_password(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ) -> None:
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert not res["username"]

        # Set password
        params = {"username": "TheTest", "loggedin_user_password": "badpassword"}
        res = web_testapp.put_json(
            "/api/users/{}/username".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WRONG_USER_PASSWORD
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert not res["username"]

    def test_api__set_user_username__err_400__admin_string_is_not_valid(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ) -> None:
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert not res["username"]

        # Set password
        params = {"username": "This is not correct", "loggedin_user_password": "admin@admin.admin"}
        res = web_testapp.put_json(
            "/api/users/{}/username".format(user_id), params=params, status=400
        )
        # TODO - G.M - 2018-09-10 - Handled by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INVALID_USERNAME_FORMAT
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert not res["username"]

    def test_api__set_user_username__ok_200__user_itself(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ) -> None:
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            username="TheTestUser",
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["username"] == "TheTestUser"

        # Set password
        params = {"username": "TheNewTestUser", "loggedin_user_password": "password"}
        web_testapp.put_json("/api/users/{}/username".format(user_id), params=params, status=200)
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["username"] == "TheNewTestUser"

    def test_api__set_user_username__err_403__other_normal_user(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ) -> None:
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
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set password
        params = {"username": "TheTestUserBis", "loggedin_user_password": "password"}
        res = web_testapp.put_json(
            "/api/users/{}/username".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetPasswordEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/{user_id}/password
    """

    def test_api__set_user_password__ok_200__admin(self, user_api_factory, web_testapp, session):
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
        session.close()
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "admin@admin.admin",
        }
        web_testapp.put_json("/api/users/{}/password".format(user_id), params=params, status=204)
        # Check After
        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert not user.validate_password("password")
        assert user.validate_password("mynewpassword")

    def test_api__set_user_password__err_403__admin_wrong_password(
        self, user_api_factory, web_testapp
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
        res = web_testapp.put_json(
            "/api/users/{}/password".format(user_id), params=params, status=403
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
        self, user_api_factory, web_testapp
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
        res = web_testapp.put_json(
            "/api/users/{}/password".format(user_id), params=params, status=400
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
        self, user_api_factory, web_testapp, session
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
        web_testapp.put_json("/api/users/{}/password".format(user_id), params=params, status=204)
        # Check After
        uapi = user_api_factory.get()
        user = uapi.get_one(user_id)
        assert not user.validate_password("password")
        assert user.validate_password("mynewpassword")

    def test_api__set_user_email__err_403__other_normal_user(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            lang="fr",
            timezone="Europe/Paris",
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
        uapi.save(test_user2)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test2@test2.test2", "password"))
        # Set password
        params = {"email": "mysuperemail@email.fr", "loggedin_user_password": "password"}
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserInfoEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/{user_id}
    """

    def test_api__set_user_info__ok_200__admin(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            username="boby",
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "bob"
        assert res["username"] == "boby"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        # Set params
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        web_testapp.put_json("/api/users/{}".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "updated"
        assert res["username"] == "boby"
        assert res["timezone"] == "Europe/London"
        assert res["lang"] == "en"

    def test_api__set_user_info__ok_200__user_itself(self, user_api_factory, web_testapp):
        uapi = user_api_factory.get()

        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            username="boby",
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "bob"
        assert res["username"] == "boby"
        assert res["timezone"] == "Europe/Paris"
        assert res["lang"] == "fr"
        # Set params
        params = {"public_name": "updated", "timezone": "Europe/London", "lang": "en"}
        web_testapp.put_json("/api/users/{}".format(user_id), params=params, status=200)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["public_name"] == "updated"
        assert res["username"] == "boby"
        assert res["timezone"] == "Europe/London"
        assert res["lang"] == "en"

    def test_api__set_user_info__err_403__other_normal_user(self, user_api_factory, web_testapp):
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
            name="test",
            profile=profile,
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
        res = web_testapp.put_json("/api/users/{}".format(user_id), params=params, status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserProfileEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/{user_id}/profile
    """

    def test_api__set_user_profile__ok_200__admin(self, user_api_factory, web_testapp):
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["profile"] == "users"
        # Set params
        params = {"profile": "administrators"}
        web_testapp.put_json("/api/users/{}/profile".format(user_id), params=params, status=204)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
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
        res = web_testapp.get("/api/users/{}".format(admin_user.user_id), status=200)
        res = res.json_body
        assert res["user_id"] == admin_user.user_id
        assert res["profile"] == "administrators"
        # Set params
        params = {"profile": "users"}
        res = web_testapp.put_json(
            "/api/users/{}/profile".format(admin_user.user_id), params=params, status=400
        )
        assert res.json_body["code"] == ErrorCode.USER_CANT_CHANGE_IS_OWN_PROFILE
        # Check After
        res = web_testapp.get("/api/users/{}".format(admin_user.user_id), status=200)
        res = res.json_body
        assert res["user_id"] == admin_user.user_id
        assert res["profile"] == "administrators"

    def test_api__set_user_profile__err_403__other_normal_user(self, user_api_factory, web_testapp):
        """
        Set user profile of user normal user as normal user
        Return 403 error because of no right to do this as simple user
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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test",
            profile=profile,
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
            "/api/users/{}/profile".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserAllowedSpaceEndpoint(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/{user_id}/allowed_space
    """

    def test_api__set_user_allowed_space__ok_200__admin(self, user_api_factory, web_testapp):
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
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["allowed_space"] == 0
        # Set params
        params = {"allowed_space": 134217728}
        web_testapp.put_json(
            "/api/users/{}/allowed_space".format(user_id), params=params, status=204
        )
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["allowed_space"] == 134217728

    def test_api__set_user_allowed_space__err_403__other_normal_user(
        self, user_api_factory, web_testapp
    ):
        """
        Set user allowed_space of user normal user as normal user
        Return 403 error because of no right to do this as simple user
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
        test_user2 = uapi.create_user(
            email="test2@test2.test2",
            password="password",
            name="test",
            profile=profile,
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
            "/api/users/{}/allowed_space".format(user_id), params=params, status=403
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestSetUserEnableDisableEndpoints(object):
    # -*- coding: utf-8 -*-
    """
    Tests for PUT /api/users/{user_id}/enabled
    and PUT /api/users/{user_id}/disabled
    """

    def test_api_enable_user__ok_200__admin(self, user_api_factory, web_testapp):
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
        uapi.disable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is False
        web_testapp.put_json("/api/users/{}/enabled".format(user_id), status=204)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True

    def test_api_disable_user__ok_200__admin(self, user_api_factory, web_testapp):
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
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True
        web_testapp.put_json("/api/users/{}/disabled".format(user_id), status=204)
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is False

    def test_api_disable_user__err_400__cant_disable_myself_admin(self, admin_user, web_testapp):
        user_id = int(admin_user.user_id)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        # check before
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True
        res = web_testapp.put_json("/api/users/{}/disabled".format(user_id), status=400)
        assert res.json_body["code"] == ErrorCode.USER_CANT_DISABLE_HIMSELF
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body

        assert res["user_id"] == user_id
        assert res["is_active"] is True

    def test_api_enable_user__err_403__other_account(self, user_api_factory, web_testapp):
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
            name="test2",
            profile=profile,
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
        res = web_testapp.put_json("/api/users/{}/enabled".format(user_id), status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api_disable_user__err_403__other_account(self, user_api_factory, web_testapp):
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
            name="test2",
            profile=profile,
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
        res = web_testapp.put_json("/api/users/{}/disabled".format(user_id), status=403)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE

    def test_api_disable_user__err_403__cant_disable_myself_user(
        self, user_api_factory, web_testapp
    ):
        """
        Trying to disable himself as simple user, raise 403 because no
        right to disable anyone as simple user. (check of right is before
        self-disable not allowed_check).
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
        uapi.enable(test_user, do_save=True)
        uapi.save(test_user)
        transaction.commit()
        user_id = int(test_user.user_id)

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        # check before
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
        res = res.json_body
        assert res["user_id"] == user_id
        assert res["is_active"] is True
        res = web_testapp.put_json("/api/users/{}/disabled".format(user_id), status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_PROFILE
        # Check After
        res = web_testapp.get("/api/users/{}".format(user_id), status=200)
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
        res = web_testapp.get("/api/auth/whoami", status=200)
        user_id = res.json_body["user_id"]
        # Set password
        params = {
            "new_password": "mynewpassword",
            "new_password2": "mynewpassword",
            "loggedin_user_password": "professor",
        }
        res = web_testapp.put_json(
            "/api/users/{}/password".format(user_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED

    @pytest.mark.ldap
    def test_api_set_user_email__err__400__setting_email_unallowed_for_ldap_user(self, web_testapp):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        res = web_testapp.get("/api/auth/whoami", status=200)
        user_id = res.json_body["user_id"]
        # Set password
        params = {
            "email": "hubertnewemail@planetexpress.com",
            "loggedin_user_password": "professor",
        }
        res = web_testapp.put_json("/api/users/{}/email".format(user_id), params=params, status=400)
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED

    @pytest.mark.ldap
    def test_api__create_user__ok_200__full_admin(self, web_testapp, user_api_factory):
        web_testapp.authorization = ("Basic", ("hubert@planetexpress.com", "professor"))
        web_testapp.get("/api/auth/whoami", status=200)
        api = user_api_factory.get(current_user=None)
        user = api.get_one_by_email("hubert@planetexpress.com")
        api.update(user, auth_type=user.auth_type, profile=Profile.ADMIN)
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
        res = web_testapp.post_json("/api/users", status=200, params=params)
        res = res.json_body
        assert res["auth_type"] == "unknown"
        assert res["email"] == "test@test.test"
        assert res["public_name"] == "test user"
        assert res["profile"] == "users"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserFollowerEndpoint(object):
    """
    Tests for GET /api/users/{user_id}/following and /api/users/{user_id}/followers
    """

    def test_api__create_follower__ok_201__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
    ) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.post_json(
            "/api/users/{user_id}/following".format(user_id=admin_user.user_id),
            params={"user_id": bob_user.user_id},
            status=201,
        )

    def test_api__create_follower__ok_400__already_exist(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
    ) -> None:
        # With
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.post_json(
            "/api/users/{user_id}/following".format(user_id=admin_user.user_id),
            params={"user_id": bob_user.user_id},
            status=201,
        )

        # When
        res = web_testapp.post_json(
            "/api/users/{user_id}/following".format(user_id=admin_user.user_id),
            params={"user_id": bob_user.user_id},
            status=400,
        )

        # Then
        assert res.json_body["code"] == ErrorCode.USER_FOLLOW_ALREADY_DEFINED

    def test_api__create_follower__ok_201__on_himself(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        bob_user: User,
        riyad_user: User,
    ) -> None:
        # user can set following on himself
        web_testapp.authorization = ("Basic", ("bob@test.test", "password"))
        web_testapp.post_json(
            "/api/users/{user_id}/following".format(user_id=bob_user.user_id),
            params={"user_id": riyad_user.user_id},
            status=201,
        )

    def test_api__create_follower__error_403__on_other_user(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        bob_user: User,
        riyad_user: User,
    ) -> None:
        # user can set following on himself
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        web_testapp.post_json(
            "/api/users/{user_id}/following".format(user_id=bob_user.user_id),
            params={"user_id": riyad_user.user_id},
            status=403,
        )

    def test_api__get_user_following__ok_200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
    ) -> None:
        # With
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=admin_user.user_id, leader_id=bob_user.user_id)
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/following".format(user_id=admin_user.user_id), status=200
        )

        # Then
        res = res.json_body
        assert res["per_page"] == 10
        assert res["has_previous"] is False
        assert res["has_next"] is False
        assert res["previous_page_token"] == "<i:2"
        assert res["next_page_token"] == ">i:2"
        assert res["items"]
        assert len(res["items"]) == 1
        assert res["items"][0] == {"user_id": bob_user.user_id}

    def test_api__get_user_following__ok_200__filter_on_user_id(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
        riyad_user: User,
    ) -> None:
        # With
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=admin_user.user_id, leader_id=bob_user.user_id)
        user_api.create_follower(follower_id=admin_user.user_id, leader_id=riyad_user.user_id)
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/following?user_id={followed_id}".format(
                user_id=admin_user.user_id, followed_id=riyad_user.user_id
            ),
            status=200,
        )

        # Then
        res = res.json_body
        assert res["per_page"] == 10
        assert res["has_previous"] is False
        assert res["has_next"] is False
        assert res["previous_page_token"] == "<i:3"
        assert res["next_page_token"] == ">i:3"
        assert res["items"]
        assert len(res["items"]) == 1
        assert res["items"][0] == {"user_id": riyad_user.user_id}

    def test_api__get_user_following__ok_200__pagination(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp, admin_user: User
    ) -> None:
        # With
        user_api = user_api_factory.get()
        users_to_follow: typing.List[User] = []
        for i in range(10):
            users_to_follow.append(
                user_api_factory.get().create_user(
                    email="user{i}@test.test".format(i=i),
                    username="riyad{i}".format(i=i),
                    password="password",
                    name="riyad{i}".format(i=i),
                    profile=Profile.USER,
                    timezone="Europe/Paris",
                    lang="fr",
                    do_save=True,
                    do_notify=False,
                )
            )
            user_api.create_follower(
                follower_id=admin_user.user_id, leader_id=users_to_follow[-1].user_id
            )
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/following?count=5".format(user_id=admin_user.user_id), status=200
        )

        # Then
        res = res.json_body
        assert res["per_page"] == 5
        assert res["has_previous"] is False
        assert res["has_next"] is True
        assert res["previous_page_token"] == "<i:2"
        assert res["next_page_token"] == ">i:6"
        assert res["items"]
        assert len(res["items"]) == 5

    def test_api__get_user_following__various__access(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
        riyad_user: User,
    ) -> None:
        # With bob follow riyad
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=bob_user.user_id, leader_id=riyad_user.user_id)
        transaction.commit()

        # When admin read api it is ok
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.get(
            "/api/users/{user_id}/following".format(user_id=bob_user.user_id), status=200
        )

        # When bob read api it is ok
        web_testapp.authorization = ("Basic", ("bob@test.test", "password"))
        web_testapp.get(
            "/api/users/{user_id}/following".format(user_id=bob_user.user_id), status=200
        )

        # When riyad read api it is forbidden
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        web_testapp.get(
            "/api/users/{user_id}/following".format(user_id=bob_user.user_id), status=403
        )

    def test_api__delete_follower__ok_201__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
    ) -> None:
        # With
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.post_json(
            "/api/users/{user_id}/following".format(user_id=admin_user.user_id),
            params={"user_id": bob_user.user_id},
            status=201,
        )

        # When Then
        web_testapp.delete(
            "/api/users/{user_id}/following/{leader_id}".format(
                user_id=admin_user.user_id, leader_id=bob_user.user_id
            ),
            status=204,
        )

    def test_api__delete_follower__err_400__not_found(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
    ) -> None:
        # When Then
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.delete(
            "/api/users/{user_id}/following/{leader_id}".format(
                user_id=admin_user.user_id, leader_id=bob_user.user_id
            ),
            status=400,
        )

    def test_api__get_user_followers__ok_200__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
    ) -> None:
        # With
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=admin_user.user_id, leader_id=bob_user.user_id)
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/followers".format(user_id=bob_user.user_id), status=200
        )

        # Then
        res = res.json_body
        assert res["per_page"] == 10
        assert res["has_previous"] is False
        assert res["has_next"] is False
        assert res["previous_page_token"] == "<i:1"
        assert res["next_page_token"] == ">i:1"
        assert res["items"]
        assert len(res["items"]) == 1
        assert res["items"][0] == {"user_id": admin_user.user_id}

    def test_api__get_user_followers__ok_200__filter_on_user_id(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
        riyad_user: User,
    ) -> None:
        # With
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=admin_user.user_id, leader_id=bob_user.user_id)
        user_api.create_follower(follower_id=riyad_user.user_id, leader_id=bob_user.user_id)
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/followers?user_id={follower_id}".format(
                user_id=bob_user.user_id, follower_id=riyad_user.user_id
            ),
            status=200,
        )

        # Then
        res = res.json_body
        assert res["per_page"] == 10
        assert res["has_previous"] is False
        assert res["has_next"] is False
        assert res["previous_page_token"] == "<i:3"
        assert res["next_page_token"] == ">i:3"
        assert res["items"]
        assert len(res["items"]) == 1
        assert res["items"][0] == {"user_id": riyad_user.user_id}

    def test_api__get_user_followers__ok_200__pagination(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp, admin_user: User
    ) -> None:
        # With
        user_api = user_api_factory.get()
        users_followers: typing.List[User] = []
        for i in range(10):
            users_followers.append(
                user_api_factory.get().create_user(
                    email="user{i}@test.test".format(i=i),
                    username="riyad{i}".format(i=i),
                    password="password",
                    name="riyad{i}".format(i=i),
                    profile=Profile.USER,
                    timezone="Europe/Paris",
                    lang="fr",
                    do_save=True,
                    do_notify=False,
                )
            )
            user_api.create_follower(
                follower_id=users_followers[-1].user_id, leader_id=admin_user.user_id
            )
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/followers?count=5".format(user_id=admin_user.user_id), status=200
        )

        # Then
        res = res.json_body
        assert res["per_page"] == 5
        assert res["has_previous"] is False
        assert res["has_next"] is True
        assert res["previous_page_token"] == "<i:2"
        assert res["next_page_token"] == ">i:6"
        assert res["items"]
        assert len(res["items"]) == 5

    def test_api__get_user_followers__various__access(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
        riyad_user: User,
    ) -> None:
        # With bob follow riyad
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=bob_user.user_id, leader_id=riyad_user.user_id)
        transaction.commit()

        # When admin read api it is ok
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.get(
            "/api/users/{user_id}/followers".format(user_id=riyad_user.user_id), status=200
        )

        # When riyad read api it is forbidden
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        web_testapp.get(
            "/api/users/{user_id}/followers".format(user_id=riyad_user.user_id), status=200
        )

        # When bob read api it is ok
        web_testapp.authorization = ("Basic", ("bob@test.test", "password"))
        web_testapp.get(
            "/api/users/{user_id}/followers".format(user_id=riyad_user.user_id), status=403
        )


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestAboutUserEndpoint(object):
    """
    Tests for GET /api/users/{user_id}/about
    """

    def test_api__get_about_user__ok__nominal_case(
        self,
        user_api_factory: UserApiFactory,
        content_api_factory: ContentApiFactory,
        workspace_api_factory: WorkspaceApiFactory,
        web_testapp: TestApp,
        admin_user: User,
        bob_user: User,
        riyad_user: User,
        session: TracimSession,
        content_type_list: typing.List[str],
    ) -> None:
        # With
        user_api = user_api_factory.get()
        user_api.create_follower(follower_id=bob_user.user_id, leader_id=admin_user.user_id)
        user_api.create_follower(follower_id=riyad_user.user_id, leader_id=admin_user.user_id)
        user_api.create_follower(follower_id=admin_user.user_id, leader_id=riyad_user.user_id)
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        content_api = content_api_factory.get()
        content_api.create(
            content_type_list.Page.slug, workspace, None, "creation_order_test", "", True
        )
        content = content_api.create(
            content_type_list.Page.slug, workspace, None, "another creation_order_test", "", True,
        )
        with new_revision(session=session, tm=transaction.manager, content=content):
            content.description = "Just an update"
        content_api.save(content)
        transaction.commit()

        # When
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{user_id}/about".format(user_id=admin_user.user_id), status=200
        )

        # Then
        assert res.json_body["leaders_count"] == 1
        assert res.json_body["followers_count"] == 2
        assert res.json_body["public_name"] == admin_user.public_name
        assert res.json_body["username"] == admin_user.username
        assert res.json_body["authored_content_revisions_count"] == 3
        assert res.json_body["authored_content_revisions_space_count"] == 1

    def test_api__get_about_user__err_user_not_existing(self, web_testapp: TestApp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/users/2/about", status=400)
        assert res.json_body["code"] == ErrorCode.USER_NOT_FOUND

    def test_api__get_about_user__err_user_not_known(
        self, admin_user: User, web_testapp: TestApp, riyad_user: User
    ) -> None:
        web_testapp.authorization = ("Basic", (riyad_user.email, "password"))
        res = web_testapp.get("/api/users/{}/about".format(admin_user.user_id), status=400)
        assert res.json_body["code"] == ErrorCode.USER_NOT_FOUND


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserAvatarEndpoints:
    """
    Tests for /api/users/{user_id}/avatar endpoints
    """

    def test_api__get_user_avatar__ok_200__nominal_case(self, admin_user: User, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{}/avatar/raw/something.jpg".format(admin_user.user_id), status=400
        )
        image = create_1000px_png_test_image()
        web_testapp.put(
            "/api/users/{}/avatar/raw/{}".format(admin_user.user_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/users/{}/avatar/raw/{}".format(admin_user.user_id, image.name), status=200,
        )
        assert res.body == image.getvalue()
        assert res.content_type == "image/png"
        new_image = Image.open(io.BytesIO(res.body))
        assert 1000, 1000 == new_image.size

    def test_api__get_user_avatar__err_400__no_avatar(self, admin_user: User, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{}/avatar/raw/something.jpg".format(admin_user.user_id), status=400
        )
        assert res.json_body["code"] == ErrorCode.USER_AVATAR_NOT_FOUND

    def test_api__set_user_avatar__ok__nominal_case(self, admin_user: User, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        web_testapp.put(
            "/api/users/{}/avatar/raw/{}".format(admin_user.user_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        transaction.commit()
        assert admin_user.avatar is not None
        assert admin_user.cropped_avatar is not None

    def test_api__set_user_avatar__err__no_file(self, admin_user: User, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        res = web_testapp.put(
            "/api/users/{}/avatar/raw/{}".format(admin_user.user_id, image.name),
            upload_files=[],
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.NO_FILE_VALIDATION_ERROR

    def test_api__set_user_avatar__err__wrong_mimetype(self, admin_user: User, web_testapp):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        image.name = "test.ogg"  # we say the content we give is ogg.
        res = web_testapp.put(
            "/api/users/{}/avatar/raw/{}".format(admin_user.user_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.MIMETYPE_NOT_ALLOWED

    def test_api__get_user_avatar_preview__ok__nominal_case(self, admin_user: User, web_testapp):
        """
        get 256x256 preview of a avatar
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/users/{}/avatar/preview/jpg/256x256/something.jpg".format(admin_user.user_id),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.USER_AVATAR_NOT_FOUND

        image = create_png_test_image(500, 100)
        web_testapp.put(
            "/api/users/{}/avatar/raw/{}".format(admin_user.user_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        ),

        res = web_testapp.get(
            "/api/users/{}/avatar/preview/jpg/256x256/{}".format(admin_user.user_id, "image.jpg"),
            status=200,
        )
        assert res.body != image.getvalue()
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

        res2 = web_testapp.get(
            "/api/users/{}/avatar/preview/jpg/{}".format(admin_user.user_id, "image.jpg"),
            status=200,
        )
        assert res2.body == res.body
        assert res2.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res2.body))
        assert 256, 256 == new_image.size
