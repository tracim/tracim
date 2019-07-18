import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.tests.fixtures import *  # noqa:F401,F403


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestFolderMove(object):
    def test_api__move_folder_into_itself__err_400(
        self, content_api_factory, workspace_api_factory, web_testapp, content_type_list
    ) -> None:
        workspace = workspace_api_factory.get().create_workspace(label="test", save_now=True)
        moved_folder = content_api_factory.get().create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        move_url = "/api/v2/workspaces/{}/contents/{}/move".format(
            workspace.workspace_id, moved_folder.content_id
        )
        body = {
            "new_parent_id": moved_folder.content_id,
            "new_workspace_id": workspace.workspace_id,
        }
        response = web_testapp.put_json(move_url, params=body, status=400)
        assert response.json_body["code"] == ErrorCode.CONFLICTING_MOVE_IN_ITSELF

    def test_api__move_folder_in_a_direct_child__err_400(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        workspace = workspace_api_factory.get().create_workspace(label="test", save_now=True)

        moved_folder = content_api_factory.get().create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            do_save=True,
            do_notify=False,
        )
        child_folder = content_api_factory.get().create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=moved_folder,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        move_url = "/api/v2/workspaces/{}/contents/{}/move".format(
            workspace.workspace_id, moved_folder.content_id
        )
        body = {
            "new_parent_id": child_folder.content_id,
            "new_workspace_id": workspace.workspace_id,
        }
        response = web_testapp.put_json(move_url, params=body, status=400)
        assert response.json_body["code"] == ErrorCode.CONFLICTING_MOVE_IN_CHILD

    def test_api__move_folder_in_a_sub_child__err_400(
        self, content_api_factory, workspace_api_factory, web_testapp, content_type_list
    ) -> None:
        workspace = workspace_api_factory.get().create_workspace(label="test", save_now=True)
        moved_folder = content_api_factory.get().create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            do_save=True,
            do_notify=False,
        )
        child_folder = content_api_factory.get().create(
            label="child_test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=moved_folder,
            do_save=True,
            do_notify=False,
        )
        sub_child_folder = content_api_factory.get().create(
            label="sub_child_test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=child_folder,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        move_url = "/api/v2/workspaces/{}/contents/{}/move".format(
            workspace.workspace_id, moved_folder.content_id
        )
        body = {
            "new_parent_id": sub_child_folder.content_id,
            "new_workspace_id": workspace.workspace_id,
        }
        response = web_testapp.put_json(move_url, params=body, status=400)
        assert response.json_body["code"] == ErrorCode.CONFLICTING_MOVE_IN_CHILD
