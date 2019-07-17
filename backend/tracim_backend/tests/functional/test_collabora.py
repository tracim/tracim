from urllib.parse import quote

from mock import patch
import pytest
import transaction

from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "collabora_test"}], indirect=True)
class TestCollabora(object):
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
        url = "/api/v2/collabora/discovery"
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

    @patch("requests.get")
    def test_api__edit_file__ok_200__nominal_case(
        self,
        patched_get,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        admin_user,
        web_testapp,
        app_config,
    ) -> None:
        """
        Ask to edit a file, returns the url of collabora online
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        business_workspace = workspace_api.create_workspace(label="business")
        tool_folder = content_api.create(
            label="tools",
            content_type_slug=content_type_list.Folder.slug,
            do_save=True,
            do_notify=None,
            parent=None,
            workspace=business_workspace,
        )
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
        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        transaction.commit()
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
        url = "/api/v2/workspaces/{}/files/{}/collabora_edit_info?access_token={}".format(
            business_workspace.workspace_id, test_file.content_id, quote(access_token)
        )
        res = web_testapp.get(url, status=200)
        content = res.json_body
        assert content["is_collabora_editable"] is False
        assert content["url_source"] is None
        assert content["access_token"] == admin_user.ensure_auth_token(
            app_config.USER__AUTH_TOKEN__VALIDITY
        )
