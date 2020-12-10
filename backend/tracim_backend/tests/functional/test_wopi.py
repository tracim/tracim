import datetime
from urllib.parse import quote

from depot.manager import DepotManager
from freezegun import freeze_time
import pytest
import transaction

from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "collabora_test"}], indirect=True)
class TestWOPI(object):
    """
    Tests for /api/collaborative-document-edition/wopi
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

        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        transaction.commit()
        query_param = {"access_token": access_token}
        url = "/api/collaborative-document-edition/wopi/files/{}/contents".format(
            test_file.content_id
        )
        res = web_testapp.get(url, status=200, params=query_param)
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
        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        transaction.commit()
        query_param = {"access_token": access_token}
        url = "/api/collaborative-document-edition/wopi/files/{}".format(test_file.content_id)
        res = web_testapp.get(url, status=200, params=query_param)
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

    def test_api__put_content__ok_200__nominal_case__no_timestamp_header(
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
        with freeze_time("1999-12-31 23:59:59"):
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
        with freeze_time("2000-01-01 00:00:05"):
            access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
            transaction.commit()
            url = "/api/collaborative-document-edition/wopi/files/{}/contents?access_token={}".format(
                test_file.content_id, quote(access_token)
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
        file_ = DepotManager.get(app_config.UPLOADED_FILES__STORAGE_NAME).get(content.depot_file)
        assert (
            response["LastModifiedTime"]
            != updated_at.replace(tzinfo=datetime.timezone.utc).isoformat()
        )
        assert content.file_mimetype == content.depot_file.content_type == "plain/text"
        assert file_.read() == new_content

    def test_api__put_content__ok_200__nominal_case_libreoffice_online(
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
        with freeze_time("1999-12-31 23:59:59"):
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
        with freeze_time("2000-01-01 00:00:05"):
            access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
            transaction.commit()
            url = "/api/collaborative-document-edition/wopi/files/{}/contents?access_token={}".format(
                test_file.content_id, quote(access_token)
            )
            updated_at = test_file.updated
            new_content = b"content has been modified"
            res = web_testapp.post(
                url,
                params=new_content,
                status=200,
                headers={"X-LOOL-WOPI-Timestamp": str(test_file.updated)},
            )
            transaction.commit()
        # FIXME - H.D. - 2019/07/04 - MySQL has trouble finding the newly created revision
        #  without reinstancing the database session
        content_api = content_api_factory.get()
        content = content_api.get_one(test_file.content_id, content_type=content_type_list.Any_SLUG)
        response = res.json_body
        file_ = DepotManager.get(app_config.UPLOADED_FILES__STORAGE_NAME).get(content.depot_file)
        assert (
            response["LastModifiedTime"]
            != updated_at.replace(tzinfo=datetime.timezone.utc).isoformat()
        )
        assert content.file_mimetype == content.depot_file.content_type == "plain/text"
        assert file_.read() == new_content

    def test_api__put_content__err_409__libreoffice_online_content_as_changed(
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
        access_token = str(admin_user.ensure_auth_token(app_config.USER__AUTH_TOKEN__VALIDITY))
        transaction.commit()
        url = "/api/collaborative-document-edition/wopi/files/{}/contents?access_token={}".format(
            test_file.content_id, quote(access_token)
        )
        new_content = b"content has been modified"
        res = web_testapp.post(
            url,
            params=new_content,
            status=409,
            headers={"X-LOOL-WOPI-Timestamp": "1999-12-31 23:59:59"},
        )
        assert res.json_body["LOOLStatusCode"] == 1010
