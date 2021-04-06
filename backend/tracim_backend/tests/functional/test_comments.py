# -*- coding: utf-8 -*-

import pytest
import responses
import transaction

from tracim_backend.app_models.contents import HTML_DOCUMENTS_TYPE
from tracim_backend.error import ErrorCode
from tracim_backend.lib.translate.services.systran import FILE_TRANSLATION_ENDPOINT
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestCommentsEndpoint(object):
    """
    Tests for /api/workspaces/{workspace_id}/contents/{content_id}/comments
    endpoint
    """

    def test_api__get_contents_comments__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get all comments of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[0]
        assert comment["content_id"] == 18
        assert comment["parent_id"] == 7
        assert comment["parent_content_type"] == "thread"
        assert comment["parent_content_namespace"] == "content"
        assert comment["parent_label"] == "Best Cakes?"
        assert (
            comment["raw_content"]
            == "<p>What is for you the best cake ever? <br/> I personnally vote for Chocolate cupcake!</p>"
        )
        assert comment["author"]
        assert comment["author"]["user_id"] == 1
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "Global manager"
        assert comment["author"]["username"] == "TheAdmin"

        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "Bob i."
        assert comment["author"]["username"] == "TheBobi"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        comment = res.json_body[2]
        assert comment["content_id"] == 20
        assert comment["parent_id"] == 7
        assert (
            comment["raw_content"] == "<p>You are right, but Kouign-amann are clearly better.</p>"
        )
        assert comment["author"]
        assert comment["author"]["user_id"] == 4
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

    def test_api__get_one_comment__ok_200__nominal_case(
        self, web_testapp, session, workspace_api_factory, content_api_factory, content_type_list
    ) -> None:
        """
        Get one specific comment of a content
        """
        raw_content = "<b>just a comment label</b>"
        content_label = "test_page"
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test")
        content_api = content_api_factory.get()
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            label=content_label,
            do_save=True,
            do_notify=False,
        )
        comment_created = content_api.create_comment(
            workspace=workspace,
            parent=test_html_document,
            content=raw_content,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment_created.content_id
            ),
            status=200,
        )
        comment = res.json_body
        assert comment["content_id"] == comment_created.content_id
        assert comment["parent_id"] == comment_created.parent_id
        assert comment["parent_content_type"] == "html-document"
        assert comment["parent_content_namespace"] == "content"
        assert comment["parent_label"] == "test_page"
        assert comment["raw_content"] == raw_content
        assert comment["author"]
        assert comment["author"]["user_id"] == 1
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "Global manager"
        assert comment["author"]["username"] == "TheAdmin"

    def test_api__post_content_comment__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        event_helper,
    ) -> None:
        """
        Create a comment
        """
        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        content_api = content_api_factory.get()
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test Thread",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.update_content(
                test_thread, new_label="test_thread_updated", new_raw_content="Just a test"
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "I strongly disagree, Tiramisu win!"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/contents/{}/comments".format(
                business_workspace.workspace_id, test_thread.content_id
            ),
            params=params,
            status=200,
        )
        comment = res.json_body
        assert comment["content_id"]
        assert comment["parent_id"] == test_thread.content_id
        assert comment["raw_content"] == "I strongly disagree, Tiramisu win!"
        assert comment["author"]
        assert comment["author"]["user_id"] == admin_user.user_id
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == admin_user.display_name
        assert comment["author"]["username"] == admin_user.username
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        created = event_helper.last_event
        assert created.event_type == "content.created.comment"
        assert created.content == comment
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(business_workspace.workspace_id), status=200
        ).json_body
        assert created.workspace == workspace

    def test_api__post_content_comment__err_400__content_not_editable(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get all comments of a content
        """

        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        content_api = content_api_factory.get()
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test Thread",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.update_content(
                test_thread, new_label="test_thread_updated", new_raw_content="Just a test"
            )
        content_api.set_status(test_thread, "closed-deprecated")
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "I strongly disagree, Tiramisu win!"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/contents/{}/comments".format(
                business_workspace.workspace_id, test_thread.content_id
            ),
            params=params,
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__post_content_comment__err_400__empty_raw_content(self, web_testapp) -> None:
        """
        Get all comments of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": ""}
        res = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        # INFO - G.M - 2018-09-10 - error handle by marshmallow validator.
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__post_content_comment__err_400__empty_simple_html(self, web_testapp) -> None:

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></p>"}
        res = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__empty_nested_html(self, web_testapp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p><p></p><p><p></p></p></p>"}
        res = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__only_br_tags_nested_html(
        self, web_testapp
    ) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p><p></p><p><p><br/><br/></p><br/></p></p>"}
        res = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__delete_content_comment__ok_200__user_is_owner_and_workspace_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is workspace_manager and owner)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[0]
        assert comment["content_id"] == 18
        assert comment["parent_id"] == 7
        assert (
            comment["raw_content"]
            == "<p>What is for you the best cake ever? <br/> I personnally vote for Chocolate cupcake!</p>"
        )
        assert comment["author"]
        assert comment["author"]["user_id"] == 1
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "Global manager"
        assert comment["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/workspaces/2/contents/7/comments/18", status=204)
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 18]

    def test_api__delete_content_comment__ok_200__user_is_workspace_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is workspace_manager)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "Bob i."
        assert comment["author"]["username"] == "TheBobi"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/workspaces/2/contents/7/comments/19", status=204)
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 19]

    def test_api__delete_content_comment__ok_200__user_is_owner_and_content_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is content-manager and owner)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "Bob i."
        assert comment["author"]["username"] == "TheBobi"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/workspaces/2/contents/7/comments/19", status=204)
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 19]

    def test_api__delete_content_comment__err_403__user_is_content_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is content-manager)
        """
        web_testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[2]
        assert comment["content_id"] == 20
        assert comment["parent_id"] == 7
        assert (
            comment["raw_content"] == "<p>You are right, but Kouign-amann are clearly better.</p>"
        )
        assert comment["author"]
        assert comment["author"]["user_id"] == 4
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

    def test_api__delete_content_comment__err_403__user_is_owner_and_reader(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is reader and owner)
        """
        web_testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[2]
        assert comment["content_id"] == 20
        assert comment["parent_id"] == 7
        assert (
            comment["raw_content"] == "<p>You are right, but Kouign-amann are clearly better.</p>"
        )
        assert comment["author"]
        assert comment["author"]["user_id"] == 4
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

    def test_api__delete_content_comment__err_403__user_is_reader(self, web_testapp) -> None:
        """
        delete comment (user is reader)
        """
        web_testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = web_testapp.get("/api/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[2]
        assert comment["content_id"] == 20
        assert comment["parent_id"] == 7
        assert (
            comment["raw_content"] == "<p>You are right, but Kouign-amann are clearly better.</p>"
        )
        assert comment["author"]
        assert comment["author"]["user_id"] == 4
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["has_avatar"] is False
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE  # nopep8

    def test_api__post_content_comment__err_400__unclosed_empty_tag(self, web_testapp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></i>"}
        res = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__user_not_member_of_workspace(
        self, web_testapp, html_with_nasty_mention
    ) -> None:
        """
        This test should raise an error as the html contains a mention to a user not member of the workspace
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": html_with_nasty_mention}
        res = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.USER_NOT_MEMBER_OF_WORKSPACE

    def test_api__post_content_comment__ok__200__empty_iframes_are_not_deleted(
        self, web_testapp
    ) -> None:
        """
        Test if the html sanityzer does not remove iframes
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "raw_content": '<p><p><iframe src="//www.youtube.com/embed/_TrVid1WuE8" width="560" height="314" allowfullscreen="allowfullscreen"></iframe></p></p>'
        }
        response = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=200
        )
        assert 'src="//www.youtube.com/embed/_TrVid1WuE8"' in response.json_body["raw_content"]

    def test_api__post_content_comment__ok__200__empty_img_are_not_deleted(
        self, web_testapp
    ) -> None:
        """
        Test if the html sanityzer does not remove images
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": '<p><img src="data:images/jpeg,123456789=="/></p>'}
        response = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=200
        )
        assert '<img src="data:images/jpeg,123456789=="/>' in response.json_body["raw_content"]

    def test_api__post_content_comment__ok__200__style_attrs_are_not_deleted(
        self, web_testapp
    ) -> None:
        """
        Test if the html sanityzer does not remove images
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": '<p><span style="display: none;"><p>test</p></span></p>'}
        web_testapp.post_json("/api/workspaces/2/contents/7/comments", params=params, status=200)

    def test_api__post_content_comment__ok__200__script_is_sanitized(self, web_testapp) -> None:
        """
        Test if the html sanityzer removes script
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "raw_content": "<p>I have a script next to me <script>alert( 'Hello, world!' );</script></p>"
        }
        response = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=200
        )
        assert "<p>I have a script next to me </p>" in response.json_body["raw_content"]

    def test_api__post_content_comment__err__400__only_script_in_comment_is_empty(
        self, web_testapp
    ):
        """
        Test if the html sanityzer removes script
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<script>alert( 'Hello, world!' );</script>"}
        response = web_testapp.post_json(
            "/api/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert response.json_body
        assert "code" in response.json_body
        assert response.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED


def create_doc_and_comment(workspace_api, content_api_note, content_api_comment):
    workspace = workspace_api.create_workspace("test")
    test_html_document = content_api_note.create(
        content_type_slug=HTML_DOCUMENTS_TYPE,
        workspace=workspace,
        label="just a content",
        do_save=True,
        do_notify=False,
    )
    comment = content_api_comment.create_comment(
        workspace=workspace,
        parent=test_html_document,
        content="First version",
        do_save=True,
        do_notify=False,
    )
    transaction.commit()
    return (workspace, test_html_document, comment)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test"}], indirect=True,
)
class TestEditComment(object):
    def test_api__edit_comment__ok__nominal_case(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list, session,
    ):
        """
        Edit comment content
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace, test_html_document, comment = create_doc_and_comment(
            workspace_api, content_api, content_api
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res_get = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            status=200,
        )
        assert res_get.json_body["raw_content"] == "First version"
        new_content = "Second version"
        res_put = web_testapp.put_json(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            params={"raw_content": new_content},
            status=200,
        )
        assert res_put.json_body["raw_content"] == new_content

        new_res_get = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            status=200,
        )
        assert new_res_get.json_body == res_put.json_body

    def test_api__edit_comment__err__empty_raw_content(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list, session,
    ):
        """
        Edit comment content and set empty content
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace, test_html_document, comment = create_doc_and_comment(
            workspace_api, content_api, content_api
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res_get = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            status=200,
        )
        assert res_get.json_body["raw_content"] == "First version"
        new_content = ""
        res_put = web_testapp.put_json(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            params={"raw_content": new_content},
            status=400,
        )
        assert res_put.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__edit_comment__ok__workspace_manager(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        riyad_user,
        role_api_factory,
    ):
        """
        Edit other user comment content as workspace manager
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get(current_user=riyad_user)
        workspace, test_html_document, comment = create_doc_and_comment(
            workspace_api, content_api, content_api
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res_get = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            status=200,
        )
        assert res_get.json_body["raw_content"] == "First version"
        new_content = "Second version"
        web_testapp.put_json(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            params={"raw_content": new_content},
            status=200,
        )

    def test_api__edit_comment__err__400__not_member(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        riyad_user,
        role_api_factory,
    ):
        """
        Edit own comment content where user is not members of the workspace
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get(current_user=riyad_user)
        workspace, test_html_document, comment = create_doc_and_comment(
            workspace_api, content_api, content_api
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", (riyad_user.username, "password"))
        res_get = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            status=400,
        )
        assert res_get.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND
        res_put = web_testapp.put_json(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            params={"raw_content": "Second revision"},
            status=400,
        )
        assert res_put.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api__edit_comment__err__403__simple_reader(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        riyad_user,
        role_api_factory,
    ):
        """
        Edit user comment content where user is only simple reader
        """
        workspace_api = workspace_api_factory.get()
        role_api = role_api_factory.get()
        content_api = content_api_factory.get(current_user=riyad_user)
        workspace, test_html_document, comment = create_doc_and_comment(
            workspace_api, content_api, content_api
        )
        role_api.create_one(riyad_user, workspace, UserRoleInWorkspace.READER, False)
        transaction.commit()
        web_testapp.authorization = ("Basic", (riyad_user.username, "password"))
        res_get = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            status=200,
        )
        assert res_get.json_body["raw_content"] == "First version"
        new_content = "Second version"
        web_testapp.put_json(
            "/api/workspaces/{}/contents/{}/comments/{}".format(
                workspace.workspace_id, test_html_document.content_id, comment.content_id,
            ),
            params={"raw_content": new_content},
            status=403,
        )


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_translation_test"}], indirect=True,
)
class TestCommentTranslation(object):
    @responses.activate
    @pytest.mark.parametrize(
        "raw_content,translated_raw_content,original_lang,destination_lang",
        (
            ("<b>Hello !</b>", "<b>Bonjour !</b>", "en", "fr"),
            ("<b>Hello !</b>", "<b>Bonjour !</b>", "auto", "fr"),
        ),
    )
    def test_api__get_comment_translation__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        raw_content,
        translated_raw_content,
        original_lang,
        destination_lang,
    ):
        """
        Get content translation of a comment
        """
        BASE_API_URL = "https://systran_fake_server.invalid:5050"
        responses.add(
            responses.POST,
            "{}{}".format(BASE_API_URL, FILE_TRANSLATION_ENDPOINT),
            body=translated_raw_content,
            status=200,
            content_type="text/html",
            stream=True,
        )
        translation_filename = "translation.html"
        content_label = "test_page"
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test")
        content_api = content_api_factory.get()
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            label=content_label,
            do_save=True,
            do_notify=False,
        )
        comment = content_api.create_comment(
            workspace=workspace,
            parent=test_html_document,
            content=raw_content,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/comments/{}/translated/{}".format(
                workspace.workspace_id,
                test_html_document.content_id,
                comment.content_id,
                translation_filename,
            ),
            params={
                "source_language_code": original_lang,
                "target_language_code": destination_lang,
            },
            status=200,
        )
        assert res.body.decode("utf-8") == translated_raw_content
        assert res.content_type == "text/html"
