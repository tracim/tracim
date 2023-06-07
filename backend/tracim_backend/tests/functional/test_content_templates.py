import pytest
import transaction

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestTemplates(object):
    """
    Tests for /api/workspaces/{workspace_id}/contents endpoint
    """

    def test_api__get_templates__ok_200__nominal_case(
        self,
        web_testapp,
        riyad_user,
        session,
        admin_user,
        workspace_api_factory,
        content_api_factory,
    ):
        """
        Check obtain workspace contents with defaults filters
        """
        web_testapp.authorization = (
            "Basic",
            ("admin@admin.admin", "admin@admin.admin"),
        )
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test")
        test_html_document = content_api.create(
            content_type_slug=ContentTypeSlug.HTML_DOCUMENTS.value,
            workspace=workspace,
            label="just a content",
            do_save=True,
            do_notify=False,
        )
        # default
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}".format(test_html_document.content_id),
            status=200,
        )
        assert res.json_body["is_template"] is False
        res = web_testapp.get(
            "/api/users/{}/template_contents?type=html-document".format(
                admin_user.user_id
            ),
            status=200,
        )
        assert len(res.json_body) == 0
        res = web_testapp.get(
            "/api/users/{}/template_contents?type=html-document".format(
                riyad_user.user_id
            ),
            status=200,
        )
        assert len(res.json_body) == 0

        # set
        with new_revision(
            session=session, tm=transaction.manager, content=test_html_document
        ):
            content_api.set_template(test_html_document, is_template=True)
        content_api.save(test_html_document)
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}".format(test_html_document.content_id),
            status=200,
        )
        assert res.json_body["is_template"] is True
        res = web_testapp.get(
            "/api/users/{}/template_contents?type=html-document".format(
                admin_user.user_id
            ),
            status=200,
        )
        assert len(res.json_body) == 1
        assert res.json_body[0]["content_id"] == 1
        res = web_testapp.get(
            "/api/users/{}/template_contents?type=html-document".format(
                riyad_user.user_id
            ),
            status=200,
        )
        assert len(res.json_body) == 0

        # unset
        with new_revision(
            session=session, tm=transaction.manager, content=test_html_document
        ):
            content_api.set_template(test_html_document, is_template=False)
        content_api.save(test_html_document)
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}".format(test_html_document.content_id),
            status=200,
        )
        assert res.json_body["is_template"] is False
        res = web_testapp.get(
            "/api/users/{}/template_contents?type=html-document".format(
                admin_user.user_id
            ),
            status=200,
        )
        assert len(res.json_body) == 0
        res = web_testapp.get(
            "/api/users/{}/template_contents?type=html-document".format(
                riyad_user.user_id
            ),
            status=200,
        )
        assert len(res.json_body) == 0

    def test_api__set_unset_template__ok_200__nominal_case(
        self,
        web_testapp,
        riyad_user,
        session,
        admin_user,
        workspace_api_factory,
        content_api_factory,
    ):
        """
        Check obtain workspace contents with defaults filters
        """
        web_testapp.authorization = (
            "Basic",
            ("admin@admin.admin", "admin@admin.admin"),
        )
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test")
        test_html_document = content_api.create(
            content_type_slug=ContentTypeSlug.HTML_DOCUMENTS.value,
            workspace=workspace,
            label="just a content",
            do_save=True,
            do_notify=False,
        )
        # default
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}".format(test_html_document.content_id),
            status=200,
        )
        assert res.json_body["is_template"] is False

        # set
        res = web_testapp.put_json(
            "/api/workspaces/1/contents/{}/template".format(
                test_html_document.content_id
            ),
            params={"is_template": True},
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}".format(test_html_document.content_id),
            status=200,
        )
        assert res.json_body["is_template"] is True

        # unset
        res = web_testapp.put_json(
            "/api/workspaces/1/contents/{}/template".format(
                test_html_document.content_id
            ),
            params={"is_template": False},
            status=204,
        )
        res = web_testapp.get(
            "/api/workspaces/1/html-documents/{}".format(test_html_document.content_id),
            status=200,
        )
        assert res.json_body["is_template"] is False
