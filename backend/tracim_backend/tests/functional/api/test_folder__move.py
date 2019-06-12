import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.error import ErrorCode
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.setup_models import get_tm_session
from tracim_backend.tests import FunctionalTest


class TestFolderMove(FunctionalTest):
    def setUp(self):
        super().setUp()
        self.testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        self.dbsession = get_tm_session(self.session_factory, transaction.manager)
        self.admin = self.dbsession.query(User).filter(User.email == "admin@admin.admin").one()
        self.workspace_api = WorkspaceApi(
            current_user=self.admin, session=self.dbsession, config=self.app_config
        )
        self.content_api = ContentApi(
            current_user=self.admin, session=self.dbsession, config=self.app_config
        )
        self.workspace = self.workspace_api.create_workspace(label="test", save_now=True)
        transaction.commit()

    def test_api__move_folder_into_itself__err_400(self) -> None:
        moved_folder = self.content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=self.workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        move_url = "/api/v2/workspaces/{}/contents/{}/move".format(
            self.workspace.workspace_id, moved_folder.content_id
        )
        body = {
            "new_parent_id": moved_folder.content_id,
            "new_workspace_id": self.workspace.workspace_id,
        }
        response = self.testapp.put_json(move_url, params=body, status=400)
        assert response.json_body["code"] == ErrorCode.CONFLICTING_MOVE_IN_ITSELF

    def test_api__move_folder_in_a_direct_child__err_400(self) -> None:
        moved_folder = self.content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=self.workspace,
            do_save=True,
            do_notify=False,
        )
        child_folder = self.content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=self.workspace,
            parent=moved_folder,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        move_url = "/api/v2/workspaces/{}/contents/{}/move".format(
            self.workspace.workspace_id, moved_folder.content_id
        )
        body = {
            "new_parent_id": child_folder.content_id,
            "new_workspace_id": self.workspace.workspace_id,
        }
        response = self.testapp.put_json(move_url, params=body, status=400)
        assert response.json_body["code"] == ErrorCode.CONFLICTING_MOVE_IN_CHILD

    def test_api__move_folder_in_a_sub_child__err_400(self) -> None:
        moved_folder = self.content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=self.workspace,
            do_save=True,
            do_notify=False,
        )
        child_folder = self.content_api.create(
            label="child_test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=self.workspace,
            parent=moved_folder,
            do_save=True,
            do_notify=False,
        )
        sub_child_folder = self.content_api.create(
            label="sub_child_test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=self.workspace,
            parent=child_folder,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        move_url = "/api/v2/workspaces/{}/contents/{}/move".format(
            self.workspace.workspace_id, moved_folder.content_id
        )
        body = {
            "new_parent_id": sub_child_folder.content_id,
            "new_workspace_id": self.workspace.workspace_id,
        }
        response = self.testapp.put_json(move_url, params=body, status=400)
        assert response.json_body["code"] == ErrorCode.CONFLICTING_MOVE_IN_CHILD
