from mock import patch
import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.lib.collaborative_document_edition.collaboration_document_edition_factory import (
    CollaborativeDocumentEditionFactory,
)
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "collabora_test"}], indirect=True)
class TestCollaborativeDocumentEdition(object):
    @patch("requests.get")
    def test_api__discovery__ok_200__nominal_case(
        self,
        patched_get,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        web_testapp,
    ) -> None:
        """
        Discover libre office capabilities
        """

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        patched_get.return_value.text = """
        <wopi-discovery>
            <net-zone name="external-http">
                <app name="application/vnd.lotus-wordpro">
                    <action ext="lwp" name="view" urlsrc="http://localhost:9980/loleaflet/305832f/loleaflet.html?"/>
                </app>
                <app name="image/svg+xml">
                    <action ext="svg" name="view" urlsrc="http://localhost:9980/loleaflet/305832f/loleaflet.html?"/>
                </app>
                <app name="application/vnd.oasis.opendocument.text">
                    <action ext="odt" name="edit" urlsrc="http://localhost:9980/loleaflet/305832f/loleaflet.html?"/>
                </app>
                <!-- a lot more `app` in the real response -->
            </net-zone>
        </wopi-discovery>
        """
        url = "/api/v2/collaborative-document-edition/discovery"
        res = web_testapp.get(url, status=200)
        content = res.json_body
        assert len(content) == 3
        assert content[0]["extension"] == "lwp"
        assert content[0]["mimetype"] == "application/vnd.lotus-wordpro"
        assert content[0]["associated_action"] == "view"
        assert content[1]["extension"] == "svg"
        assert content[1]["mimetype"] == "image/svg+xml"
        assert content[1]["associated_action"] == "view"
        assert content[2]["extension"] == "odt"
        assert content[2]["mimetype"] == "application/vnd.oasis.opendocument.text"
        assert content[2]["associated_action"] == "edit"

    def test_api__collaborative_document_edition_templates__ok_200__nominal_case(
        self, admin_user, session, app_config, web_testapp
    ):
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/v2/collaborative-document-edition/templates"
        res = web_testapp.get(url, status=200)
        content = res.json_body
        collaborative_document_edition_api = CollaborativeDocumentEditionFactory().get_collaborative_document_edition_lib(
            current_user=admin_user, session=session, config=app_config
        )
        assert (
            content["file_templates"]
            == collaborative_document_edition_api.get_file_template_list().file_templates
        )

    def test_api__collaborative_document_edition_token__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        admin_user,
        web_testapp,
        app_config,
    ) -> None:
        """
        Ask for edition token
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/v2/collaborative-document-edition/token"
        res = web_testapp.get(url, status=200)
        content = res.json_body
        transaction.commit()
        assert content["access_token"] == admin_user.ensure_auth_token(
            app_config.USER__AUTH_TOKEN__VALIDITY
        )

    def test_api__create_from_template__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
        app_config,
    ) -> None:
        """
        Ask to create a file from a template, returns the url of collabora online
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        collaborative_document_edition_api = CollaborativeDocumentEditionFactory().get_collaborative_document_edition_lib(
            current_user=admin_user, session=session, config=app_config
        )
        data_workspace = workspace_api.create_workspace(label="data")
        tool_folder = content_api.create(
            label="tools",
            content_type_slug=content_type_list.Folder.slug,
            do_save=True,
            do_notify=None,
            parent=None,
            workspace=data_workspace,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/v2/collaborative-document-edition/workspaces/{}/create".format(
            data_workspace.workspace_id
        )
        template_filename = collaborative_document_edition_api.get_file_template_list().file_templates[
            0
        ]
        res = web_testapp.post_json(
            url,
            params={
                "filename": "test_file.ods",
                "template": template_filename,
                "parent_id": tool_folder.content_id,
            },
            status=200,
        )
        transaction.commit()
        content = res.json_body
        assert content["file_extension"] == ".ods"
        assert content["content_type"] == "file"
        assert content["label"] == "test_file"
        assert content["parent_id"] == tool_folder.content_id
        assert content["filename"] == "test_file.ods"
        content_id = content["content_id"]
        workspace_id = content["workspace_id"]

        res = web_testapp.get(
            "/api/v2/workspaces/{}/files/{}/raw/{}".format(
                workspace_id, content_id, "test_file.ods"
            ),
            status=200,
        )
        with open(
            collaborative_document_edition_api._get_file_template_path(template_filename), "rb"
        ) as file:
            assert res.body == file.read()

    def test_api__create_from_template__err_400__template_does_not_exist(
        self,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
        app_config,
    ) -> None:
        """
        Ask to create a file from a template, returns the url of collabora online
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        data_workspace = workspace_api.create_workspace(label="data")
        tool_folder = content_api.create(
            label="tools",
            content_type_slug=content_type_list.Folder.slug,
            do_save=True,
            do_notify=None,
            parent=None,
            workspace=data_workspace,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/v2/collaborative-document-edition/workspaces/{}/create".format(
            data_workspace.workspace_id
        )
        template_filename = "unexistent_template"
        res = web_testapp.post_json(
            url,
            params={
                "filename": "test_file.ods",
                "template": template_filename,
                "parent_id": tool_folder.content_id,
            },
            status=400,
        )
        content = res.json_body
        assert content["code"] == ErrorCode.FILE_TEMPLATE_NOT_AVAILABLE
