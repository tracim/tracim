import cgi
from io import BytesIO

from freezegun import freeze_time
import pytest
import transaction

from tracim_backend.applications.upload_permissions.lib import UploadPermissionLib
from tracim_backend.tests.fixtures import *  # noqa F403,F401


@pytest.mark.usefixtures("base_fixture")
class TestUploadPermissionLib(object):
    def test_unit__upload_permission__ok__do_multiple_upload_file_at_same_time(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_api_factory,
        content_type_list,
        admin_user,
    ):
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test", public_upload_enabled=True)
        transaction.commit()
        api = UploadPermissionLib(current_user=admin_user, session=session, config=app_config)
        permissions = api.add_permission_to_workspace(workspace, ["test@test.test"])
        permission = permissions[0]
        with freeze_time("2000-01-01 00:00:05"):
            content = "just text".encode("utf-8")
            headers = {
                u"content-disposition": u'form-data; name="{}"; filename="{}"'.format(
                    "test", "test.txt"
                ),
                u"content-length": len(content),
                u"content-type": "plain/text",
            }
            environ = {"REQUEST_METHOD": "POST"}
            fp = BytesIO(content)
            storage = cgi.FieldStorage(fp=fp, headers=headers, environ=environ)
            api.upload_files(
                upload_permission=permission,
                uploader_username="john",
                message="check thoses files",
                files=[storage],
                do_notify=False,
            )
            transaction.commit()

            content = "some text".encode("utf-8")
            headers = {
                u"content-disposition": u'form-data; name="{}"; filename="{}"'.format(
                    "test2", "test2.txt"
                ),
                u"content-length": len(content),
                u"content-type": "plain/text",
            }
            environ = {"REQUEST_METHOD": "POST"}
            fp = BytesIO(content)
            storage = cgi.FieldStorage(fp=fp, headers=headers, environ=environ)
            api.upload_files(
                upload_permission=permission,
                uploader_username="john",
                message="check thoses other files !",
                files=[storage],
                do_notify=False,
            )
            transaction.commit()

        content_api = content_api_factory.get()
        contents = content_api.get_all(workspaces=[workspace])
        assert len(contents) == 5

        folders = content_api.get_all(
            workspace=workspace, content_type=content_type_list.Folder.slug
        )
        assert len(folders) == 1
        folder_id = folders[0].content_id

        files = content_api.get_all(
            workspaces=[workspace], content_type=content_type_list.File.slug
        )
        assert len(files) == 2
        for file_ in files:
            assert file_.parent_id == folder_id

        comments = content_api.get_all(
            workspaces=[workspace], content_type=content_type_list.Comment.slug
        )
        assert len(comments) == 2

    def test_unit__upload_permission__ok__do_multiple_upload_file_at_different_time(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_api_factory,
        content_type_list,
        admin_user,
    ):
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test", public_upload_enabled=True)
        transaction.commit()
        api = UploadPermissionLib(current_user=admin_user, session=session, config=app_config)
        permissions = api.add_permission_to_workspace(workspace, ["test@test.test"])
        permission = permissions[0]
        with freeze_time("2000-01-01 00:00:05"):
            content = "just text".encode("utf-8")
            headers = {
                u"content-disposition": u'form-data; name="{}"; filename="{}"'.format(
                    "test", "test.txt"
                ),
                u"content-length": len(content),
                u"content-type": "plain/text",
            }
            environ = {"REQUEST_METHOD": "POST"}
            fp = BytesIO(content)
            storage = cgi.FieldStorage(fp=fp, headers=headers, environ=environ)
            api.upload_files(
                upload_permission=permission,
                uploader_username="john",
                message="check thoses files",
                files=[storage],
                do_notify=False,
            )
            transaction.commit()
        with freeze_time("1999-12-31 23:59:59"):
            content = "some text".encode("utf-8")
            headers = {
                u"content-disposition": u'form-data; name="{}"; filename="{}"'.format(
                    "test2", "test2.txt"
                ),
                u"content-length": len(content),
                u"content-type": "plain/text",
            }
            environ = {"REQUEST_METHOD": "POST"}
            fp = BytesIO(content)
            storage = cgi.FieldStorage(fp=fp, headers=headers, environ=environ)
            api.upload_files(
                upload_permission=permission,
                uploader_username="john",
                message="check thoses other files !",
                files=[storage],
                do_notify=False,
            )
            transaction.commit()

        content_api = content_api_factory.get()
        contents = content_api.get_all(workspaces=[workspace])
        assert len(contents) == 6

        folders = content_api.get_all(
            workspaces=[workspace], content_type=content_type_list.Folder.slug
        )
        assert len(folders) == 2

        files = content_api.get_all(
            workspaces=[workspace], content_type=content_type_list.File.slug
        )
        assert len(files) == 2

        comments = content_api.get_all(
            workspaces=[workspace], content_type=content_type_list.Comment.slug
        )
        assert len(comments) == 2
