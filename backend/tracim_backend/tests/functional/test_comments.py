# -*- coding: utf-8 -*-
import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.error import ErrorCode
from tracim_backend.fixtures.content import Content as ContentFixtures
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import FunctionalTest


class TestCommentsEndpoint(FunctionalTest):
    """
    Tests for /api/v2/workspaces/{workspace_id}/contents/{content_id}/comments
    endpoint
    """

    fixtures = [BaseFixture, ContentFixtures]

    def test_api__get_contents_comments__ok_200__nominal_case(self) -> None:
        """
        Get alls comments of a content
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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

        comment = res.json_body[1]
        assert comment["content_id"] == 19
        assert comment["parent_id"] == 7
        assert comment["raw_content"] == "<p>What about Apple Pie? There are Awesome!</p>"
        assert comment["author"]
        assert comment["author"]["user_id"] == 3
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == "Bob i."
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

    def test_api__post_content_comment__ok_200__nominal_case(self) -> None:
        """
        Get alls comments of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()  # type: User
        workspace_api = WorkspaceApi(current_user=admin, session=dbsession, config=self.app_config)
        business_workspace = workspace_api.get_one(1)
        content_api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test Thread",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=dbsession, tm=transaction.manager, content=test_thread):
            content_api.update_content(
                test_thread, new_label="test_thread_updated", new_content="Just a test"
            )
        transaction.commit()
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "I strongly disagree, Tiramisu win!"}
        res = self.testapp.post_json(
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
        assert comment["author"]["user_id"] == admin.user_id
        # TODO - G.M - 2018-06-172 - [avatar] setup avatar url
        assert comment["author"]["avatar_url"] is None
        assert comment["author"]["public_name"] == admin.display_name
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

    def test_api__post_content_comment__err_400__content_not_editable(self) -> None:
        """
        Get alls comments of a content
        """
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()  # type: User
        workspace_api = WorkspaceApi(current_user=admin, session=dbsession, config=self.app_config)
        business_workspace = workspace_api.get_one(1)
        content_api = ContentApi(current_user=admin, session=dbsession, config=self.app_config)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_thread = content_api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test Thread",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=dbsession, tm=transaction.manager, content=test_thread):
            content_api.update_content(
                test_thread, new_label="test_thread_updated", new_content="Just a test"
            )
        content_api.set_status(test_thread, "closed-deprecated")
        transaction.commit()
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "I strongly disagree, Tiramisu win!"}
        res = self.testapp.post_json(
            "/api/v2/workspaces/{}/contents/{}/comments".format(
                business_workspace.workspace_id, test_thread.content_id
            ),
            params=params,
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__post_content_comment__err_400__empty_raw_content(self) -> None:
        """
        Get alls comments of a content
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": ""}
        res = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        # INFO - G.M - 2018-09-10 - error handle by marshmallow validator.
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__post_content_comment__err_400__empty_simple_html(self) -> None:

        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></p>"}
        res = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__empty_nested_html(self) -> None:
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p><p></p><p><p></p></p></p>"}
        res = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__only_br_tags_nested_html(self) -> None:
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p><p></p><p><p><br/><br/></p><br/></p></p>"}
        res = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__delete_content_comment__ok_200__user_is_owner_and_workspace_manager(self) -> None:
        """
        delete comment (user is workspace_manager and owner)
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = self.testapp.delete("/api/v2/workspaces/2/contents/7/comments/18", status=204)
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 18]

    def test_api__delete_content_comment__ok_200__user_is_workspace_manager(self) -> None:
        """
        delete comment (user is workspace_manager)
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = self.testapp.delete("/api/v2/workspaces/2/contents/7/comments/19", status=204)
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 19]

    def test_api__delete_content_comment__ok_200__user_is_owner_and_content_manager(self) -> None:
        """
        delete comment (user is content-manager and owner)
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = self.testapp.delete("/api/v2/workspaces/2/contents/7/comments/19", status=204)
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
        assert len(res.json_body) == 2
        assert not [content for content in res.json_body if content["content_id"] == 19]

    def test_api__delete_content_comment__err_403__user_is_content_manager(self) -> None:
        """
        delete comment (user is content-manager)
        """
        self.testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = self.testapp.delete("/api/v2/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

    def test_api__delete_content_comment__err_403__user_is_owner_and_reader(self) -> None:
        """
        delete comment (user is reader and owner)
        """
        self.testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = self.testapp.delete("/api/v2/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE

    def test_api__delete_content_comment__err_403__user_is_reader(self) -> None:
        """
        delete comment (user is reader)
        """
        self.testapp.authorization = ("Basic", ("bob@fsf.local", "foobarbaz"))
        res = self.testapp.get("/api/v2/workspaces/2/contents/7/comments", status=200)
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
        # TODO - G.M - 2018-06-179 - better check for datetime
        assert comment["created"]

        res = self.testapp.delete("/api/v2/workspaces/2/contents/7/comments/20", status=403)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE  # nopep8

    def test_api__post_content_comment__err_400__unclosed_empty_tag(self) -> None:
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></i>"}
        res = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED

    def test_api__post_content_comment__err_400__unclosed_tag_not_empty(self) -> None:
        """
        This test should raise an error if we validate the html
        The browser will close the p tag and removes the i tag so the html is valid
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p>Hello</i>"}
        self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
        )

    def test_api__post_content_comment__err_400__invalid_html(self) -> None:
        """
        This test should raise an error as the html isn't valid
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<p></p>Hello"}
        self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
        )

    def test_api__post_content_comment__ok__200__empty_iframes_are_not_deleted(self) -> None:
        """
        Test if the html sanityzer does not remove iframes
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "raw_content": '<p><p><iframe src="//www.youtube.com/embed/_TrVid1WuE8" width="560" height="314" allowfullscreen="allowfullscreen"></iframe></p></p>'
        }
        response = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
        )
        assert 'src="//www.youtube.com/embed/_TrVid1WuE8"' in response.json_body["raw_content"]

    def test_api__post_content_comment__ok__200__empty_img_are_not_deleted(self) -> None:
        """
        Test if the html sanityzer does not remove images
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": '<p><img src="data:images/jpeg,123456789=="/></p>'}
        response = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
        )
        assert '<img src="data:images/jpeg,123456789=="/>' in response.json_body["raw_content"]

    def test_api__post_content_comment__ok__200__style_attrs_are_not_deleted(self) -> None:
        """
        Test if the html sanityzer does not remove images
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": '<p><span style="display: none;"><p>test</p></span></p>'}
        response = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
        )

    def test_api__post_content_comment__ok__200__script_is_sanitized(self) -> None:
        """
        Test if the html sanityzer removes script
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "raw_content": "<p>I have a script next to me <script>alert( 'Hello, world!' );</script></p>"
        }
        response = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=200
        )
        assert "<p>I have a script next to me </p>" in response.json_body["raw_content"]

    def test_api__post_content_comment__err__400__only_script_in_comment_is_empty(self):
        """
        Test if the html sanityzer removes script
        """
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"raw_content": "<script>alert( 'Hello, world!' );</script>"}
        response = self.testapp.post_json(
            "/api/v2/workspaces/2/contents/7/comments", params=params, status=400
        )
        assert response.json_body
        assert "code" in response.json_body
        assert response.json_body["code"] == ErrorCode.EMPTY_COMMENT_NOT_ALLOWED
