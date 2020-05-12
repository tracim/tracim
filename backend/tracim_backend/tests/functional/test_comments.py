# -*- coding: utf-8 -*-
import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestCommentsEndpoint(object):
    """
    Tests for /api/v2/workspaces/{workspace_id}/contents/{content_id}/comments
    endpoint
    """

    def test_api__get_contents_comments__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get alls comments of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "Global manager"
        assert comment["author"]["username"] == "TheAdmin"

        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["avatar_url"] is None
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

    def test_api__post_content_comment__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
    ) -> None:
        """
        Get alls comments of a content
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
                test_thread, new_label="test_thread_updated", new_content="Just a test"
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "I strongly disagree, Tiramisu win!"}
        res = web_testapp.post_json(
            "/api/v2/workspaces/{}/contents/{}/comments".format(
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == admin_user.display_name
        assert comment["author"]["username"] == admin_user.username
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

    def test_api__post_content_comment__err_400__content_not_editable(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get alls comments of a content
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
                test_thread, new_label="test_thread_updated", new_content="Just a test"
            )
        content_api.set_status(test_thread, "closed-deprecated")
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "I strongly disagree, Tiramisu win!"}
        res = web_testapp.post_json(
            "/api/v2/workspaces/{}/contents/{}/comments".format(
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
        Get alls comments of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": ""}
        res = web_testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        # INFO - G.M - 2018-09-10 - error handle by marshmallow validator.
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__post_content_comment__err_400__empty_simple_html(self, web_testapp) -> None:

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></p>"}
        res = web_testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__empty_nested_html(self, web_testapp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p><p></p><p><p></p></p></p>"}
        res = web_testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
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
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
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
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "Global manager"
        assert comment["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/v2/workspaces/2/contents/7/comments/18", status=204)
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 18]

    def test_api__delete_content_comment__ok_200__user_is_workspace_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is workspace_manager)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "Bob i."
        assert comment["author"]["username"] == "TheBobi"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/v2/workspaces/2/contents/7/comments/19", status=204)
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 19]

    def test_api__delete_content_comment__ok_200__user_is_owner_and_content_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is content-manager and owner)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 3
        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "Bob i."
        assert comment["author"]["username"] == "TheBobi"
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/v2/workspaces/2/contents/7/comments/19", status=204)
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 19]

    def test_api__delete_content_comment__err_403__user_is_content_manager(
        self, web_testapp
    ) -> None:
        """
        delete comment (user is content-manager)
        """
        web_testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/v2/workspaces/2/contents/7/comments/20", status=403)
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
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/v2/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

    def test_api__delete_content_comment__err_403__user_is_reader(self, web_testapp) -> None:
        """
        delete comment (user is reader)
        """
        web_testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = web_testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "John Reader"
        assert comment["author"]["username"] is None
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = web_testapp.delete("/api/v2/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE  # nopep8

    def test_api__post_content_comment__err_400__unclosed_empty_tag(self, web_testapp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></i>"}
        res = web_testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__unclosed_tag_not_empty(self, web_testapp) -> None:
        """
        This test should raise an error if we validate the html
        The browser will close the p tag and removes the i tag so the html is valid
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p>Hello</i>"}
        web_testapp.post_json("/api/v2/workspaces/2/contents/7/comments", params=params, status=200)

    def test_api__post_content_comment__err_400__invalid_html(self, web_testapp) -> None:
        """
        This test should raise an error as the html isn't valid
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></p>Hello"}
        web_testapp.post_json("/api/v2/workspaces/2/contents/7/comments", params=params, status=200)

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
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
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
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
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
        web_testapp.post_json("/api/v2/workspaces/2/contents/7/comments", params=params, status=200)

    def test_api__post_content_comment__ok__200__script_is_sanitized(self, web_testapp) -> None:
        """
        Test if the html sanityzer removes script
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "raw_content": "<p>I have a script next to me <script>alert( 'Hello, world!' );</script></p>"
        }
        response = web_testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
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
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert response.json_body
        assert "code" in response.json_body
        assert response.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED
