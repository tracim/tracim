# -*- coding: utf-8 -*-
import io
from urllib.parse import quote

from PIL import Image
import dateutil.parser
from depot.io.utils import FileIntent
import pytest
import responses
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.lib.translate.services.systran import FILE_TRANSLATION_ENDPOINT
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import create_1000px_png_test_image
from tracim_backend.tests.utils import set_html_document_slug_to_legacy
from tracim_backend.views.core_api.schemas import UserDigestSchema


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestFolder(object):
    """
    Tests for /api/workspaces/{workspace_id}/folders/{content_id}
    endpoint
    """

    def test_api__get_folder__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Get one folder content
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "test-folder"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "test-folder"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"] == folder.revision_id
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"]["user_id"] == 1
        assert content["last_modifier"]["public_name"] == "Global manager"
        assert content["last_modifier"]["has_avatar"] is False
        assert content["raw_content"] == ""

    def test_api__get_folder__err_400__wrong_content_type(
        self,
        webdav_testapp,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        content_type_list,
    ) -> None:
        """
        Get one folder of a content content 7 is not folder
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        thread = content_api.create(
            label="thread",
            content_type_slug=content_type_list.Thread.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=thread.content_id
            ),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__get_folder__err_400__content_does_not_exist(
        self, web_testapp, workspace_api_factory
    ) -> None:
        """
        Get one folder content (content 170 does not exist in db)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/170".format(
                workspace_id=test_workspace.workspace_id
            ),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_folder__err_400__content_not_in_workspace(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list
    ) -> None:
        """
        Get one folders of a content (content is in another workspace)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        test_workspace2 = workspace_api.create_workspace(label="test2", save_now=True)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace2.workspace_id, content_id=folder.content_id
            ),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_folder__err_400__workspace_does_not_exist(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list
    ) -> None:
        """
        Get one folder content (Workspace 40 does not exist)
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/40/folders/{content_id}".format(content_id=folder.content_id),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api__get_folder__err_400__workspace_id_is_not_int(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list
    ) -> None:
        """
        Get one folder content, workspace id is not int
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/coucou/folders/{content_id}".format(content_id=folder.content_id),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_INVALID_ID

    def test_api__get_folder__err_400__content_id_is_not_int(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list
    ) -> None:
        """
        Get one folder content, content_id is not int
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/coucou".format(
                workspace_id=test_workspace.workspace_id
            ),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_INVALID_ID

    def test_api__update_folder__err_400__empty_label(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one folder content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "label": "",
            "raw_content": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=400,
        )
        # INFO - G.M - 2018-09-10 - Handled by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__update_folder__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        web_testapp,
        content_type_list,
        event_helper,
    ) -> None:
        """
        Update(put) one html document of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "label": "My New label",
            "description": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }
        headers = {"X-Tracim-ClientToken": "justaclienttoken"}
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=200,
            headers=headers,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["description"] == "<p> Le nouveau contenu </p>"
        assert content["sub_content_types"] == [content_type_list.Folder.slug]

        modified_event = event_helper.last_event
        assert modified_event.client_token == "justaclienttoken"
        assert modified_event.event_type == "content.modified.folder"
        assert modified_event.content == content
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(test_workspace.workspace_id), status=200
        ).json_body
        assert modified_event.workspace == workspace

    def test_api__update_folder__err_400__not_modified(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one html document of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "label": "My New label",
            "description": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["description"] == "<p> Le nouveau contenu </p>"
        assert content["sub_content_types"] == [content_type_list.Folder.slug]

        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.SAME_VALUE_ERROR

    def test_api__update_folder__err_400__allowed_content_changed_only(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one folder but change only allowed content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "label": "My New label",
            "description": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["description"] == "<p> Le nouveau contenu </p>"
        assert content["sub_content_types"] == [content_type_list.Folder.slug]

        params = {
            "label": "My New label",
            "raw_content": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug, content_type_list.Thread.slug],
        }

        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["description"] == "<p> Le nouveau contenu </p>"
        assert set(content["sub_content_types"]) == set(
            [content_type_list.Folder.slug, content_type_list.Thread.slug]
        )

    def test_api__update_folder__err_400__label_changed_only(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one folder but change only allowed content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "label": "My New label",
            "description": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["description"] == "<p> Le nouveau contenu </p>"
        assert content["sub_content_types"] == [content_type_list.Folder.slug]

        params = {
            "label": "My New label 2",
            "raw_content": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }

        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label 2"
        assert content["parent_id"] is None
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label-2"
        assert content["status"] == "open"
        assert content["workspace_id"] == test_workspace.workspace_id
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["description"] == "<p> Le nouveau contenu </p>"
        assert set(content["sub_content_types"]) == set([content_type_list.Folder.slug])

    def test_api__update_folder__err_400__label_already_used(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one html document of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        content_api.create(
            label="already_used",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {
            "label": "already_used",
            "description": "<p> Le nouveau contenu </p>",
            "sub_content_types": [content_type_list.Folder.slug],
        }
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__get_folder_revisions__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one html document of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=folder):
            content_api.update_content(
                folder, new_label="test-folder-updated", new_raw_content="Just a test"
            )
        content_api.save(folder)
        with new_revision(session=session, tm=transaction.manager, content=folder):
            content_api.archive(folder)
        content_api.save(folder)
        with new_revision(session=session, tm=transaction.manager, content=folder):
            content_api.unarchive(folder)
        content_api.save(folder)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/{content_id}/revisions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            status=200,
        )
        revisions = res.json_body
        assert len(revisions) == 4
        revision = revisions[0]
        assert revision["content_type"] == "folder"
        assert revision["content_id"] == folder.content_id
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is False
        assert revision["label"] == "test-folder"
        assert revision["parent_id"] is None
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "test-folder"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == test_workspace.workspace_id
        assert revision["revision_id"]
        assert revision["revision_type"] == "creation"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"

        revision = revisions[1]
        assert revision["content_type"] == "folder"
        assert revision["content_id"] == folder.content_id
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is False
        assert revision["label"] == "test-folder-updated"
        assert revision["parent_id"] is None
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "test-folder-updated"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == test_workspace.workspace_id
        assert revision["revision_id"]
        assert revision["revision_type"] == "edition"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"

        revision = revisions[2]
        assert revision["content_type"] == "folder"
        assert revision["content_id"] == folder.content_id
        assert revision["is_archived"] is True
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is False
        assert revision["label"] != "test-folder-updated"
        assert revision["label"].startswith("test-folder-updated")
        assert revision["parent_id"] is None
        assert revision["show_in_ui"] is True
        assert revision["slug"] != "test-folder-updated"
        assert revision["slug"].startswith("test-folder-updated")
        assert revision["status"] == "open"
        assert revision["workspace_id"] == test_workspace.workspace_id
        assert revision["revision_id"]
        assert revision["revision_type"] == "archiving"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"

        revision = revisions[3]
        assert revision["content_type"] == "folder"
        assert revision["content_id"] == folder.content_id
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is True
        assert revision["label"].startswith("test-folder-updated")
        assert revision["parent_id"] is None
        assert revision["show_in_ui"] is True
        assert revision["slug"].startswith("test-folder-updated")
        assert revision["status"] == "open"
        assert revision["workspace_id"] == test_workspace.workspace_id
        assert revision["revision_id"]
        assert revision["revision_type"] == "unarchiving"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"

    def test_api__set_folder_status__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, web_testapp, content_type_list
    ) -> None:
        """
        Get one folder content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "closed-deprecated"}

        # before
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["status"] == "open"

        # set status
        web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}/status".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=204,
        )

        # after
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/folders/{content_id}".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert content["content_type"] == "folder"
        assert content["content_id"] == folder.content_id
        assert content["status"] == "closed-deprecated"

    def test_api__set_folder_status__err_400__wrong_status(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list
    ) -> None:
        """
        Get one folder content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "unexistant-status"}

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        res = web_testapp.put_json(
            "/api/workspaces/{workspace_id}/folders/{content_id}/status".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            params=params,
            status=400,
        )
        # TODO - G.M - 2018-09-10 - handle by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestHtmlDocuments(object):
    """
    Tests for /api/workspaces/{workspace_id}/html-documents/{content_id}
    endpoint
    """

    def test_api__get_html_document__ok_200__legacy_slug(
        self, web_testapp, session_factory
    ) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        set_html_document_slug_to_legacy(session_factory)
        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "Tiramisu Recipe"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "tiramisu-recipe"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 27
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] != content["author"]
        assert content["last_modifier"]["user_id"] == 3
        assert content["last_modifier"]["public_name"] == "Bob i."
        assert content["last_modifier"]["username"] == "TheBobi"
        assert content["last_modifier"]["has_avatar"] is False
        assert (
            content["raw_content"] == "<p>To cook a great Tiramisu, you need many ingredients.</p>"
        )
        assert content["file_extension"] == ".document.html"

    def test_api__get_html_document__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "Tiramisu Recipe"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "tiramisu-recipe"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 27
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] != content["author"]
        assert content["last_modifier"]["user_id"] == 3
        assert content["last_modifier"]["public_name"] == "Bob i."
        assert content["last_modifier"]["username"] == "TheBobi"
        assert content["last_modifier"]["has_avatar"] is False
        assert (
            content["raw_content"] == "<p>To cook a great Tiramisu, you need many ingredients.</p>"
        )
        assert content["file_extension"] == ".document.html"

    def test_api__get_html_document__ok_200__archived_content(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json("/api/workspaces/2/contents/6/archived", status=204)
        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is True

    def test_api__get_html_document__ok_200__deleted_content(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put_json("/api/workspaces/2/contents/6/trashed", status=204)
        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_deleted"] is True

    def test_api__get_html_document__err_400__wrong_content_type(self, web_testapp) -> None:
        """
        Get one html document of a content content 7 is not html_document
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/html-documents/7", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__get_html_document__err_400__content_does_not_exist(self, web_testapp) -> None:
        """
        Get one html document of a content (content 170 does not exist in db
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/html-documents/170", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_html_document__err_400__content_not_in_workspace(self, web_testapp) -> None:
        """
        Get one html document of a content (content 6 is in workspace 2)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/html-documents/6", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_html_document__err_400__workspace_does_not_exist(self, web_testapp) -> None:
        """
        Get one html document of a content (Workspace 40 does not exist)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/40/html-documents/6", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api__get_html_document__err_400__workspace_id_is_not_int(self, web_testapp) -> None:
        """
        Get one html document of a content, workspace id is not int
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/coucou/html-documents/6", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_INVALID_ID

    def test_api__get_html_document__err_400__content_id_is_not_int(self, web_testapp) -> None:
        """
        Get one html document of a content, content_id is not int
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/html-documents/coucou", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_INVALID_ID

    @pytest.mark.parametrize("content_raw_data", ["<b>a first html comment</b>"])
    def test_api__get_html_document_html_preview__ok__200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        content_raw_data,
    ) -> None:
        """
        get thread html preview
        """
        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        content_api = content_api_factory.get()
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=business_workspace,
            label="test_html_page",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_html_document):
            content_api.update_content(
                test_html_document, "test_page", new_raw_content=content_raw_data
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}/preview/html/".format(
                test_html_document.content_id
            ),
            status=200,
        )
        binary_content_raw_data = test_html_document.raw_content.encode("utf-8")
        assert res.body == binary_content_raw_data
        assert res.content_length == len(binary_content_raw_data)
        assert res.charset == "UTF-8"
        assert res.content_type == "text/html"

    def test_api__update_html_document__err_400__empty_label(self, web_testapp) -> None:
        """
        Update(put) one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "", "raw_content": "<p> Le nouveau contenu </p>"}

        res = web_testapp.put_json("/api/workspaces/2/html-documents/6", params=params, status=400)
        # INFO - G.M - 2018-09-10 -  Handled by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__update_html_document__err_400__mention_user_not_member(
        self, web_testapp, html_with_nasty_mention
    ) -> None:
        """
        Update(put) one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "", "raw_content": html_with_nasty_mention}

        res = web_testapp.put_json("/api/workspaces/2/html-documents/6", params=params, status=400)
        # INFO - G.M - 2018-09-10 -  Handled by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__update_html_document__ok_200__nominal_case(
        self, web_testapp, event_helper
    ) -> None:
        """
        Update(put) one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json("/api/workspaces/2/html-documents/6", params=params, status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["file_extension"] == ".document.html"
        assert content["current_revision_type"] == "edition"

        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["file_extension"] == ".document.html"
        assert content["current_revision_type"] == "edition"

        modified_event = event_helper.last_event
        assert modified_event.event_type == "content.modified.html-document"
        # NOTE S.G 2020-05-12: allow a small difference in modified time
        # as tests with MySQL sometimes fails with a strict equality
        event_content_modified = dateutil.parser.isoparse(modified_event.content["modified"])
        content_modified = dateutil.parser.isoparse(content["modified"])
        modified_diff = (event_content_modified - content_modified).total_seconds()
        assert abs(modified_diff) < 2
        assert modified_event.content["current_revision_type"] == content["current_revision_type"]
        assert modified_event.content["file_extension"] == content["file_extension"]
        assert modified_event.content["filename"] == content["filename"]
        assert modified_event.content["is_archived"] == content["is_archived"]
        assert modified_event.content["is_editable"] == content["is_editable"]
        assert modified_event.content["is_deleted"] == content["is_deleted"]
        assert modified_event.content["label"] == content["label"]
        assert modified_event.content["parent_id"] == content["parent_id"]
        assert modified_event.content["show_in_ui"] == content["show_in_ui"]
        assert modified_event.content["slug"] == content["slug"]
        assert modified_event.content["status"] == content["status"]
        assert modified_event.content["sub_content_types"] == content["sub_content_types"]
        assert modified_event.content["workspace_id"] == content["workspace_id"]
        workspace = web_testapp.get("/api/workspaces/2", status=200).json_body
        assert modified_event.workspace == workspace

    def test_api__update_html_document__err_400__not_editable(self, web_testapp) -> None:
        """
        Update(put) one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "closed-deprecated"}
        web_testapp.put_json("/api/workspaces/2/html-documents/6/status", params=params, status=204)

        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu ! </p>"}
        res = web_testapp.put_json("/api/workspaces/2/html-documents/6", params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_html_document__err_400__not_modified(self, web_testapp) -> None:
        """
        Update(put) one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json("/api/workspaces/2/html-documents/6", params=params, status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"

        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"

        res = web_testapp.put_json("/api/workspaces/2/html-documents/6", params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.SAME_VALUE_ERROR

    def test_api__get_html_document_revision__ok_200__nominal_case(
        self, web_testapp, workspace_api_factory, content_api_factory, content_type_list, session,
    ) -> None:
        """
        Get a specific revision of an html content
        """
        content_label = "test_page"
        content_raw_content = "<b>html content</b>"
        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        content_api = content_api_factory.get()
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=business_workspace,
            label=content_label,
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_html_document):
            content_api.update_content(
                test_html_document, content_label, new_raw_content=content_raw_content
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/html-documents/{}/revisions/{}".format(
                business_workspace.workspace_id,
                test_html_document.content_id,
                test_html_document.revision_id,
            ),
            status=200,
        )
        revision = res.json_body
        assert revision["content_type"] == "html-document"
        assert revision["content_id"] == test_html_document.content_id
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is True
        assert revision["label"] == content_label
        assert revision["parent_id"] is None
        assert revision["show_in_ui"] is True
        assert revision["status"] == "open"
        assert revision["workspace_id"] == business_workspace.workspace_id
        assert revision["revision_id"] == test_html_document.revision_id
        assert revision["revision_type"] == "edition"
        assert revision["sub_content_types"]
        assert revision["comment_ids"] == []
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"

    def test_api__get_html_document_revisions__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/html-documents/6/revisions", status=200)
        revisions = res.json_body
        assert len(revisions) == 3
        revision = revisions[0]
        assert revision["content_type"] == "html-document"
        assert revision["content_id"] == 6
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is False
        assert revision["label"] == "Tiramisu Recipes!!!"
        assert revision["parent_id"] == 3
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "tiramisu-recipes"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == 2
        assert revision["revision_id"] == 6
        assert revision["revision_type"] == "creation"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"
        revision = revisions[1]
        assert revision["content_type"] == "html-document"
        assert revision["content_id"] == 6
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is False
        assert revision["label"] == "Tiramisu Recipes!!!"
        assert revision["parent_id"] == 3
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "tiramisu-recipes"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == 2
        assert revision["revision_id"] == 7
        assert revision["revision_type"] == "edition"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"
        revision = revisions[2]
        assert revision["content_type"] == "html-document"
        assert revision["content_id"] == 6
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is True
        assert revision["label"] == "Tiramisu Recipe"
        assert revision["parent_id"] == 3
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "tiramisu-recipe"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == 2
        assert revision["revision_id"] == 27
        assert revision["revision_type"] == "edition"
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 3
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Bob i."
        assert revision["file_extension"] == ".document.html"

    def test_api__set_html_document_status__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "closed-deprecated"}

        # before
        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["status"] == "open"

        # set status
        web_testapp.put_json("/api/workspaces/2/html-documents/6/status", params=params, status=204)

        # after
        res = web_testapp.get("/api/workspaces/2/html-documents/6", status=200)
        content = res.json_body
        assert content["content_type"] == "html-document"
        assert content["content_id"] == 6
        assert content["status"] == "closed-deprecated"

    def test_api__set_html_document_status__err_400__wrong_status(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "unexistant-status"}
        res = web_testapp.put_json(
            "/api/workspaces/2/html-documents/6/status", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__set_document_status__err_400__same_status(self, web_testapp) -> None:

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "open"}
        res = web_testapp.put_json(
            "/api/workspaces/2/html-documents/6/status", params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INVALID_STATUS_CHANGE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize(
    "config_section",
    [
        {"name": "functional_test"},
        {"name": "functional_s3_storage_test"},
        {"name": "functional_memory_storage_test"},
    ],
    indirect=True,
)
class TestFiles(object):
    """
    Tests for /api/workspaces/{workspace_id}/files/{content_id}
    endpoint
    """

    def test_api__get_file__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
            session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "Test_file"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "test-file"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p>description</p>"
        assert content["mimetype"] == "plain/text"
        assert content["size"] == len(b"Test file")
        assert content["file_extension"] == ".txt"
        assert content["filename"] == "Test_file.txt"
        assert content["page_nb"] == 1
        assert content["has_pdf_preview"] is True
        assert content["has_jpeg_preview"] is True

    def test_api__get_file__ok_200__no_file_add(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "Test file"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "test-file"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == ""
        assert content["mimetype"] == ""
        assert content["file_extension"] == ""
        assert content["filename"] == "Test file"
        assert content["size"] == 0
        assert content["page_nb"] is None
        assert content["has_pdf_preview"] is False
        assert content["has_jpeg_preview"] is False

    def test_api__get_file__ok_200__binary_file(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file,
                "Test_file.bin",
                new_mimetype="application/octet-stream",
                new_content=bytes(100),
            )
        content_api.save(test_file)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "Test_file"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "test-file"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == ""
        assert content["mimetype"] == "application/octet-stream"
        assert content["size"] == 100
        assert content["file_extension"] == ".bin"
        assert content["filename"] == "Test_file.bin"
        assert content["page_nb"] is None
        assert content["has_pdf_preview"] is False
        assert content["has_jpeg_preview"] is False

    def test_api__get_files__err_400__wrong_content_type(self, web_testapp) -> None:
        """
        Get one file of a content content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/files/6", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__get_file__err_400__content_does_not_exist(self, web_testapp) -> None:
        """
        Get one file (content 170 does not exist in db
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/files/170", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_file__err_400__content_not_in_workspace(self, web_testapp) -> None:
        """
        Get one file (content 9 is in workspace 2)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/files/9", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_file__err_400__workspace_does_not_exist(self, web_testapp) -> None:
        """
        Get one file (Workspace 40 does not exist)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/40/files/9", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api__get_file__err_400__workspace_id_is_not_int(self, web_testapp) -> None:
        """
        Get one file, workspace id is not int
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/coucou/files/9", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_INVALID_ID

    def test_api__get_file__err_400__content_id_is_not_int(self, web_testapp) -> None:
        """
        Get one file, content_id is not int
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/files/coucou", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_INVALID_ID

    def test_api__update_file_info_err_400__empty_label(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
            session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=400
        )
        # INFO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__update_file_info__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with session.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label="Test file",
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=200
        )
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["mimetype"] == "plain/text"
        assert content["size"] == len(b"Test file")
        assert content["page_nb"] == 1
        assert content["has_pdf_preview"] is True
        assert content["has_jpeg_preview"] is True
        assert content["current_revision_type"] == "edition"

        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["mimetype"] == "plain/text"
        assert content["size"] == len(b"Test file")
        assert content["page_nb"] == 1
        assert content["has_pdf_preview"] is True
        assert content["has_jpeg_preview"] is True
        assert content["current_revision_type"] == "edition"

    def test_api__update_file_info__err_400__content_status_closed(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with session.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label="Test file",
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        test_file.status = "closed-validated"
        content_api.save(test_file)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_file_info__err_400__content_deleted(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get(show_deleted=True)
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with session.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label="Test file",
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
            test_file.is_deleted = True
        content_api.save(test_file)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_file_info__err_400__content_archived(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get(show_deleted=True)
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        with session.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label="Test file",
                do_save=False,
                do_notify=False,
            )
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
            test_file.is_archived = True
        content_api.save(test_file)
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    def test_api__update_file_info__err_400__not_modified(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=200
        )
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["mimetype"] == "plain/text"
        assert content["size"] == len(b"Test file")
        assert content["page_nb"] == 1
        assert content["has_pdf_preview"] is True
        assert content["has_jpeg_preview"] is True

        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 1
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 1
        assert content["current_revision_id"]
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["mimetype"] == "plain/text"
        assert content["size"] == len(b"Test file")
        assert content["page_nb"] == 1
        assert content["has_pdf_preview"] is True
        assert content["has_jpeg_preview"] is True

        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=400
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.SAME_VALUE_ERROR

    def test_api__update_file_info__err_400__label_already_used(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Update(put) one file, failed because label already used
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="folder_used",
            do_save=True,
            do_notify=False,
        )
        with session.no_autoflush:
            test_file = content_api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=business_workspace,
                parent=tool_folder,
                label="Test file",
                do_save=False,
                do_notify=False,
            )
            test_file.file_extension = ".txt"
            test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        test_file2 = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            filename="already_used.txt",
            do_save=False,
            do_notify=False,
        )
        test_file2.file_extension = ".txt"
        test_file2.depot_file = FileIntent(b"Test file", "already_used.txt", "text/plain")
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "folder_used", "raw_content": "<p> Le nouveau contenu </p>"}
        web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=200
        )
        params = {"label": "already_used", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}".format(test_file.content_id), params=params, status=400
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__get_file_revisions__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get file revisions
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
            session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/revisions".format(test_file.content_id), status=200
        )
        revisions = res.json_body
        assert len(revisions) == 1
        revision = revisions[0]
        assert revision["content_type"] == "file"
        assert revision["content_id"] == test_file.content_id
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is True
        assert revision["label"] == "Test_file"
        assert revision["parent_id"] == 1
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "test-file"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == 1
        assert revision["revision_id"]
        assert revision["sub_content_types"]
        # TODO - G.M - 2018-06-173 - Test with real comments
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"
        assert revision["mimetype"] == "plain/text"
        assert revision["size"] == len(b"Test file")
        assert revision["page_nb"] == 1
        assert revision["has_pdf_preview"] is True

    def test_api__set_file_status__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        set file status
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "closed-deprecated"}

        # before
        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["status"] == "open"

        # set status
        web_testapp.put_json(
            "/api/workspaces/1/files/{}/status".format(test_file.content_id),
            params=params,
            status=204,
        )

        # after
        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["status"] == "closed-deprecated"

    def test_api__set_file_status__err_400__wrong_status(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        set file status
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "unexistant-status"}

        # before
        res = web_testapp.get("/api/workspaces/1/files/{}".format(test_file.content_id), status=200)
        content = res.json_body
        assert content["content_type"] == "file"
        assert content["content_id"] == test_file.content_id
        assert content["status"] == "open"

        # set status
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}/status".format(test_file.content_id),
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__get_file_raw__ok_200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
            session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        filename = "Test_file.txt"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, filename), status=200
        )
        assert res.body == b"Test file"
        assert res.content_type == "text/plain"
        assert res.content_length == len(b"Test file")
        assert int(res.headers["Content-Length"]) == res.content_length
        assert res.last_modified.second == test_file.updated.second
        assert res.last_modified.minute == test_file.updated.minute
        assert res.last_modified.day == test_file.updated.day
        assert res.last_modified.month == test_file.updated.month
        assert res.last_modified.year == test_file.updated.year

    def test_api__get_file_raw__ok_200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file,
                new_content=b"Test file",
                new_filename="Test_file.txt",
                new_mimetype="text/plain",
            )
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"force_download": 1}
        filename = "Test_file.txt"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, filename),
            status=200,
            params=params,
        )
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)
        assert res.body == b"Test file"
        assert res.content_type == "text/plain"
        assert res.content_length == len(b"Test file")
        assert int(res.headers["Content-Length"]) == res.content_length
        assert res.last_modified.second == test_file.updated.second
        assert res.last_modified.minute == test_file.updated.minute
        assert res.last_modified.day == test_file.updated.day
        assert res.last_modified.month == test_file.updated.month
        assert res.last_modified.year == test_file.updated.year

    @pytest.mark.parametrize("content_namespace", ["content", "publication"])
    def test_api__create_file__ok__200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        event_helper,
        content_namespace: str,
    ) -> None:
        """
        create one file of a content at workspace root
        """

        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.get_one(1)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            params={"content_namespace": content_namespace},
            status=200,
        )
        res = res.json_body
        assert res["parent_id"] is None
        assert res["content_type"] == "file"
        assert res["is_archived"] is False
        assert res["is_deleted"] is False
        assert res["is_editable"] is True
        assert res["content_namespace"] == content_namespace
        assert res["workspace_id"] == business_workspace.workspace_id
        assert isinstance(res["content_id"], int)
        content_id = res["content_id"]
        assert res["status"] == "open"
        assert res["label"] == "test_image"
        assert res["slug"] == "test-image"
        # A creation is in fact two events: created + modified to add the revision
        (created_event, modified_event) = event_helper.last_events(2)
        assert created_event.event_type == "content.created.file"
        author = web_testapp.get("/api/users/1", status=200).json_body
        assert created_event.author == UserDigestSchema().dump(author).data
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(business_workspace.workspace_id), status=200
        ).json_body
        assert created_event.workspace == workspace

        assert modified_event.event_type == "content.modified.file"
        content = web_testapp.get(
            "/api/workspaces/{}/files/{}".format(business_workspace.workspace_id, content_id),
            status=200,
        ).json_body

        # NOTE S.G 2020-05-12: allow a small difference in modified time
        # as tests with MySQL sometimes fails with a strict equality
        event_content_modified = dateutil.parser.isoparse(modified_event.content["modified"])
        content_modified = dateutil.parser.isoparse(res["modified"])
        modified_diff = (event_content_modified - content_modified).total_seconds()
        assert abs(modified_diff) < 2
        assert modified_event.content["file_extension"] == res["file_extension"]
        assert modified_event.content["filename"] == res["filename"]
        assert modified_event.content["is_archived"] == res["is_archived"]
        assert modified_event.content["is_editable"] == res["is_editable"]
        assert modified_event.content["is_deleted"] == res["is_deleted"]
        assert modified_event.content["label"] == res["label"]
        assert modified_event.content["parent_id"] == res["parent_id"]
        assert modified_event.content["show_in_ui"] == res["show_in_ui"]
        assert modified_event.content["slug"] == res["slug"]
        assert modified_event.content["status"] == res["status"]
        assert modified_event.content["sub_content_types"] == res["sub_content_types"]
        assert modified_event.content["workspace_id"] == res["workspace_id"]

        assert modified_event.workspace == workspace

        assert content["parent_id"] is None
        assert content["content_type"] == "file"
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["content_namespace"] == content_namespace
        assert content["workspace_id"] == business_workspace.workspace_id
        assert isinstance(content["content_id"], int)
        assert content["status"] == "open"
        assert content["label"] == "test_image"
        assert content["slug"] == "test-image"
        assert content["author"]["user_id"] == admin_user.user_id
        assert content["page_nb"] == 1
        assert content["mimetype"] == "image/png"

    def test_api__create_file__err_400__filename_already_used(
        self, workspace_api_factory, content_api_factory, session, web_testapp
    ) -> None:
        """
        create one file of a content but filename is already used here
        """

        workspace_api = workspace_api_factory.get()

        business_workspace = workspace_api.get_one(1)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=200,
        )
        res = res.json_body
        assert res["parent_id"] is None
        assert res["content_type"] == "file"
        assert res["is_archived"] is False
        assert res["is_deleted"] is False
        assert res["is_editable"] is True
        assert res["workspace_id"] == business_workspace.workspace_id
        assert isinstance(res["content_id"], int)
        assert res["status"] == "open"
        assert res["label"] == "test_image"
        assert res["slug"] == "test-image"

        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__create_file__err_400__no_file_given(
        self, workspace_api_factory, content_api_factory, session, web_testapp
    ) -> None:
        """
        create one file of a content but no input file given
        """

        workspace_api = workspace_api_factory.get()

        business_workspace = workspace_api.get_one(1)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id), status=400
        )
        assert res.json_body["code"] == ErrorCode.NO_FILE_VALIDATION_ERROR

    def test_api__create_file__ok__200__in_folder(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
    ) -> None:
        """
        create one file of a content in a folder
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=business_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"parent_id": folder.content_id}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            params=params,
            status=200,
        )
        res = res.json_body
        assert res["parent_id"] == folder.content_id
        assert res["content_type"] == "file"
        assert res["is_archived"] is False
        assert res["is_deleted"] is False
        assert res["is_editable"] is True
        assert res["workspace_id"] == business_workspace.workspace_id
        assert isinstance(res["content_id"], int)
        content_id = res["content_id"]
        assert res["status"] == "open"
        assert res["label"] == "test_image"
        assert res["slug"] == "test-image"

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/files/{content_id}".format(
                workspace_id=business_workspace.workspace_id, content_id=content_id
            ),
            status=200,
        )

        res = res.json_body
        assert res["parent_id"] == folder.content_id
        assert res["content_type"] == "file"
        assert res["is_archived"] is False
        assert res["is_deleted"] is False
        assert res["is_editable"] is True
        assert res["workspace_id"] == business_workspace.workspace_id
        assert isinstance(res["content_id"], int)
        assert res["status"] == "open"
        assert res["label"] == "test_image"
        assert res["slug"] == "test-image"
        assert res["author"]["user_id"] == admin_user.user_id
        assert res["page_nb"] == 1
        assert res["mimetype"] == "image/png"

    def test_api__create_file__ok__200__in_file(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
    ) -> None:
        """
        create one file content in another file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        parent_file = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"parent_id": parent_file.content_id}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            params=params,
            status=200,
        )
        res = res.json_body
        assert res["parent_id"] == parent_file.content_id
        assert res["content_type"] == "file"
        assert res["is_archived"] is False
        assert res["is_deleted"] is False
        assert res["is_editable"] is True
        assert res["workspace_id"] == business_workspace.workspace_id
        assert isinstance(res["content_id"], int)
        content_id = res["content_id"]
        assert res["status"] == "open"
        assert res["label"] == "test_image"
        assert res["slug"] == "test-image"

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/files/{content_id}".format(
                workspace_id=business_workspace.workspace_id, content_id=content_id
            ),
            status=200,
        )

        res = res.json_body
        assert res["parent_id"] == parent_file.content_id
        assert res["content_type"] == "file"
        assert res["is_archived"] is False
        assert res["is_deleted"] is False
        assert res["is_editable"] is True
        assert res["workspace_id"] == business_workspace.workspace_id
        assert isinstance(res["content_id"], int)
        assert res["status"] == "open"
        assert res["label"] == "test_image"
        assert res["slug"] == "test-image"
        assert res["author"]["user_id"] == admin_user.user_id
        assert res["page_nb"] == 1
        assert res["mimetype"] == "image/png"

    def test_api__create_file__err__400__unallow_subcontent(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        create one file of a content but subcontent of type file unallowed here
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=business_workspace,
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=folder):
            content_api.set_allowed_content(folder, [])
        content_api.save(folder)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"parent_id": folder.content_id}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.UNALLOWED_SUBCONTENT

    def test_api__create_file__err__400__parent_not_found(
        self, workspace_api_factory, content_api_factory, session, web_testapp
    ) -> None:
        """
        create one file of a content but parent_id is not valid
        """

        workspace_api = workspace_api_factory.get()

        business_workspace = workspace_api.get_one(1)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"parent_id": 3000}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            params=params,
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.PARENT_NOT_FOUND

    def test_api__set_file_raw__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        event_helper,
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get("/api/workspaces/1/files/{}".format(content_id), status=200).json_body
        last_event = event_helper.last_event
        assert last_event.event_type == "content.modified.file"
        assert last_event.content["actives_shares"] == res["actives_shares"]
        assert last_event.content["content_id"] == content_id
        assert last_event.content["content_namespace"] == res["content_namespace"]
        assert last_event.content["content_type"] == res["content_type"]
        assert last_event.content["current_revision_id"] == res["current_revision_id"]
        assert last_event.content["created"] == res["created"]
        # NOTE S.G 2020-05-12: allow a small difference in modified time
        # as tests with MySQL sometimes fails with a strict equality
        event_content_modified = dateutil.parser.isoparse(last_event.content["modified"])
        content_modified = dateutil.parser.isoparse(res["modified"])
        modified_diff = (event_content_modified - content_modified).total_seconds()
        assert abs(modified_diff) < 2
        assert last_event.content["file_extension"] == res["file_extension"]
        assert last_event.content["filename"] == res["filename"]
        assert last_event.content["is_archived"] == res["is_archived"]
        assert last_event.content["is_editable"] == res["is_editable"]
        assert last_event.content["is_deleted"] == res["is_deleted"]
        assert last_event.content["label"] == res["label"]
        assert last_event.content["parent_id"] == res["parent_id"]
        assert last_event.content["show_in_ui"] == res["show_in_ui"]
        assert last_event.content["slug"] == res["slug"]
        assert last_event.content["status"] == res["status"]
        assert last_event.content["sub_content_types"] == res["sub_content_types"]
        assert last_event.content["workspace_id"] == res["workspace_id"]
        author = web_testapp.get("/api/users/1", status=200).json_body
        assert last_event.author == UserDigestSchema().dump(author).data
        workspace = web_testapp.get("/api/workspaces/1", status=200,).json_body
        assert last_event.workspace == workspace

        res = web_testapp.get(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name), status=200
        )
        assert res.body == image.getvalue()
        assert res.content_type == "image/png"
        assert res.content_length == len(image.getvalue())

    def test_api__set_file_raw__err_400__no_file_given(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content to no file: error
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, "toto.jpg"), status=400
        )
        assert res.json_body["code"] == ErrorCode.NO_FILE_VALIDATION_ERROR

    def test_api__set_file_raw__ok_200__filename_already_used(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file_2 = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file2",
            do_save=False,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        content2_id = int(test_file_2.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content2_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__set_file_raw__err_400__closed_status_file(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.status = "closed-validated"
        content_api.save(test_file)
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_IN_NOT_EDITABLE_STATE

    @pytest.mark.xfail(raises=AssertionError, reason="Broken feature dues to pyramid behaviour")
    def test_api__set_file_raw__err_400_not_modified(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name), status=200
        )
        assert res.body == image.getvalue()
        assert res.content_type == "image/png"
        assert res.content_length == len(image.getvalue())

        res = web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status="*",
        )
        assert res.status == 400
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.CONTENT_FILENAME_ALREADY_USED_IN_FOLDER

    def test_api__get_allowed_size_dim__ok__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        content_id = int(test_file.content_id)
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/allowed_dims".format(content_id), status=200
        )
        res = res.json_body
        assert res["restricted"] is True
        assert len(res["dimensions"]) == 1
        dim = res["dimensions"][0]
        assert dim["width"] == 256
        assert dim["height"] == 256

    def test_api__get_jpeg_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/".format(content_id), status=200
        )
        assert res.body != image.getvalue()
        assert res.content_type == "image/jpeg"

    def test_api__get_jpeg_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        params = {"force_download": 1}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/raw".format(content_id),
            status=200,
            params=params,
        )
        filename = "test_image_page_1.jpg"
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)
        assert res.body != image.getvalue()
        assert res.content_type == "image/jpeg"

    def test_api__get_jpeg_preview__err_400__UnavailablePreview(
        self, workspace_api_factory, content_api_factory, web_testapp, session, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file,
                "Test_file.bin",
                new_mimetype="application/octet-stream",
                new_content=bytes(100),
            )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"force_download": 0}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/".format(content_id), status=400, params=params,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.UNAIVALABLE_PREVIEW

    def test_api__get_sized_jpeg_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/256x256/{}".format(content_id, image.name),
            status=200,
        )
        assert res.body != image.getvalue()
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__err_400__UnavailablePreview(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Set one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file,
                "Test_file.bin",
                new_mimetype="application/octet-stream",
                new_content=bytes(100),
            )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"force_download": 0}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/256x256/{}".format(content_id, "Test_file.bin"),
            status=400,
            params=params,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.UNAIVALABLE_PREVIEW

    def test_api__get_sized_jpeg_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        params = {"force_download": 1}
        dl_filename = "test_image_page_1_256x256.jpg"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/256x256/{}".format(content_id, dl_filename),
            status=200,
            params=params,
        )
        assert res.body != image.getvalue()
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(dl_filename, dl_filename)
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__ok__200__force_download_case_no_filename(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        params = {"force_download": 1}
        dl_filename = "test_image_page_1_256x256.jpg"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/256x256/".format(content_id),
            status=200,
            params=params,
        )
        assert res.body != image.getvalue()
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(dl_filename, dl_filename)
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__ok__200__force_download_case_filename_is_raw(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        params = {"force_download": 1}
        dl_filename = "test_image_page_1_256x256.jpg"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/256x256/raw".format(content_id),
            status=200,
            params=params,
        )
        assert res.body != image.getvalue()
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(dl_filename, dl_filename)
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_preview__err__400__SizeNotAllowed(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        filename = "test_image_512x512.jpg"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/jpg/512x512/{}".format(content_id, filename),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.PREVIEW_DIM_NOT_ALLOWED

    def test_api__get_sized_jpeg_revision_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 revision preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        filename = "test_file.txt"
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=filename
            ),
            status=200,
        )
        assert res.content_type == "text/plain"
        filename = "test_image_256x256.jpg"
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/jpg/256x256/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=filename
            ),
            status=200,
        )
        assert res.body != image.getvalue()
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_sized_jpeg_revision_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get 256x256 revision preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=image.name
            ),
            status=200,
        )
        assert res.content_type == "text/plain"
        params = {"force_download": 1}
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/jpg/256x256/".format(
                content_id=content_id, revision_id=revision_id
            ),
            status=200,
            params=params,
        )
        filename = "Test file_r{}_page_1_256x256.jpg".format(revision_id)
        urlencoded_filename = quote(filename)
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(
            filename, urlencoded_filename
        )
        assert res.body != image.getvalue()
        assert res.content_type == "image/jpeg"
        new_image = Image.open(io.BytesIO(res.body))
        assert 256, 256 == new_image.size

    def test_api__get_full_pdf_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get full pdf preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            test_file.file_extension = ".txt"
            test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, test_file.file_name),
            upload_files=[("files", test_file.file_name, test_file.depot_file.file.read())],
            status=204,
        )
        filename = "test_image.pdf"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/full/{}".format(content_id, filename),
            status=200,
        )
        assert res.content_type == "application/pdf"

    def test_api__get_full_pdf_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get full pdf preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            test_file.file_extension = ".txt"
            test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        filename = "Test_file.txt"
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, filename),
            upload_files=[("files", test_file.file_name, test_file.depot_file.file.read())],
            status=204,
        )
        params = {"force_download": 1}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/full/{}".format(content_id, filename),
            status=200,
            params=params,
        )
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)
        assert res.content_type == "application/pdf"

        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/full/{}".format(content_id, "Test_file.pdf"),
            status=200,
            params=params,
        )
        filename = "Test_file.pdf"
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)
        assert res.content_type == "application/pdf"

    def test_api__get_full_pdf_preview__err__400__png_UnavailablePreviewType(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
       get full pdf preview of a png image -> error UnavailablePreviewType
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/full/{}".format(content_id, image.name),
            status=400,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.UNAVAILABLE_PREVIEW_TYPE

    def test_api__get_full_pdf_preview__err__400__png_UnavailablePreview(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
       get full pdf preview of a png image -> error UnavailablePreviewType
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file,
                "Test_file.bin",
                new_mimetype="application/octet-stream",
                new_content=bytes(100),
            )
        session.flush()
        content_id = test_file.content_id
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        filename = "Test_file.bin"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/full/{}".format(content_id, filename),
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.UNAIVALABLE_PREVIEW

    def test_api__get_pdf_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get full pdf preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            test_file.file_extension = ".txt"
            test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, test_file.file_name),
            upload_files=[("files", test_file.file_name, test_file.depot_file.file.read())],
            status=204,
        )
        params = {"page": 1}
        filename = "test_file.pdf"
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/{}".format(content_id, filename),
            status=200,
            params=params,
        )
        assert res.content_type == "application/pdf"

    def test_api__get_pdf_preview_err__400__UnavailablePreview(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get full pdf preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file,
                "Test_file.bin",
                new_mimetype="application/octet-stream",
                new_content=bytes(100),
            )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"page": 1}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/".format(content_id), status=400, params=params,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.UNAIVALABLE_PREVIEW

    def test_api__get_pdf_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get full pdf preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            test_file.file_extension = ".txt"
            test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        filename = "test_file.txt"
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, filename),
            upload_files=[("files", test_file.file_name, test_file.depot_file.file.read())],
            status=204,
        )
        filename = "Test_file_page_1.pdf"
        params = {"page": 1, "force_download": 1}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/{}".format(content_id, filename),
            status=200,
            params=params,
        )
        assert res.content_type == "application/pdf"
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)

    def test_api__get_pdf_preview__ok__err__400_page_of_preview_not_found(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get full pdf preview of a txt file
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            test_file.file_extension = ".txt"
            test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/".format(content_id),
            upload_files=[("files", test_file.file_name, test_file.depot_file.file.read())],
            status=204,
        )
        params = {"page": 2}
        res = web_testapp.get(
            "/api/workspaces/1/files/{}/preview/pdf/".format(content_id), status=400, params=params,
        )
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.PAGE_OF_PREVIEW_NOT_FOUND

    def test_api__get_pdf_revision_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get pdf revision preview of content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        filename = image.name
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=filename
            ),
            status=200,
        )
        assert res.content_type == "text/plain"
        params = {"page": 1}
        filename = "test_image__page_1.pdf"
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/{filename}".format(
                content_id=content_id, revision_id=revision_id, params=params, filename=filename
            ),
            status=200,
        )
        assert res.content_type == "application/pdf"

    def test_api__get_full_pdf_revision_preview__ok__200__nominal_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get pdf revision preview of content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/".format(
                content_id=content_id, revision_id=revision_id
            ),
            status=200,
        )
        assert res.content_type == "text/plain"
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/full/".format(
                content_id=content_id, revision_id=revision_id
            ),
            status=200,
        )
        assert res.content_type == "application/pdf"

    def test_api__get_full_pdf_revision_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get pdf revision preview of content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=image.name
            ),
            status=200,
        )
        assert res.content_type == "text/plain"
        params = {"force_download": 1}
        filename = "Test_file.pdf"
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/full/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename="Test_file.pdf"
            ),
            status=200,
            params=params,
        )

        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)
        assert res.content_type == "application/pdf"

    def test_api__get_pdf_revision_preview__ok__200__force_download_case(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get pdf revision preview of content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        revision_id = int(test_file.revision_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/1/files/{}/raw/{}".format(content_id, image.name),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/raw/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=image.name
            ),
            status=200,
        )
        assert res.content_type == "text/plain"
        params = {"page": 1, "force_download": 1}
        filename = "test_image_page_1.pdf"
        res = web_testapp.get(
            "/api/workspaces/1/files/{content_id}/revisions/{revision_id}/preview/pdf/{filename}".format(
                content_id=content_id, revision_id=revision_id, filename=filename
            ),
            status=200,
            params=params,
        )
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format(filename, filename)
        assert res.content_type == "application/pdf"

    def test_api__set_file_status__err_400__same_status(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.get_one(1)
        tool_folder = content_api.get_one(1, content_type=content_type_list.Any_SLUG)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=tool_folder,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        test_file.file_extension = ".txt"
        test_file.depot_file = FileIntent(b"Test file", "Test_file.txt", "text/plain")
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_content(test_file, "Test_file", "<p>description</p>")
        session.flush()
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "open"}
        # set status
        res = web_testapp.put_json(
            "/api/workspaces/1/files/{}/status".format(test_file.content_id),
            params=params,
            status=400,
        )

        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INVALID_STATUS_CHANGE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestThreads(object):
    """
    Tests for /api/workspaces/{workspace_id}/threads/{content_id}
    endpoint
    """

    def test_api__get_thread__err_400__wrong_content_type(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/threads/6", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__get_thread__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get one html document of a content
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/threads/7", status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "Best Cakes?"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "best-cakes"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 26
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] != content["author"]
        assert content["last_modifier"]["user_id"] == 3
        assert content["last_modifier"]["public_name"] == "Bob i."
        assert content["last_modifier"]["username"] == "TheBobi"
        assert content["last_modifier"]["has_avatar"] is False
        assert content["raw_content"] == "What is the best cake?"
        assert content["file_extension"] == ".thread.html"
        assert content["filename"] == "Best Cakes?.thread.html"

    @pytest.mark.parametrize(
        "comments_content", [["<b>a first html comment</b>", "a second one !", "a third"]]
    )
    def test_api__get_thread_html_preview__ok__200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        comments_content,
    ) -> None:
        """
        get thread html preview
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
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        for content in comments_content:
            params = {"raw_content": content}
            res = web_testapp.post_json(
                "/api/workspaces/{}/contents/{}/comments".format(
                    business_workspace.workspace_id, test_thread.content_id
                ),
                params=params,
                status=200,
            )
        res = web_testapp.get(
            "/api/workspaces/1/threads/{}/preview/html/".format(test_thread.content_id), status=200
        )
        binary_first_comment_content = comments_content[0].encode("utf-8")
        assert res.body == binary_first_comment_content
        assert res.content_length == len(binary_first_comment_content)
        assert res.charset == "UTF-8"
        assert res.content_type == "text/html"

    def test_api__get_thread_html_preview__err__400__no_first_comment(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list,
    ) -> None:
        """
        get thread html preview
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
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/1/threads/{}/preview/html/".format(test_thread.content_id), status=400
        )
        assert res.json_body["code"] == ErrorCode.UNAIVALABLE_PREVIEW

    def test_api__get_thread__err_400__content_does_not_exist(self, web_testapp) -> None:
        """
        Get one thread (content 170 does not exist)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/threads/170", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_thread__err_400__content_not_in_workspace(self, web_testapp) -> None:
        """
        Get one thread(content 7 is in workspace 2)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/1/threads/7", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__get_thread__err_400__workspace_does_not_exist(self, web_testapp) -> None:
        """
        Get one thread (Workspace 40 does not exist)
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/40/threads/7", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_NOT_FOUND

    def test_api__get_thread__err_400__workspace_id_is_not_int(self, web_testapp) -> None:
        """
        Get one thread, workspace id is not int
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/coucou/threads/7", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.WORKSPACE_INVALID_ID

    def test_api__get_thread__err_400_content_id_is_not_int(self, web_testapp) -> None:
        """
        Get one thread, content id is not int
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/threads/coucou", status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.CONTENT_INVALID_ID

    def test_api__update_thread__ok_200__nominal_case(self, web_testapp, event_helper) -> None:
        """
        Update(put) thread
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json("/api/workspaces/2/threads/7", params=params, status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["file_extension"] == ".thread.html"
        assert content["filename"] == "My New label.thread.html"
        assert content["current_revision_type"] == "edition"

        res = web_testapp.get("/api/workspaces/2/threads/7", status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"
        assert content["file_extension"] == ".thread.html"
        assert content["filename"] == "My New label.thread.html"
        assert content["current_revision_type"] == "edition"

        modified_event = event_helper.last_event
        assert modified_event.event_type == "content.modified.thread"
        # NOTE S.G 2020-05-12: allow a small difference in modified time
        # as tests with MySQL sometimes fails with a strict equality
        event_content_modified = dateutil.parser.isoparse(modified_event.content["modified"])
        content_modified = dateutil.parser.isoparse(content["modified"])
        modified_diff = (event_content_modified - content_modified).total_seconds()
        assert abs(modified_diff) < 2
        assert modified_event.client_token is None
        assert content["current_revision_type"] == content["current_revision_type"]
        assert modified_event.content["file_extension"] == content["file_extension"]
        assert modified_event.content["filename"] == content["filename"]
        assert modified_event.content["is_archived"] == content["is_archived"]
        assert modified_event.content["is_editable"] == content["is_editable"]
        assert modified_event.content["is_deleted"] == content["is_deleted"]
        assert modified_event.content["label"] == content["label"]
        assert modified_event.content["parent_id"] == content["parent_id"]
        assert modified_event.content["show_in_ui"] == content["show_in_ui"]
        assert modified_event.content["slug"] == content["slug"]
        assert modified_event.content["status"] == content["status"]
        assert modified_event.content["sub_content_types"] == content["sub_content_types"]
        assert modified_event.content["workspace_id"] == content["workspace_id"]
        workspace = web_testapp.get("/api/workspaces/2", status=200).json_body
        assert modified_event.workspace == workspace

    def test_api__update_thread__err_400__not_modified(self, web_testapp) -> None:
        """
        Update(put) thread
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "My New label", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json("/api/workspaces/2/threads/7", params=params, status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"

        res = web_testapp.get("/api/workspaces/2/threads/7", status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["is_archived"] is False
        assert content["is_deleted"] is False
        assert content["is_editable"] is True
        assert content["label"] == "My New label"
        assert content["parent_id"] == 3
        assert content["show_in_ui"] is True
        assert content["slug"] == "my-new-label"
        assert content["status"] == "open"
        assert content["workspace_id"] == 2
        assert content["current_revision_id"] == 28
        # TODO - G.M - 2018-06-173 - check date format
        assert content["created"]
        assert content["author"]
        assert content["author"]["user_id"] == 1
        assert content["author"]["has_avatar"] is False
        assert content["author"]["public_name"] == "Global manager"
        assert content["author"]["username"] == "TheAdmin"
        # TODO - G.M - 2018-06-173 - check date format
        assert content["modified"]
        assert content["last_modifier"] == content["author"]
        assert content["raw_content"] == "<p> Le nouveau contenu </p>"

        res = web_testapp.put_json("/api/workspaces/2/threads/7", params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.SAME_VALUE_ERROR

    def test_api__update_thread__err_400__empty_label(self, web_testapp) -> None:
        """
        Update(put) thread
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "", "raw_content": "<p> Le nouveau contenu </p>"}
        res = web_testapp.put_json("/api/workspaces/2/threads/7", params=params, status=400)
        # TODO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__update_thread__err_400__nasty_mentions(
        self, web_testapp, html_with_nasty_mention
    ) -> None:
        """
        Update(put) thread
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"label": "Hello", "raw_content": html_with_nasty_mention}
        res = web_testapp.put_json("/api/workspaces/2/threads/7", params=params, status=400)
        # TODO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.USER_NOT_MEMBER_OF_WORKSPACE

    def test_api__get_thread_revisions__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Get threads revisions
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get("/api/workspaces/2/threads/7/revisions", status=200)
        revisions = res.json_body
        assert len(revisions) == 2
        revision = revisions[0]
        assert revision["content_type"] == "thread"
        assert revision["content_id"] == 7
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is False
        assert revision["label"] == "Best Cake"
        assert revision["parent_id"] == 3
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "best-cake"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == 2
        assert revision["revision_id"] == 8
        assert revision["sub_content_types"]
        assert revision["revision_type"] == "creation"
        assert revision["comment_ids"] == [18, 19, 20]
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 1
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Global manager"
        assert revision["author"]["username"] == "TheAdmin"
        assert revision["file_extension"] == ".thread.html"
        assert revision["filename"] == "Best Cake.thread.html"
        revision = revisions[1]
        assert revision["content_type"] == "thread"
        assert revision["content_id"] == 7
        assert revision["is_archived"] is False
        assert revision["is_deleted"] is False
        assert revision["is_editable"] is True
        assert revision["label"] == "Best Cakes?"
        assert revision["parent_id"] == 3
        assert revision["show_in_ui"] is True
        assert revision["slug"] == "best-cakes"
        assert revision["status"] == "open"
        assert revision["workspace_id"] == 2
        assert revision["revision_id"] == 26
        assert revision["revision_type"] == "edition"
        assert revision["sub_content_types"]
        assert revision["comment_ids"] == []
        # TODO - G.M - 2018-06-173 - check date format
        assert revision["created"]
        assert revision["author"]
        assert revision["author"]["user_id"] == 3
        assert revision["author"]["has_avatar"] is False
        assert revision["author"]["public_name"] == "Bob i."
        assert revision["file_extension"] == ".thread.html"
        assert revision["filename"] == "Best Cakes?.thread.html"

    def test_api__get_thread_revisions__ok_200__most_revision_type(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        get threads revisions
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
                test_thread, new_label="test_thread_updated", new_raw_content="Just a test"
            )
        content_api.save(test_thread)
        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.archive(test_thread)
        content_api.save(test_thread)

        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.unarchive(test_thread)
        content_api.save(test_thread)

        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.delete(test_thread)
        content_api.save(test_thread)

        with new_revision(session=session, tm=transaction.manager, content=test_thread):
            content_api.undelete(test_thread)
        content_api.save(test_thread)
        session.flush()
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/1/threads/{}/revisions".format(test_thread.content_id), status=200
        )
        revisions = res.json_body
        assert len(revisions) == 6
        for revision in revisions:
            assert revision["content_type"] == "thread"
            assert revision["workspace_id"] == 1
            assert revision["content_id"] == test_thread.content_id
        revision = revisions[0]
        assert revision["revision_type"] == "creation"
        assert revision["is_editable"] is False
        revision = revisions[1]
        assert revision["revision_type"] == "edition"
        assert revision["is_editable"] is False
        revision = revisions[2]
        assert revision["revision_type"] == "archiving"
        assert revision["is_editable"] is False
        revision = revisions[3]
        assert revision["revision_type"] == "unarchiving"
        assert revision["is_editable"] is False
        revision = revisions[4]
        assert revision["revision_type"] == "deletion"
        assert revision["is_editable"] is False
        revision = revisions[5]
        assert revision["revision_type"] == "undeletion"
        assert revision["is_editable"] is True

    def test_api__set_thread_status__ok_200__nominal_case(self, web_testapp) -> None:
        """
        Set thread status
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "closed-deprecated"}

        # before
        res = web_testapp.get("/api/workspaces/2/threads/7", status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["status"] == "open"
        assert content["is_editable"] is True
        # set status
        web_testapp.put_json("/api/workspaces/2/threads/7/status", params=params, status=204)

        # after
        res = web_testapp.get("/api/workspaces/2/threads/7", status=200)
        content = res.json_body
        assert content["content_type"] == "thread"
        assert content["content_id"] == 7
        assert content["status"] == "closed-deprecated"
        assert content["is_editable"] is False

    def test_api__set_thread_status__ok_400__wrong_status(self, web_testapp) -> None:
        """
        Set thread status
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "unexistant-status"}

        res = web_testapp.put_json("/api/workspaces/2/threads/7/status", params=params, status=400)
        # INFO - G.M - 2018-09-10 - Handle by marshmallow schema
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__set_thread_status__err_400__same_status(self, web_testapp) -> None:
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"status": "open"}

        res = web_testapp.put_json("/api/workspaces/2/threads/7/status", params=params, status=400)
        assert res.json_body
        assert "code" in res.json_body
        assert res.json_body["code"] == ErrorCode.INVALID_STATUS_CHANGE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_file_size_limit"}], indirect=True
)
class TestFileLimitedContentSize(object):
    def test_api__set_file_raw__err_400__file_size_limit_over_limitation(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Try set one file of a content with different size according to size limit
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.create_workspace("Business")
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=None,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                business_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", "test.txt", b"a")],
            status=204,
        )

        res = web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                business_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_MAX_LIMITATION

    def test_api__create_file__err__400__file_size_limit_over_limitation(
        self, workspace_api_factory, content_api_factory, session, web_testapp, admin_user
    ) -> None:
        """
        try to create one file of a content at workspace root with different size
        according to size limit
        """

        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.create_workspace("Business")
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_MAX_LIMITATION

        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", "test.txt", b"a")],
            status=200,
        )


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_workspace_size_limit"}], indirect=True
)
class TestWorkspaceLimitedContentSize(object):
    def test_api__set_file_raw__err_400__file_size_limit_over_limitation(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Try set one file of a content with different size according to size limit
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.create_workspace("Business")
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=None,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                business_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )

        res = web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                business_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_WORKSPACE_EMPTY_SPACE

    def test_api__create_file__err__400__file_size_limit_over_limitation(
        self, workspace_api_factory, content_api_factory, session, web_testapp, admin_user
    ) -> None:
        """
        try to create one file of a content at workspace root with different size
        according to size limit
        """

        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.create_workspace("Business")
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=200,
        )
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_WORKSPACE_EMPTY_SPACE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestOwnerLimitedContentSize(object):
    def test_api__set_file_raw__err_400__file_size_limit_over_limitation(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        admin_user,
    ) -> None:
        """
        Try set one file of a content with different size according to size limit
        """
        admin_user.allowed_space = 200
        transaction.commit()
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.create_workspace("Business")
        marketing_workspace = workspace_api.create_workspace("Marketing")
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=business_workspace,
            parent=None,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        test_file2 = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=marketing_workspace,
            parent=None,
            label="Test file2",
            do_save=True,
            do_notify=False,
        )
        session.flush()
        transaction.commit()
        content_id = int(test_file.content_id)
        image = create_1000px_png_test_image()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                business_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", image.name, image.getvalue())],
            status=204,
        )

        res = web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                business_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_OWNER_EMPTY_SPACE

        content_id = int(test_file2.content_id)
        res = web_testapp.put(
            "/api/workspaces/{}/files/{}/raw/{}".format(
                marketing_workspace.workspace_id, content_id, image.name
            ),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_OWNER_EMPTY_SPACE

    def test_api__create_file__err__400__file_size_limit_over_limitation(
        self, workspace_api_factory, content_api_factory, session, web_testapp, admin_user
    ) -> None:
        """
        try to create one file of a content at workspace root with different size
        according to size limit
        """
        admin_user.allowed_space = 200
        transaction.commit()
        workspace_api = workspace_api_factory.get()
        business_workspace = workspace_api.create_workspace("Business")
        marketing_workspace = workspace_api.create_workspace("Marketing")
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=200,
        )
        res = web_testapp.post(
            "/api/workspaces/{}/files".format(business_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_OWNER_EMPTY_SPACE

        res = web_testapp.post(
            "/api/workspaces/{}/files".format(marketing_workspace.workspace_id),
            upload_files=[("files", image.name, image.getvalue())],
            status=400,
        )
        assert isinstance(res.json, dict)
        assert "code" in res.json.keys()
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_OWNER_EMPTY_SPACE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_translation_test"}], indirect=True,
)
class TestContentTranslation(object):
    @responses.activate
    @pytest.mark.parametrize(
        "raw_content,translated_raw_content,original_lang,destination_lang",
        (
            ("<b>Hello !</b>", "<b>Bonjour !</b>", "en", "fr"),
            ("<b>Hello !</b>", "<b>Bonjour !</b>", "auto", "fr"),
        ),
    )
    def test_api__get_html_document_revision_translation__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        raw_content,
        translated_raw_content,
        original_lang,
        destination_lang,
    ):
        """
        Get revision translation of a html-content
        """
        BASE_API_URL = "https://systran_fake_server.invalid:5050"
        responses.add(
            responses.POST,
            "{}{}".format(BASE_API_URL, FILE_TRANSLATION_ENDPOINT),
            body=translated_raw_content,
            status=200,
            content_type="text/html",
            stream=True,
        )
        translation_filename = "translation.html"
        content_label = "test_page"
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test")
        content_api = content_api_factory.get()
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            label=content_label,
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_html_document):
            content_api.update_content(
                test_html_document, content_label, new_raw_content=raw_content
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/html-documents/{}/revisions/{}/translated/{}".format(
                workspace.workspace_id,
                test_html_document.content_id,
                test_html_document.revision_id,
                translation_filename,
            ),
            params={
                "source_language_code": original_lang,
                "target_language_code": destination_lang,
            },
            status=200,
        )
        assert res.body.decode("utf-8") == translated_raw_content
        assert res.content_type == "text/html"

    @responses.activate
    @pytest.mark.parametrize(
        "raw_content,translated_raw_content,original_lang,destination_lang",
        (
            ("<b>Hello !</b>", "<b>Bonjour !</b>", "en", "fr"),
            ("<b>Hello !</b>", "<b>Bonjour !</b>", "auto", "fr"),
        ),
    )
    def test_api__get_html_document_translation__ok__nominal_case(
        self,
        web_testapp,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        raw_content,
        translated_raw_content,
        original_lang,
        destination_lang,
    ):
        """
        Get content translation of a html-content
        """
        BASE_API_URL = "https://systran_fake_server.invalid:5050"
        responses.add(
            responses.POST,
            "{}{}".format(BASE_API_URL, FILE_TRANSLATION_ENDPOINT),
            body=translated_raw_content,
            status=200,
            content_type="text/html",
            stream=True,
        )
        translation_filename = "translation.html"
        content_label = "test_page"
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test")
        content_api = content_api_factory.get()
        test_html_document = content_api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            label=content_label,
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_html_document):
            content_api.update_content(
                test_html_document, content_label, new_raw_content=raw_content
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/html-documents/{}/translated/{}".format(
                workspace.workspace_id, test_html_document.content_id, translation_filename
            ),
            params={
                "source_language_code": original_lang,
                "target_language_code": destination_lang,
            },
            status=200,
        )
        assert res.body.decode("utf-8") == translated_raw_content
        assert res.content_type == "text/html"
