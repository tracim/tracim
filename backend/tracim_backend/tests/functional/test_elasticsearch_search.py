from parameterized import parameterized
import transaction

from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import FunctionalElasticSearchTest


class TestElasticSearchSearch(FunctionalElasticSearchTest):
    config_section = "functional_test_elasticsearch_search"

    @parameterized.expand(
        [
            # content_name, search_string, nb_content_result, first_content_name
            # exact syntax
            ("testdocument", "testdocument", 1, "testdocument"),
            # autocomplete
            ("testdocument", "testdoc", 1, "testdocument"),
            # # autocomplete with multi result (can't check result order now)
            ("testdocument", "test", 2, None),
        ]
    )
    def test_api___elasticsearch_search_ok__by_label(
        self, content_name, search_string, nb_content_result, first_content_name
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("trusted-users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = ContentApi(session=dbsession, current_user=user, config=self.app_config)
        content1 = api.create(
            content_type_slug="html-document", workspace=workspace, label=content_name, do_save=True
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
        self.refresh_elasticsearch()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        if first_content_name:
            assert search_result["contents"][0]["label"] == first_content_name

    @parameterized.expand(
        [
            # content_name, search_string, nb_content_result, first_content_name
            # exact syntax
            ("good practices", "good practices.document.html", 1, "good practices"),
            # autocomplete
            ("good practices", ".thread", 1, "discussion"),
            # # autocomplete with multi result (can't check result order now)
            ("good practices", ".document", 2, None),
        ]
    )
    def test_api___elasticsearch_search_ok__by_filename(
        self, content_name, search_string, nb_content_result, first_content_name
    ) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("trusted-users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = ContentApi(session=dbsession, current_user=user, config=self.app_config)
        content1 = api.create(
            content_type_slug="html-document", workspace=workspace, label=content_name, do_save=True
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
        self.refresh_elasticsearch()

        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        params = {"search_string": search_string}
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == nb_content_result
        assert search_result["is_total_hits_accurate"] is True
        if first_content_name:
            assert search_result["contents"][0]["label"] == first_content_name

    def test_api___elasticsearch_search_ok__no_search_string(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("trusted-users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = ContentApi(session=dbsession, current_user=user, config=self.app_config)
        api.create(
            content_type_slug="html-document", workspace=workspace, label="test", do_save=True
        )
        self.refresh_elasticsearch()

        transaction.commit()
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 0
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 0

    def test_api___elasticsearch_search_ok__filter_by_content_type(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("trusted-users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = ContentApi(session=dbsession, current_user=user, config=self.app_config)
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
        self.refresh_elasticsearch()
        # get all
        params = {"search_string": "stringtosearch"}
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 4

        params = {"search_string": "stringtosearch", "content_types": "html-document"}
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 2
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 2
        labels = [content["label"] for content in search_result["contents"]]
        assert "stringtosearch doc 2" in labels
        assert "stringtosearch doc" in labels

        params = {"search_string": "stringtosearch", "content_types": "html-document,thread"}
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
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
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"] == "stringtosearch folder"

    def test_api___elasticsearch_search_ok__filter_by_deleted_archived_active(self) -> None:
        dbsession = get_tm_session(self.session_factory, transaction.manager)
        admin = dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        uapi = UserApi(current_user=admin, session=dbsession, config=self.app_config)
        gapi = GroupApi(current_user=admin, session=dbsession, config=self.app_config)
        groups = [gapi.get_one_with_name("trusted-users")]
        user = uapi.create_user(
            "test@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            groups=groups,
        )
        workspace_api = WorkspaceApi(
            current_user=admin, session=dbsession, config=self.app_config, show_deleted=True
        )
        workspace = workspace_api.create_workspace("test", save_now=True)
        rapi = RoleApi(current_user=admin, session=dbsession, config=self.app_config)
        rapi.create_one(user, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        api = ContentApi(session=dbsession, current_user=user, config=self.app_config)
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
        with new_revision(session=dbsession, tm=transaction.manager, content=deleted_content):
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
        with new_revision(session=dbsession, tm=transaction.manager, content=archived_content):
            api.archive(archived_content)
        api.save(archived_content)
        api.execute_update_content_actions(archived_content)
        transaction.commit()
        self.refresh_elasticsearch()
        # get all
        params = {
            "search_string": "stringtosearch",
            "show_deleted": 1,
            "show_archived": 1,
            "show_active": 1,
        }
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 4
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 4

        # get only active
        params = {"search_string": "stringtosearch"}
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
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
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        only_active_search_result = res.json_body
        assert only_active_search_result == default_search_result

        params = {
            "search_string": "stringtosearch",
            "show_active": 1,
            "show_deleted": 1,
            "show_archived": 0,
        }
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
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
        self.testapp.authorization = ("Basic", ("test@test.test", "test@test.test"))
        res = self.testapp.get("/api/v2/search/content".format(), status=200, params=params)
        search_result = res.json_body
        assert search_result
        assert search_result["total_hits"] == 1
        assert search_result["is_total_hits_accurate"] is True
        assert len(search_result["contents"]) == 1
        assert search_result["contents"][0]["label"].startswith("stringtosearch archived")
