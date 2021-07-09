import pytest
import transaction

from tracim_backend.lib.core.tag import TagLib
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_simple_search"}], indirect=True
)
class TestSimpleSearch(object):
    @pytest.mark.parametrize(
        "created_content_name, search_string, nb_content_result, first_search_result_content_name",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name
            # exact syntax
            ("testdocument", "testdocument", 1, "testdocument"),
            # autocomplete
            ("testdocument", "testdoc", 1, "testdocument"),
            # autocomplete with multi result -> first result is the last updated one
            ("testdocument", "test", 2, "test"),
            # regex style *[text]
            ("content", "content", 2, "another content"),
        ],
    )
    def test_api___simple_search_ok__by_label(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        web_testapp,
        content_api_factory,
        created_content_name,
        search_string,
        nb_content_result,
        first_search_result_content_name,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="another content",
            do_save=True,
        )
        api.create(
            content_type_slug="html-document", workspace=workspace, label="test", do_save=True
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is False
        assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "created_content_name, search_string, nb_content_result, first_search_result_content_name",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name
            # exact syntax
            ("good practices", "good practices.document.html", 1, "good practices"),
            # autocomplete
            ("good practices", "html", 3, "discussion"),
            ("good practices", "thread", 1, "discussion"),
            ("good practices", "document", 2, "report"),
        ],
    )
    def test_api___simple_search_ok__by_filename(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        created_content_name,
        search_string,
        nb_content_result,
        first_search_result_content_name,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is False
        assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "created_content_name, created_content_body, search_string, nb_content_result,first_search_result_content_name",
        [
            # created_content_name, created_content_body, search_string, nb_content_result, first_search_result_content_name
            # exact syntax
            (
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "subpart",
                1,
                "good practices",
            ),
            # autocompletion search
            (
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "sub",
                1,
                "good practices",
            ),
            (
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "part",
                1,
                "good practices",
            ),
        ],
    )
    def test_api___simple_search_ok__by_content(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        session,
        created_content_name,
        created_content_body,
        search_string,
        nb_content_result,
        first_search_result_content_name,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        with new_revision(session=session, tm=transaction.manager, content=content):
            api.update_content(
                content, new_label=created_content_name, new_raw_content=created_content_body
            )
            api.save(content)
        api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is False
        assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "created_content_name, search_string, nb_content_result, first_search_result_content_name, first_created_comment_content, second_created_comment_content",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name, first_created_comment_content, second_created_comment_content
            # exact syntax
            (
                "good practices",
                "eureka",
                1,
                "good practices",
                "this is a comment content containing the string: eureka.",
                "this is another comment content",
            ),
            # autocompletion
            (
                "good practices",
                "eur",
                1,
                "good practices",
                "this is a comment content containing the string: eureka.",
                "this is another comment content containing eureka string",
            ),
            (
                "good practices",
                "reka",
                1,
                "good practices",
                "this is a comment content containing the string: eureka.",
                "this is another comment content containing eureka string",
            ),
        ],
    )
    def test_api___simple_search_ok__by_comment_content(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        created_content_name,
        search_string,
        nb_content_result,
        first_search_result_content_name,
        first_created_comment_content,
        second_created_comment_content,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        api.create_comment(
            workspace=workspace, parent=content, content=first_created_comment_content, do_save=True
        )
        api.create_comment(
            workspace=workspace,
            parent=content,
            content=second_created_comment_content,
            do_save=True,
        )
        api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is False
        assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "created_content_name, search_string, first_search_result_content_name, first_created_comment_content, second_created_comment_content",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name, first_created_comment_content, second_created_comment_content
            # exact syntax
            (
                "good practices",
                "eureka",
                "good practices",
                "this is a comment content containing the string: eureka.",
                "this is another comment content, eureka",
            )
        ],
    )
    def test_api___simple_search_ok__avoid_duplicate_content(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        created_content_name,
        web_testapp,
        search_string,
        first_search_result_content_name,
        first_created_comment_content,
        second_created_comment_content,
    ) -> None:
        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        api.create_comment(
            workspace=workspace, parent=content, content=first_created_comment_content, do_save=True
        )
        api.create_comment(
            workspace=workspace,
            parent=content,
            content=second_created_comment_content,
            do_save=True,
        )
        api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string, "size": 1, "page_nb": 1}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"] == first_search_result_content_name

        params = {"search_string": search_string, "size": 1, "page_nb": 2}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 0

    def test_api___simple_search_ok__no_search_string(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        api.create(
            content_type_slug="html-document", workspace=workspace, label="test", do_save=True
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 0
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 0

    def test_api___simple_search_ok__filter_by_content_type(
        self,
        user_api_factory,
        role_api_factory,
        content_api_factory,
        workspace_api_factory,
        web_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch doc",
            do_save=True,
        )
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch doc 2",
            do_save=True,
        )
        api.create(
            content_type_slug="thread",
            workspace=workspace,
            label="stringtosearch thread",
            do_save=True,
        )
        api.create(
            content_type_slug="folder",
            workspace=workspace,
            label="stringtosearch folder",
            do_save=True,
        )
        transaction.commit()

        # get all
        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 4

        params = {"search_string": "stringtosearch", "content_types": "html-document"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 2
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 2
        assert search_result["contents"][0]["label"] == "stringtosearch doc 2"
        assert search_result["contents"][1]["label"] == "stringtosearch doc"

        params = {"search_string": "stringtosearch", "content_types": "html-document,thread"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 3
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 3
        assert search_result["contents"][0]["label"] == "stringtosearch thread"
        assert search_result["contents"][1]["label"] == "stringtosearch doc 2"
        assert search_result["contents"][2]["label"] == "stringtosearch doc"

        params = {"search_string": "stringtosearch", "content_types": "folder"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"] == "stringtosearch folder"

    def test_api___simple_search_ok__filter_by_deleted_archived_active(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = content_api_factory.get(current_user=user)
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch active",
            do_save=True,
        )
        api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch active 2",
            do_save=True,
        )
        deleted_content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch deleted",
            do_save=True,
        )
        with new_revision(session=session, tm=transaction.manager, content=deleted_content):
            api.delete(deleted_content)
        api.save(deleted_content)
        archived_content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch archived",
            do_save=True,
        )
        with new_revision(session=session, tm=transaction.manager, content=archived_content):
            api.archive(archived_content)
        api.save(archived_content)
        transaction.commit()

        # get all
        params = {
            "search_string": "stringtosearch",
            "show_deleted": 1,
            "show_archived": 1,
            "show_active": 1,
        }
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 4

        # get only active
        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        default_search_result = res.json_body
        assert default_search_result
        assert default_search_result["total_hits"] == 2
        assert default_search_result["is_total_hits_accurate"] is False
        assert len(default_search_result["contents"]) == 2
        assert default_search_result["contents"][0]["label"] == "stringtosearch active 2"
        assert default_search_result["contents"][1]["label"] == "stringtosearch active"

        params = {
            "search_string": "stringtosearch",
            "show_active": 1,
            "show_deleted": 0,
            "show_archived": 0,
        }
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        only_active_search_result = res.json_body
        assert only_active_search_result == default_search_result

        params = {
            "search_string": "stringtosearch",
            "show_active": 1,
            "show_deleted": 1,
            "show_archived": 0,
        }
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 3
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 3
        assert search_result["contents"][0]["label"].startswith("stringtosearch deleted")
        assert search_result["contents"][1]["label"] == "stringtosearch active 2"
        assert search_result["contents"][2]["label"] == "stringtosearch active"

        params = {
            "search_string": "stringtosearch",
            "show_active": 0,
            "show_deleted": 0,
            "show_archived": 1,
        }
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is False
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"].startswith("stringtosearch archived")

    @pytest.mark.parametrize(
        "search_string,expected_results_count",
        [("World", 1), ("world", 1), ("orl", 1), ("Hello", 0)],
    )
    def test_api___simple_search_ok__by_tags(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        session,
        admin_user,
        search_string: str,
        expected_results_count: int,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test", save_now=True)
        content_api = content_api_factory.get()
        content_api.create(
            content_type_slug="html-document", workspace=workspace, label="Foo", do_save=True,
        )
        bar = content_api.create(
            content_type_slug="html-document", workspace=workspace, label="Bar", do_save=True
        )
        tag_lib = TagLib(session)
        tag_lib.add_tag_to_content(user=admin_user, content=bar, tag_name="World")
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == expected_results_count
        assert search_result["is_total_hits_accurate"] is False
        if expected_results_count:
            assert search_result["contents"][0]["label"] == "Bar"
