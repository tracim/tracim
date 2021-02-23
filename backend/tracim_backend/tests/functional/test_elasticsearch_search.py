from datetime import datetime
from datetime import timedelta
import typing

from dateutil.parser import parse
import pytest
import transaction

from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import RoleApiFactory
from tracim_backend.tests.utils import WorkspaceApiFactory

in_a_year = (datetime.now() + timedelta(days=365)).strftime(DATETIME_FORMAT)
a_year_ago = (datetime.now() - timedelta(days=365)).strftime(DATETIME_FORMAT)


def is_now(d: str) -> bool:
    return (parse(d).replace(tzinfo=None) - datetime.now()) < timedelta(minutes=1)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "test_elasticsearch_search"}], indirect=True)
class TestElasticSearch(object):
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
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/advanced_search/content", status=200, params=params)
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
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = web_testapp.get("/api/advanced_search/content", status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        if first_search_result_content_name:
            assert search_result["contents"][0]["label"] == first_search_result_content_name

    @pytest.mark.parametrize(
        "search_params, created_content_name, created_content_body, created_workspace_name, nb_content_result, first_search_result_content_name, author_public_name, last_modifier_public_name",
        [
            (
                {"search_string": "subpart"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                1,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "sub"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                1,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "subpart", "workspace_names": "Secret plans"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                1,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "subpart", "workspace_names": "Documentation"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                0,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "sub", "author__public_names": "Claude,Jean"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                1,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "subpart", "file_extensions": ".document.html,.dummy"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                0,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "sub", "file_extensions": ".dummy"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                1,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "sub", "author__public_names": ["Patricia", "Jean"]},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                0,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "sub", "last_modifier__public_names": ["Leslie"]},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                1,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"search_string": "sub", "last_modifier__public_names": ["Malory"]},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                0,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"created_from": in_a_year, "search_string": "sub"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                0,
                "good practices",
                "Claude",
                "Leslie",
            ),
            (
                {"modified_to": a_year_ago, "search_string": "sub"},
                "good practices",
                "this a content body we search a subpart. We hope to find it.",
                "Secret plans",
                0,
                "good practices",
                "Claude",
                "Leslie",
            ),
        ],
    )
    def test_api___elasticsearch_search_ok__by_description(
        self,
        search_params,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        elasticsearch,
        session,
        created_content_name,
        created_content_body,
        created_workspace_name,
        nb_content_result,
        first_search_result_content_name,
        author_public_name,
        last_modifier_public_name,
    ) -> None:

        uapi = user_api_factory.get()

        profile = Profile.TRUSTED_USER
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            name=author_public_name,
            profile=profile,
        )
        last_modifier = uapi.create_user(
            "test2@test.test",
            password="test2@test.test",
            do_save=True,
            do_notify=False,
            name=last_modifier_public_name,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(show_deleted=True)
        workspace = workspace_api.create_workspace(created_workspace_name, save_now=True)
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
            api = content_api_factory.get(current_user=last_modifier)
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
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content", status=200, params=search_params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True

        if nb_content_result:
            assert search_result["contents"][0]["label"] == first_search_result_content_name
            assert search_result["created_range"]["from"] == search_result["created_range"]["to"]
            assert search_result["facets"]["file_extensions"] == [
                {"value": ".document.html", "count": 1}
            ]
            assert search_result["facets"]["content_types"] == [
                {"value": "html-document", "count": 1}
            ]
            assert search_result["facets"]["workspace_names"] == [
                {"value": created_workspace_name, "count": 1}
            ]
            assert search_result["facets"]["author__public_names"] == [
                {"value": author_public_name, "count": 1}
            ]
            assert search_result["facets"]["last_modifier__public_names"] == [
                {"value": last_modifier_public_name, "count": 1}
            ]
            assert is_now(search_result["created_range"]["from"])

    @pytest.mark.parametrize(
        "search_fields, created_content_name, search_string, nb_content_result, first_search_result_content_name, first_created_comment_content, second_created_comment_content",
        [
            # created_content_name, search_string, nb_content_result, first_search_result_content_name, first_created_comment_content, second_created_comment_content
            # exact syntax
            (
                "",
                "good practices",
                "eureka",
                1,
                "good practices",
                "this is a comment content containing the string: eureka.",
                "this is another comment content",
            ),
            (
                "raw_content,description",
                "good practices",
                "eureka",
                0,
                "good practices",
                "this is a comment content containing the string: eureka.",
                "this is another comment content",
            ),
            # autocompletion
            (
                "",
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
        search_fields,
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
        elasticsearch.refresh_elasticsearch()

        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string, "search_fields": search_fields}
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
        search_result = res.json_body

        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        if nb_content_result:
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
        res = web_testapp.get("/api/advanced_search/content", status=200)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 0
        assert search_result["is_total_hits_accurate"] is True
        assert search_result["modified_range"] == search_result["created_range"]
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
        elasticsearch.refresh_elasticsearch()
        # get all
        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 4

        params = {"search_string": "stringtosearch", "content_types": "html-document"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
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
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
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
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
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
        elasticsearch.refresh_elasticsearch()
        # get all
        params = {
            "search_string": "stringtosearch",
            "show_deleted": 1,
            "show_archived": 1,
            "show_active": 1,
        }
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 4

        # get only active
        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
        default_search_result = res.json_body
        assert default_search_result
        assert default_search_result["total_hits"] == 2
        # assert default_search_result["is_total_hits_accurate"] is True
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
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
        only_active_search_result = res.json_body
        assert only_active_search_result == default_search_result

        params = {
            "search_string": "stringtosearch",
            "show_active": 1,
            "show_deleted": 1,
            "show_archived": 0,
        }
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
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
        res = web_testapp.get("/api/advanced_search/content", status=200, params=params)
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
        content_id = text_file.content_id
        transaction.commit()
        elasticsearch.refresh_elasticsearch()

        params = {"search_string": "stringtosearch"}
        web_testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = web_testapp.get("/api/advanced_search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["content_id"] == content_id


@pytest.fixture
def user_search_fixture(
    base_fixture,
    elasticsearch,
    bob_user: User,
    riyad_user: User,
    workspace_api_factory: WorkspaceApiFactory,
    role_api_factory: RoleApiFactory,
) -> typing.Tuple[User, User]:
    wapi = workspace_api_factory.get(bob_user)
    wapi.create_workspace("Bob only")
    bob_and_riyad = wapi.create_workspace("Bob & Riyad")
    rapi = role_api_factory.get(bob_user)
    rapi.create_one(
        riyad_user,
        bob_and_riyad,
        role_level=UserRoleInWorkspace.CONTRIBUTOR,
        with_notif=False,
    )
    transaction.commit()
    elasticsearch.refresh_elasticsearch()
    return (bob_user, riyad_user)


@pytest.mark.usefixtures("user_search_fixture")
@pytest.mark.parametrize("config_section", [{"name": "test_elasticsearch_search"}], indirect=True)
class TestElasticSearchUserSearch:
    def test_api__elasticsearch_user_search__ok__check_result(
        self,
        web_testapp,
        user_search_fixture: typing.Tuple[User, User],
    ) -> None:
        (bob_user, riyad_user) = user_search_fixture
        web_testapp.authorization = ("Basic", (riyad_user.username, "password"))
        parameters = {"search_string": bob_user.display_name}
        search_result = web_testapp.get(
            "/api/advanced_search/user", params=parameters, status=200
        ).json_body
        users = search_result["users"]
        assert len(users) == 1
        bob = users[0]
        assert bob == {
            "user_id": bob_user.user_id,
            "username": bob_user.username,
            "public_name": bob_user.display_name,
            "newest_authored_content_date": None,
            "has_avatar": bob_user.has_avatar,
            "has_cover": bob_user.has_cover,
        }
        facets = search_result["facets"]
        assert facets == {
            "workspaces": [{"count": 1, "value": {"workspace_id": 2, "label": "Bob & Riyad"}}]
        }
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True

    @pytest.mark.parametrize(
        "authorization, query_parameters, expected_user_ids",
        [
            (("bob", "password"), {"search_string": "bob"}, [2]),
            (
                ("bob", "password"),
                {
                    "search_string": "bob",
                    "newest_authored_content_date_from": "2020-12-13T00:00:00Z",
                },
                [],
            ),
            (
                ("bob", "password"),
                {"search_string": "bob", "newest_authored_content_date_to": "2020-12-13T00:00:00Z"},
                [],
            ),
            (("bob", "password"), {"search_string": "riyad"}, [3]),
            (("bob", "password"), {"search_string": "*"}, [2, 3]),
            (("bob", "password"), {"search_string": "*", "workspace_ids": [1]}, [2]),
            (("bob", "password"), {"search_string": "riy"}, [3]),
            (
                ("bob", "password"),
                {"search_string": "riy", "search_fields": ["custom_properties"]},
                [],
            ),
            (("bob", "password"), {"search_string": "faisal"}, [3]),
            (("bob", "password"), {"search_string": "Faisal"}, [3]),
            (("bob", "password"), {"search_string": "faisal", "search_fields": ["username"]}, []),
            (("riyad", "password"), {"search_string": "bob"}, [2]),
            (("riyad", "password"), {"search_string": "TheAdmin"}, []),
            (("TheAdmin", "admin@admin.admin"), {"search_string": "bob"}, []),
        ],
    )
    def test_api__elasticsearch_user_search__ok__nominal_cases(
        self,
        web_testapp,
        authorization: typing.Tuple[str, str],
        query_parameters: dict,
        expected_user_ids: typing.List[int],
    ) -> None:
        """Test different search parameters.
        The fixtures do create 3 users: TheAdmin, riyad and bob.
        Riyad and Bob share a workspace, TheAdmin is member of none.
        """
        web_testapp.authorization = ("Basic", authorization)
        search_result = web_testapp.get(
            "/api/advanced_search/user".format(), status=200, params=query_parameters
        ).json_body
        assert search_result["total_hits"] == len(expected_user_ids)
        assert search_result["is_total_hits_accurate"] is True
        user_ids = [user["user_id"] for user in search_result["users"]]
        assert user_ids == expected_user_ids


@pytest.fixture
def workspace_search_fixture(
    base_fixture,
    elasticsearch,
    bob_user: User,
    riyad_user: User,
    workspace_api_factory: WorkspaceApiFactory,
    role_api_factory: RoleApiFactory,
) -> typing.Tuple[Workspace, Workspace]:
    wapi = workspace_api_factory.get(bob_user)
    bob_only = wapi.create_workspace(
        label="Bob_only", description='A bloody workspace<img src="foo.png"/>'
    )
    bob_and_riyad = wapi.create_workspace("Bob & Riyad")
    rapi = role_api_factory.get(bob_user)
    rapi.create_one(
        riyad_user,
        bob_and_riyad,
        role_level=UserRoleInWorkspace.CONTRIBUTOR,
        with_notif=False,
    )
    transaction.commit()
    elasticsearch.refresh_elasticsearch()
    return (bob_only, bob_and_riyad)


@pytest.mark.usefixtures("workspace_search_fixture")
@pytest.mark.parametrize("config_section", [{"name": "test_elasticsearch_search"}], indirect=True)
class TestElasticSearchWorkspaceSearch:
    def test_api__elasticsearch_workspace_search__ok__check_result(
        self,
        web_testapp,
        workspace_search_fixture: typing.Tuple[User, User],
    ) -> None:
        (bob_only_workspace, _) = workspace_search_fixture
        bob = bob_only_workspace.owner
        web_testapp.authorization = ("Basic", (bob.username, "password"))
        parameters = {"search_string": bob_only_workspace.label}
        search_result = web_testapp.get(
            "/api/advanced_search/workspace", params=parameters, status=200
        ).json_body
        workspaces = search_result["workspaces"]
        assert len(workspaces) == 1
        assert workspaces[0] == {
            "workspace_id": bob_only_workspace.workspace_id,
            "access_type": bob_only_workspace.access_type.value,
            "label": bob_only_workspace.label,
            "content_count": 0,
            "member_count": 1,
        }
        facets = search_result["facets"]
        assert facets == {
            "members": [
                {
                    "count": 1,
                    "value": {
                        "has_avatar": bob.has_avatar,
                        "has_cover": bob.has_cover,
                        "user_id": bob.user_id,
                        "username": bob.username,
                        "public_name": bob.display_name,
                    },
                }
            ]
        }
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True

    @pytest.mark.parametrize(
        "authorization, query_parameters, expected_workspace_ids",
        [
            (("bob", "password"), {"search_string": "bob_only"}, [1]),
            (("bob", "password"), {"search_string": "bob"}, [1, 2]),
            (("bob", "password"), {"search_string": "bob", "member_ids": [3]}, [2]),
            (("bob", "password"), {"search_string": "bloody"}, [1]),
            (("bob", "password"), {"search_string": "img"}, []),
            (("bob", "password"), {"search_string": "bloody", "search_fields": ["label"]}, []),
            (("riyad", "password"), {"search_string": "bob"}, [2]),
        ],
    )
    def test_api__elasticsearch_workspace_search__ok__nominal_cases(
        self,
        web_testapp,
        authorization: typing.Tuple[str, str],
        query_parameters: dict,
        expected_workspace_ids: typing.List[int],
    ) -> None:
        """Test different search parameters.
        The fixture do create 2 workspaces, the first has only bob as member, the second has
        bob and riyad.
        """
        web_testapp.authorization = ("Basic", authorization)
        search_result = web_testapp.get(
            "/api/advanced_search/workspace".format(), status=200, params=query_parameters
        ).json_body
        assert search_result["total_hits"] == len(expected_workspace_ids)
        assert search_result["is_total_hits_accurate"] is True
        workspace_ids = [w["workspace_id"] for w in search_result["workspaces"]]
        assert workspace_ids == expected_workspace_ids
