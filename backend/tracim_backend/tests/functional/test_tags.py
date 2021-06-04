# -*- coding: utf-8 -*-
import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.lib.core.tag import TagLib
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40

TAG_URLS = (
    "/api/workspaces/{workspace_id}/contents/{content_id}/tags",
    "/api/workspaces/{workspace_id}/tags",
)

SAMPLE_TAG_LIST = (
    "mytag",
    "simple_tag",
    "a tag",
    "🐧",
    "another\ntag",
    "*",
    "!",
    ";",
    "/salut",
    "🐻‍❄️",
    "👨‍👨‍👧‍👧",
)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestTagsEndpoint(object):
    """
    Tests for /api/workspaces/{workspace_id}/(content/{content_id}/)tags
    endpoint
    """

    @pytest.mark.parametrize(
        "tag_names", [(SAMPLE_TAG_LIST)],
    )
    def test_api__get_contents_tags__ok_200__nominal_case(
        self,
        web_testapp,
        session,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        admin_user,
        tag_names,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        tag_lib = TagLib(session)
        for tag in tag_names:
            tag_lib.add_tag_to_content(admin_user, folder, tag, do_save=True)
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        for url in TAG_URLS:
            res = web_testapp.get(
                url.format(workspace_id=test_workspace.workspace_id, content_id=folder.content_id),
                status=200,
            )
            assert len(res.json_body) == len(tag_names)
            tags = iter(res.json_body)
            for tag_name in tag_names:
                tag_res = next(tags)
                assert tag_res["tag_name"] == tag_name

    @pytest.mark.parametrize(
        "tag_name", SAMPLE_TAG_LIST,
    )
    def test_api__get_one_tag__ok_200__nominal_case(
        self,
        web_testapp,
        session,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        tag_name,
    ) -> None:
        """
        Get one specific tag
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        tag_lib = TagLib(session)
        tag = tag_lib.add_tag_to_content(riyad_user, folder, tag_name, do_save=True)
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id, tag_id=tag.tag_id,
            ),
            status=200,
        )

        tag_res = res.json_body
        assert tag_res["tag_id"] == tag.tag_id
        assert tag_res["tag_name"] == tag_name

    @pytest.mark.parametrize("tag_name", SAMPLE_TAG_LIST)
    def test_api__post_content_tag__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        # event_helper,
        tag_name,
    ) -> None:
        """
        Create a tag
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"tag_name": tag_name}
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/tags".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        tag_res = res.json_body
        assert tag_res["tag_id"]
        assert tag_res["tag_name"] == tag_name

    @pytest.mark.parametrize("tag_name", SAMPLE_TAG_LIST)
    def test_api__post_content_tag__err_400__already_exist(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        event_helper,
        tag_name,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"tag_name": tag_name}
        web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/tags".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/tags".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.TAG_ALREADY_EXISTS

    @pytest.mark.parametrize("tag_name", SAMPLE_TAG_LIST)
    def test_api__delete_content_tag__ok_200__user_is_author_and_workspace_manager(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        # event_helper,
        tag_name,
    ) -> None:
        """
        delete tag (user is workspace_manager and owner)
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"tag_name": tag_name}
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/tags".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        tag_id = res.json_body["tag_id"]
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                tag_id=tag_id,
            ),
            status=200,
        )
        res = web_testapp.delete(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                tag_id=tag_id,
            ),
            status=204,
        )

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                tag_id=tag_id,
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.TAG_NOT_FOUND

    @pytest.mark.parametrize("tag_name", SAMPLE_TAG_LIST)
    def test_api__delete_content_tag__ok_400__is_not_contributor(
        self,
        workspace_api_factory,
        content_api_factory,
        role_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        riyad_user,
        tag_name,
    ) -> None:
        """
        delete tag (user is workspace_manager and owner)
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(riyad_user, test_workspace, UserRoleInWorkspace.READER, with_notif=False)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"tag_name": tag_name}
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/tags".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        tag_id = res.json_body["tag_id"]
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                tag_id=tag_id,
            ),
            status=200,
        )
        web_testapp.authorization = ("Basic", (riyad_user.username, "password"))

        res = web_testapp.delete(
            "/api/workspaces/{workspace_id}/contents/{content_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                tag_id=tag_id,
            ),
            status=403,
        )
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                tag_id=tag_id,
            ),
            status=200,
        )

        res = web_testapp.delete(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id, tag_id=tag_id,
            ),
            status=403,
        )
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/tags/{tag_id}".format(
                workspace_id=test_workspace.workspace_id, tag_id=tag_id,
            ),
            status=200,
        )
