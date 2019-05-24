from parameterized import parameterized
import transaction

from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
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
