from http import HTTPStatus

import pytest
import transaction

from tracim_backend.app_models.contents import HTML_DOCUMENTS_TYPE
from tracim_backend.app_models.contents import THREAD_TYPE
from tracim_backend.error import ErrorCode
from tracim_backend.exceptions import FavoriteContentNotFound
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def create_content(
    content_api: ContentApi,
    workspace: Workspace,
    content_type=THREAD_TYPE,
    label="Test Thread",
    set_as_favorite: bool = False,
):
    content = content_api.create(
        content_type_slug=content_type,
        workspace=workspace,
        parent=None,
        label=label,
        do_save=True,
        do_notify=False,
    )
    if set_as_favorite:
        content_api.add_favorite(content, do_save=True)
    return content


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestFavoriteContent(object):
    def test_api__get_favorite_content__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
    ):
        workspace_api = workspace_api_factory.get(current_user=riyad_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        test_thread = create_content(content_api, test_workspace, set_as_favorite=True)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.get(
            "/api/user/{}/favorite-contents/{}".format(riyad_user.user_id, test_thread.content_id),
            status=HTTPStatus.OK,
        )
        favorite_content = res.json_body
        assert favorite_content["original_label"] == "Test Thread"
        assert favorite_content["content"]["label"] == "Test Thread"

    def test_api__get_favorite_content__ok__deleted_content(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
    ):
        workspace_api = workspace_api_factory.get(current_user=riyad_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        test_thread = create_content(content_api, test_workspace, set_as_favorite=True)
        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.delete(test_thread)
        content_api.save(test_thread)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.get(
            "/api/user/{}/favorite-contents/{}".format(riyad_user.user_id, test_thread.content_id),
            status=HTTPStatus.OK,
        )
        favorite_content = res.json_body
        assert favorite_content["original_label"] == "Test Thread"
        assert favorite_content["content"]["label"].startswith("Test Thread-deleted")
        assert favorite_content["content"]["is_deleted"] is True

    def test_api__get_favorite_content__ok__unaccessible_content(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
        admin_user,
    ):
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        test_thread = create_content(content_api, test_workspace, set_as_favorite=True)
        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.update_content(test_thread, "Test Thread (Updated)")
        content_api.save(test_thread)
        assert test_thread.label == "Test Thread (Updated)"
        transaction.commit()
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.get(
            "/api/user/{}/favorite-contents/{}".format(riyad_user.user_id, test_thread.content_id),
            status=HTTPStatus.OK,
        )
        favorite_content = res.json_body
        assert favorite_content["original_label"] == "Test Thread"
        assert favorite_content["content"] is None

    def test_api__get_favorite_content__err__content_not_exist(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
    ):
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.get(
            "/api/user/{}/favorite-contents/1010".format(riyad_user.user_id,),
            status=HTTPStatus.BAD_REQUEST,
        )
        assert res.json_body["code"] == ErrorCode.FAVORITE_CONTENT_NOT_FOUND

    def test_api__get_favorite_content__err__content_not__favorite(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
    ):
        workspace_api = workspace_api_factory.get(current_user=riyad_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        test_thread = create_content(content_api, test_workspace, set_as_favorite=False)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.get(
            "/api/user/{}/favorite-contents/{}".format(riyad_user.user_id, test_thread.content_id),
            status=HTTPStatus.BAD_REQUEST,
        )
        assert res.json_body["code"] == ErrorCode.FAVORITE_CONTENT_NOT_FOUND

    def test_api__get_favorites_contents_list__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
        admin_user,
    ):
        workspace_api = workspace_api_factory.get(current_user=riyad_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        workspace_api_admin = workspace_api_factory.get(current_user=admin_user)
        confidential_space = workspace_api_admin.create_workspace(
            "confidential_space", save_now=True
        )
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        # accessible and active content
        test_thread = create_content(content_api, test_workspace, set_as_favorite=True)
        # not favorite content
        create_content(
            content_api,
            test_workspace,
            set_as_favorite=False,
            content_type=HTML_DOCUMENTS_TYPE,
            label="Test Note",
        )
        # non-accessible content: should give none content
        create_content(
            content_api,
            confidential_space,
            set_as_favorite=True,
            content_type=HTML_DOCUMENTS_TYPE,
            label="Test Note2",
        )
        # deleted content: should be accessible
        note3_deleted = create_content(
            content_api,
            test_workspace,
            set_as_favorite=True,
            content_type=HTML_DOCUMENTS_TYPE,
            label="Test Note3",
        )
        with new_revision(session=session, tm=transaction.manager, content=note3_deleted):
            content_api.delete(note3_deleted)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.get(
            "/api/user/{}/favorite-contents".format(riyad_user.user_id, test_thread.content_id),
            status=HTTPStatus.OK,
        )
        favorite_contents = res.json_body["items"]
        assert len(favorite_contents) == 3
        # accessible and active content
        assert favorite_contents[0]["original_label"] == "Test Thread"
        assert favorite_contents[0]["content"]["label"] == "Test Thread"
        # non-accessible content: should give none content
        assert favorite_contents[1]["original_label"] == "Test Note2"
        assert favorite_contents[1]["content"] is None
        # deleted content: should be accessible
        assert favorite_contents[2]["original_label"] == "Test Note3"
        assert favorite_contents[2]["content"]["label"].startswith("Test Note3-deleted")

    def test_api__set_content_as_favorites__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
    ):
        workspace_api = workspace_api_factory.get(current_user=riyad_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        test_thread = create_content(content_api, test_workspace, set_as_favorite=False)
        transaction.commit()
        with pytest.raises(FavoriteContentNotFound):
            content_api.get_one_user_favorite_content(
                user_id=riyad_user.user_id, content_id=test_thread.content_id
            )
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        res = web_testapp.post_json(
            "/api/user/{}/favorite-contents".format(riyad_user.user_id),
            params={"content_id": test_thread.content_id},
            status=HTTPStatus.OK,
        )
        favorite_content = res.json_body
        assert favorite_content["original_label"] == "Test Thread"
        assert favorite_content["content"]["label"] == "Test Thread"
        assert content_api.get_one_user_favorite_content(
            user_id=riyad_user.user_id, content_id=test_thread.content_id
        )

    def test_api__remove_content_as_favorites__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        session,
    ):
        workspace_api = workspace_api_factory.get(current_user=riyad_user)
        test_workspace = workspace_api.create_workspace("test_workspace", save_now=True)
        content_api = content_api_factory.get(current_user=riyad_user)  # type: ContentApi
        test_thread = create_content(content_api, test_workspace, set_as_favorite=True)
        transaction.commit()
        assert content_api.get_one_user_favorite_content(
            user_id=riyad_user.user_id, content_id=test_thread.content_id
        )
        web_testapp.authorization = ("Basic", ("riyad@test.test", "password"))
        web_testapp.delete(
            "/api/user/{}/favorite-contents/{}".format(riyad_user.user_id, test_thread.content_id),
            status=HTTPStatus.NO_CONTENT,
        )
        with pytest.raises(FavoriteContentNotFound):
            content_api.get_one_user_favorite_content(
                user_id=riyad_user.user_id, content_id=test_thread.content_id
            )
