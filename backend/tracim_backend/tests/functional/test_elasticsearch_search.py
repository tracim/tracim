import pytest
import transaction

from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_elasticsearch_search"}], indirect=True
)
class TestElasticSearchSearch(object):
    @pytest.mark.parametrize(
        "created_content_name, search_string, nb_content_result, first_search_result_content_name",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name
            # exact syntax
            ("testdocument", "testdocument", 1, "testdocument"),
            # autocomplete
            ("testdocument", "testdoc", 1, "testdocument"),
            # # autocomplete with multi result (can't check result order now)
            ("testdocument", "test", 2, None),
            (
                "a50charslongdocumentnamewithexactlyfiftycharacters",
                "a50charslongdocumentnamewithexactlyfiftycharacters",
                1,
                "a50charslongdocumentnamewithexactlyfiftycharacters",
            ),
        ],
    )
    def test_api___elasticsearch_search_ok__by_label(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
        created_content_name,
        search_string,
        nb_content_result,
        first_search_result_content_name,
        config_section,
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
        content1 = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        api.execute_created_content_actions(content1)
        content2 = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="another content",
            do_save=True,
        )
        api.execute_created_content_actions(content2)

        content3 = api.create(
            content_type_slug="html-document", workspace=workspace, label="test", do_save=True
        )
        api.execute_created_content_actions(content3)
        transaction.commit()
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        if first_search_result_content_name:
            assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "created_content_name, search_string, nb_content_result, first_search_result_content_name",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name
            # exact syntax
            ("good practices", "good practices.document.html", 1, "good practices"),
            # autocomplete
            ("good practices", ".thread", 1, "discussion"),
            # # autocomplete with multi result (can't check result order now)
            ("good practices", ".document", 2, None),
        ],
    )
    def test_api___elasticsearch_search_ok__by_filename(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
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
        content1 = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label=created_content_name,
            do_save=True,
        )
        api.execute_created_content_actions(content1)
        content2 = api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.execute_created_content_actions(content2)
        content3 = api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        api.execute_created_content_actions(content3)
        transaction.commit()
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        if first_search_result_content_name:
            assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "created_content_name, created_content_body, search_string, nb_content_result, first_search_result_content_name",
        [
            # created_content_name, created_content_body,  search_string, nb_content_result, first_search_result_content_name
            # exact syntax
            (
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "subpart",
                1,
                "good practices",
            ),
            (
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "sub",
                1,
                "good practices",
            ),
        ],
    )
    def test_api___elasticsearch_search_ok__by_description(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
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
        api.execute_created_content_actions(content)
        report = api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.execute_created_content_actions(report)
        thread = api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        api.execute_created_content_actions(thread)
        transaction.commit()
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
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
        ],
    )
    def test_api___elasticsearch_search_ok__by_comment_content(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
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
        api.execute_created_content_actions(content)
        comment = api.create_comment(
            workspace=workspace, parent=content, content=first_created_comment_content, do_save=True
        )
        api.execute_created_content_actions(comment)
        comment2 = api.create_comment(
            workspace=workspace,
            parent=content,
            content=second_created_comment_content,
            do_save=True,
        )
        api.execute_created_content_actions(comment2)
        report = api.create(
            content_type_slug="html-document", workspace=workspace, label="report", do_save=True
        )
        api.execute_created_content_actions(report)
        thread = api.create(
            content_type_slug="thread", workspace=workspace, label="discussion", do_save=True
        )
        api.execute_created_content_actions(thread)
        transaction.commit()
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        assert search_result["contents"][0]["label"] == first_search_result_content_name

    def test_api___elasticsearch_search_ok__no_search_string(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
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
        elasticsearch.refresh_elasticsearch()

        transaction.commit()
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 0
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 0

    def test_api___elasticsearch_search_ok__filter_by_content_type(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
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
        doc = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch doc",
            do_save=True,
        )
        api.execute_created_content_actions(doc)
        doc2 = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch doc 2",
            do_save=True,
        )
        api.execute_created_content_actions(doc2)
        thread = api.create(
            content_type_slug="thread",
            workspace=workspace,
            label="stringtosearch thread",
            do_save=True,
        )
        api.execute_created_content_actions(thread)
        folder = api.create(
            content_type_slug="folder",
            workspace=workspace,
            label="stringtosearch folder",
            do_save=True,
        )
        api.execute_created_content_actions(folder)
        transaction.commit()
        elasticsearch.refresh_elasticsearch()
        # get all
        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 4

        params = {"search_string": "stringtosearch", "content_types": "html-document"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 2
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 2
        labels = [content["label"] for content in search_result["contents"]]
        assert "stringtosearch doc 2" in labels
        assert "stringtosearch doc" in labels

        params = {"search_string": "stringtosearch", "content_types": "html-document,thread"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 3
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 3
        labels = [content["label"] for content in search_result["contents"]]
        assert "stringtosearch doc 2" in labels
        assert "stringtosearch doc" in labels
        assert "stringtosearch doc 2" in labels
        assert "stringtosearch thread" in labels

        params = {"search_string": "stringtosearch", "content_types": "folder"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"] == "stringtosearch folder"

    def test_api___elasticsearch_search_ok__filter_by_deleted_archived_active(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
        session,
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
        active_content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch active",
            do_save=True,
        )
        api.execute_created_content_actions(active_content)
        active_content2 = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch active 2",
            do_save=True,
        )
        api.execute_created_content_actions(active_content2)
        deleted_content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch deleted",
            do_save=True,
        )
        api.execute_created_content_actions(deleted_content)
        with new_revision(session=session, tm=transaction.manager, content=deleted_content):
            api.delete(deleted_content)
        api.save(deleted_content)
        api.execute_update_content_actions(deleted_content)
        archived_content = api.create(
            content_type_slug="html-document",
            workspace=workspace,
            label="stringtosearch archived",
            do_save=True,
        )
        api.execute_created_content_actions(archived_content)
        with new_revision(session=session, tm=transaction.manager, content=archived_content):
            api.archive(archived_content)
        api.save(archived_content)
        api.execute_update_content_actions(archived_content)
        transaction.commit()
        elasticsearch.refresh_elasticsearch()
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
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 4

        # get only active
        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        default_search_result = res.json_body
        assert default_search_result
        assert default_search_result["total_hits"] == 2
        assert default_search_result["is_total_hits_accurate"] is True
        assert len(default_search_result["contents"]) == 2
        labels = [content["label"] for content in default_search_result["contents"]]
        assert "stringtosearch active 2" in labels
        assert "stringtosearch active" in labels

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
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 3
        labels = [content["label"] for content in default_search_result["contents"]]
        assert "stringtosearch active 2" in labels
        assert "stringtosearch active" in labels

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
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"].startswith("stringtosearch archived")


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_elasticsearch_ingest_search"}], indirect=True
)
class TestElasticSearchSearchWithIngest(object):
    @pytest.mark.xfail(reason="Need elasticsearch ingest plugin enabled")
    def test_api__elasticsearch_search__ok__in_file_ingest_search(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
        session,
        content_type_list,
    ):

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
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                label="important",
                do_save=False,
            )
            api.update_file_data(
                text_file, "test_file", "text/plain", b"we need to find stringtosearch here !"
            )
            api.save(text_file)
            api.execute_created_content_actions(text_file)
        content_id = text_file.content_id
        transaction.commit()
        elasticsearch.refresh_elasticsearch()

        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["content_id"] == content_id
