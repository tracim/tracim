from mock import patch
import pytest
import transaction

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
