import datetime
from urllib.parse import quote

from depot.manager import DepotManager
import pytest
import transaction

from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestWOPI(object):
    """
    Tests for /api/v2/workspaces/{workspace_id}/wopi/files/{content_id}
    endpoints
    """

    def test_api__get_content__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        session,
        web_testapp,
        admin_user,
        app_config,
    ) -> None:
        """Get file content"""
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
        transaction.commit()
        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        url = "/api/v2/workspaces/{}/wopi/files/{}/contents?access_token={}".format(
            business_workspace.workspace_id, test_file.content_id, quote(access_token)
        )
        res = web_testapp.get(url, status=200)
        assert res.body == b"Test file"

    def test_api__check_file_info__ok_200__nominal_case(
        self,
        workspace_api_factory,
        admin_user,
        content_api_factory,
        content_type_list,
        session,
        web_testapp,
        app_config,
    ) -> None:
        """Get file content"""
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
        file_content = b"Test file"
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=file_content
            )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        url = "/api/v2/workspaces/{}/wopi/files/{}?access_token={}".format(
            business_workspace.workspace_id, test_file.content_id, quote(access_token)
        )
        res = web_testapp.get(url, status=200)
        response = res.json_body
        assert response["BaseFileName"] == "Test_file.txt"
        assert response["Size"] == len(file_content)
        assert response["OwnerId"] == admin_user.user_id
        assert response["UserId"] == admin_user.user_id
        assert response["UserFriendlyName"] == "Global manager"
        assert response["UserCanWrite"] is True
        assert response["Version"] == str(test_file.revision_id)
        assert (
            response["LastModifiedTime"]
            == test_file.updated.replace(tzinfo=datetime.timezone.utc).isoformat()
        )
        assert response["UserCanNotWriteRelative"] is True

    def test_api__put_content__ok_200__nominal_case(
        self,
        content_api_factory,
        workspace_api_factory,
        content_type_list,
        session,
        web_testapp,
        app_config,
        admin_user,
    ) -> None:
        """Save file content"""
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

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        transaction.commit()
        url = "/api/v2/workspaces/{}/wopi/files/{}/contents?access_token={}".format(
            business_workspace.workspace_id, test_file.content_id, quote(access_token)
        )
        updated_at = test_file.updated
        new_content = b"content has been modified"
        res = web_testapp.post(url, params=new_content, status=200)
        transaction.commit()

        # FIXME - H.D. - 2019/07/04 - MySQL has trouble finding the newly created revision
        #  without reinstancing the database session
        content_api = content_api_factory.get()
        content = content_api.get_one(test_file.content_id, content_type=content_type_list.Any_SLUG)
        response = res.json_body
        file_ = DepotManager.get().get(content.depot_file)
        assert (
            response["LastModifiedTime"]
            != updated_at.replace(tzinfo=datetime.timezone.utc).isoformat()
        )
        assert file_.read() == new_content
