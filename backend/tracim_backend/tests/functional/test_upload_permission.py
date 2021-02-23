from unittest import mock

import pytest
from rq import SimpleWorker
import transaction

from tracim_backend.applications.share.models import ContentShareType
from tracim_backend.applications.upload_permissions.lib import UploadPermissionLib
from tracim_backend.error import ErrorCode
from tracim_backend.lib.rq import RqQueueName
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.models.auth import User
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import create_1000px_png_test_image


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
)
class TestPrivateUploadPermissionEndpointsWithNotifications(object):
    @pytest.mark.parametrize("with_email", (True, False))
    def test_api__add_upload_permission__ok_200__emitter_with_or_without_email(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user: User,
        with_email: bool,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib

        if not with_email:
            # remove admin (emitter) email before share content
            admin_user.email = None
            session.add(admin_user)
            session.flush()

        with mock.patch(
            "tracim_backend.applications.upload_permissions.email_manager"
            ".UploadPermissionEmailManager._notify_emitter",
        ) as mocked__notify_emitter:
            upload_permission_lib.add_permission_to_workspace(
                workspace, emails=["target@user.local"], do_notify=True
            )
        assert mocked__notify_emitter.called == with_email


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestPrivateUploadPermissionEndpoints(object):
    def test_api__get_upload_permission__ok_200__no_result(
        self, workspace_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get upload permission of a workspace
        """

        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=200
        )
        content = res.json_body
        assert len(content) == 0

    def test_api__get_upload_permission__err_400__public_upload_disabled(
        self, workspace_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get upload permission of a workspace: error 400 because feature is disabled in this workspace
        """

        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_upload_enabled=False, save_now=True
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        transaction.commit()
        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=400
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED

    def test_api__get_upload_permission__ok_200__nominal_case(
        self, workspace_api_factory, session, web_testapp, upload_permission_lib_factory, admin_user
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["test@test.test", "test2@test2.test2"]
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=200
        )
        content = res.json_body
        assert len(content) == 2
        assert content[0]["author_id"] == admin_user.user_id
        assert content[0]["has_password"] is False
        assert content[0]["type"] == ContentShareType.EMAIL.value
        assert content[0]["disabled"] is None
        assert content[0]["is_disabled"] is False
        assert content[0]["upload_permission_id"]
        assert content[0]["email"] == "test@test.test"
        assert content[0]["url"].startswith("http://localhost:6543/ui/guest-upload/")
        assert content[0]["created"]
        assert content[0]["author"]
        assert (
            content[0]["upload_permission_group_uuid"] == content[1]["upload_permission_group_uuid"]
        )
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["upload_permission_id"] != content[1]["upload_permission_id"]
        assert content[1]["email"] == "test2@test2.test2"

    def test_api__add_upload_permission__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=200
        )
        content = res.json_body
        assert len(content) == 1
        params = {"emails": ["test <test@test.test>", "test2@test2.test2"], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id),
            params=params,
            status=200,
        )
        content = res.json_body
        assert len(content) == 2
        assert content[0]["author_id"] == admin_user.user_id
        assert content[0]["has_password"] is True
        assert content[0]["type"] == ContentShareType.EMAIL.value
        assert content[0]["disabled"] is None
        assert content[0]["is_disabled"] is False
        assert content[0]["upload_permission_id"]
        assert content[0]["email"] == "test <test@test.test>"
        assert content[0]["url"].startswith("http://localhost:6543/ui/guest-upload/")
        assert content[0]["created"]
        assert content[0]["author"]
        assert (
            content[0]["upload_permission_group_uuid"] == content[1]["upload_permission_group_uuid"]
        )
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["upload_permission_id"] != content[1]["upload_permission_id"]
        assert content[1]["email"] == "test2@test2.test2"

        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=200
        )
        content = res.json_body
        assert len(content) == 3

    def test_api__add_upload_permission__err_400__empty_email_list(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(workspace, emails=[])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"emails": [], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id),
            params=params,
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__add_upload_permission__err_400__public_upload_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_upload_enabled=False, save_now=True
        )

        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(workspace, emails=[])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"emails": ["test@test.test", "test2@test2.test2"], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id),
            params=params,
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED

    def test_api__delete_upload_permission__ok_200__nominal_case(
        self, workspace_api_factory, session, web_testapp, upload_permission_lib_factory, admin_user
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=200
        )
        content = res.json_body
        assert len(content) == 1
        assert content[0]["upload_permission_id"]
        upload_permission_id = content[0]["upload_permission_id"]
        upload_permission_token = content[0]["token"]

        web_testapp.delete(
            "/api/workspaces/{}/upload_permissions/{}".format(
                workspace.workspace_id, upload_permission_id
            ),
            status=204,
        )

        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id), status=200
        )
        content = res.json_body
        assert len(content) == 0

        res = web_testapp.get(
            "/api/workspaces/{}/upload_permissions".format(workspace.workspace_id),
            status=200,
            params={"show_disabled": 1},
        )
        content = res.json_body
        assert len(content) == 1
        params = {"username": "toto"}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission_token
            ),
            params=params,
            upload_files=[("file_1", image.name, image.getvalue())],
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.UPLOAD_PERMISSION_NOT_FOUND

    def test_api__delete_upload_permission__err_400__upload_permission_not_found(
        self, workspace_api_factory, session, web_testapp, upload_permission_lib_factory, admin_user
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        res = web_testapp.delete(
            "/api/workspaces/{}/upload_permissions/{}".format(workspace.workspace_id, 1),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.UPLOAD_PERMISSION_NOT_FOUND

    def test_api__delete_upload_permission__err_400__public_upload_feature_disabled(
        self, workspace_api_factory, session, web_testapp, upload_permission_lib_factory, admin_user
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_upload_enabled=False, save_now=True
        )
        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permissions = upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        upload_permission_id = upload_permissions[0].upload_permission_id
        res = web_testapp.delete(
            "/api/workspaces/{}/upload_permissions/{}".format(
                workspace.workspace_id, upload_permission_id
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED


@pytest.mark.usefixtures("base_fixture")
class TestUploadPermissionWithNotification(object):
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
    )
    def test_api__add_upload_permission__ok_200__with_email_notification(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
        mailhog,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["test@test.test", "toto <test2@test2.test2>"], do_notify=True
        )
        transaction.commit()
        response = mailhog.get_mailhog_mails()
        assert len(response) == 3
        valid_dests = [
            "Global manager <admin@admin.admin>",
            "test@test.test",
            "toto <test2@test2.test2>",
        ]
        for email in response:
            assert (
                email["Content"]["Headers"]["From"][0]
                == "Tracim Notifications <test_user_from+0@localhost>"
                or "Global manager via Tracim <test_user_from+1@localhost>"
            )
            headers = email["Content"]["Headers"]
            assert headers["To"][0] in valid_dests
            valid_dests.remove(headers["To"][0])
        assert valid_dests == []

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_with_mail_test_async"}], indirect=True
    )
    def test_api__add_upload_permission__ok_200__with_email_notification_async(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
        mailhog,
        app_config,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["test@test.test", "toto <test2@test2.test2>"], do_notify=True
        )
        transaction.commit()

        mailhog.cleanup_mailhog()
        # Send mail async from redis queue
        redis = get_redis_connection(app_config)
        queue = get_rq_queue(redis, RqQueueName.MAIL_SENDER)
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)

        response = mailhog.get_mailhog_mails()
        assert len(response) == 3
        valid_dests = [
            "Global manager <admin@admin.admin>",
            "test@test.test",
            "toto <test2@test2.test2>",
        ]
        for email in response:
            assert (
                email["Content"]["Headers"]["From"][0]
                == "Tracim Notifications <test_user_from+0@localhost>"
                or "Global manager via Tracim <test_user_from+1@localhost>"
            )
            headers = email["Content"]["Headers"]
            assert headers["To"][0] in valid_dests
            valid_dests.remove(headers["To"][0])
        assert valid_dests == []

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
    )
    def test_api__add_upload_permission__ok_200__with_email_notification_and_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
        mailhog,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()  # type: UploadPermissionLib
        upload_permission_lib.add_permission_to_workspace(
            workspace,
            emails=["test@test.test", "toto <test2@test2.test2>"],
            password="toto",
            do_notify=True,
        )
        transaction.commit()
        response = mailhog.get_mailhog_mails()
        assert len(response) == 3
        valid_dests = [
            "Global manager <admin@admin.admin>",
            "test@test.test",
            "toto <test2@test2.test2>",
        ]
        for email in response:
            assert (
                email["Content"]["Headers"]["From"][0]
                == "Tracim Notifications <test_user_from+0@localhost>"
                or "Global manager via Tracim <test_user_from+1@localhost>"
            )
            headers = email["Content"]["Headers"]
            assert headers["To"][0] in valid_dests
            valid_dests.remove(headers["To"][0])
        assert valid_dests == []

    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
    )
    def test_api__guest_upload_content__ok_200__without_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
        mailhog,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["toto <thissharewill@notbe.presentinresponse>"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        mailhog.cleanup_mailhog()
        web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        response = mailhog.get_mailhog_mails()
        assert len(response) == 1
        valid_dests = ["Global manager <admin@admin.admin>"]
        for email in response:
            assert (
                email["Content"]["Headers"]["From"][0]
                == "Tracim Notifications <test_user_from+0@localhost>"
            )
            headers = email["Content"]["Headers"]
            assert headers["To"][0] in valid_dests
            valid_dests.remove(headers["To"][0])
        assert valid_dests == []


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestGuestUploadEndpoints(object):
    def test_api__guest_upload_content__ok_200__with_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"], password="mysuperpassword"
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "password": "mysuperpassword", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        params = {"namespaces_filter": "upload"}
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            params=params,
        )
        res = res.json_body
        assert len(res) == 3
        comment = res[0]
        assert comment["label"] == ""
        assert comment["content_type"] == "comment"
        file = res[2]
        assert file["label"] == "test_image"
        assert file["filename"] == "test_image.png"
        assert file["content_type"] == "file"
        image_content_id = file["content_id"]
        assert file["content_id"] == comment["parent_id"]
        dir = res[1]
        assert dir["label"].startswith("Files uploaded by toto")
        assert dir["parent_id"] is None
        assert dir["content_type"] == "folder"

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/comments".format(
                workspace_id=workspace.workspace_id, content_id=image_content_id
            ),
            status=200,
        )
        res = res.json_body
        assert len(res) == 1
        comment_result = res[0]
        assert comment_result["raw_content"] == "Message from toto: hello folk !"
        assert comment_result["parent_id"] == image_content_id
        assert comment_result["author"]["user_id"] == admin_user.user_id

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/files/{content_id}/raw/".format(
                workspace_id=workspace.workspace_id, content_id=image_content_id
            ),
            status=200,
        )
        assert res.body == image.getvalue()

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            status=200,
        )
        assert len(res.json_body) == 0

    def test_api__guest_upload_content__err_403__wrong_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"], password="mysuperpassword"
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "password": "anotherpassword", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=403,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.WRONG_SHARE_PASSWORD

    def test_api__guest_upload_content__err_400__public_upload_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_upload_enabled=False, save_now=True
        )
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"], password="mysuperpassword"
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "password": "anotherpassword", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=400,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED

    def test_api__guest_upload_content__err_400__upload_permission_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        image = create_1000px_png_test_image()
        params = {"username": "toto", "password": "anotherpassword", "message": "hello folk !"}
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token="invalid_token"
            ),
            status=400,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.UPLOAD_PERMISSION_NOT_FOUND

    def test_api__guest_upload_content__ok_200__without_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        params = {"namespaces_filter": "upload"}
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            params=params,
        )
        res = res.json_body
        assert len(res) == 3
        comment = res[0]
        assert comment["label"] == ""
        assert comment["content_type"] == "comment"
        file = res[2]
        assert file["label"] == "test_image"
        assert file["filename"] == "test_image.png"
        assert file["content_type"] == "file"
        image_content_id = file["content_id"]
        assert file["content_id"] == comment["parent_id"]
        dir = res[1]
        assert dir["label"].startswith("Files uploaded by toto")
        assert dir["parent_id"] is None
        assert dir["content_type"] == "folder"

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/comments".format(
                workspace_id=workspace.workspace_id, content_id=image_content_id
            ),
            status=200,
        )
        res = res.json_body
        assert len(res) == 1
        comment_result = res[0]
        assert comment_result["raw_content"] == "Message from toto: hello folk !"
        assert comment_result["parent_id"] == image_content_id
        assert comment_result["author"]["user_id"] == admin_user.user_id

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/files/{content_id}/raw/".format(
                workspace_id=workspace.workspace_id, content_id=image_content_id
            ),
            status=200,
        )
        assert res.body == image.getvalue()

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            status=200,
        )
        assert len(res.json_body) == 0

    def test_api__guest_upload_content__ok_200__empty_message(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto"}
        image = create_1000px_png_test_image()
        web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        params = {"namespaces_filter": "upload"}
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            params=params,
        )
        res = res.json_body
        assert len(res) == 3
        comment = res[0]
        assert comment["label"] == ""
        assert comment["content_type"] == "comment"
        file = res[2]
        assert file["label"] == "test_image"
        assert file["filename"] == "test_image.png"
        assert file["content_type"] == "file"
        image_content_id = file["content_id"]
        assert file["content_id"] == comment["parent_id"]
        dir = res[1]
        assert dir["label"].startswith("Files uploaded by toto")
        assert dir["parent_id"] is None
        assert dir["content_type"] == "folder"

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/comments".format(
                workspace_id=workspace.workspace_id, content_id=image_content_id
            ),
            status=200,
        )
        res = res.json_body
        assert len(res) == 1
        comment_result = res[0]
        assert comment_result["raw_content"] == "Uploaded by toto."
        assert comment_result["parent_id"] == image_content_id
        assert comment_result["author"]["user_id"] == admin_user.user_id

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/files/{content_id}/raw/".format(
                workspace_id=workspace.workspace_id, content_id=image_content_id
            ),
            status=200,
        )
        assert res.body == image.getvalue()

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            status=200,
        )
        assert len(res.json_body) == 0

    def test_api__guest_upload_content__ok_200__10_files(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[
                ("file_1", "file1.png", image.getvalue()),
                ("file_2", "file2.png", image.getvalue()),
                ("file_3", "file3.png", image.getvalue()),
                ("file_4", "file4.png", image.getvalue()),
                ("file_5", "file5.png", image.getvalue()),
                ("file_6", "file6.png", image.getvalue()),
                ("file_7", "file7.png", image.getvalue()),
                ("file_8", "file8.png", image.getvalue()),
                ("file_9", "file9.png", image.getvalue()),
                ("file_10", "file10.png", image.getvalue()),
            ],
            params=params,
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        params = {"namespaces_filter": "upload"}
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            params=params,
        )
        res = res.json_body
        assert len(res) == 21

    def test_api__guest_upload_content__err_400__no_file_given(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "message": "hello folk !"}
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=400,
            params=params,
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        assert res.json_body["code"] == ErrorCode.NO_FILE_VALIDATION_ERROR

    def test_api__guest_upload_check__ok_200__with_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"], password="mysuperpassword"
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"password": "mysuperpassword"}
        web_testapp.post_json(
            "/api/public/guest-upload/{upload_permission_token}/check".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            params=params,
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        params = {"namespaces_filter": "upload"}
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            params=params,
        )
        res = res.json_body
        assert len(res) == 0

    def test_api__guest_upload_check__err_403__wrong_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"], password="mysuperpassword"
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        res = web_testapp.post_json(
            "/api/public/guest-upload/{upload_permission_token}/check".format(
                upload_permission_token=upload_permission.token
            ),
            status=403,
        )
        assert res.json_body["code"] == ErrorCode.WRONG_SHARE_PASSWORD

    def test_api__guest_upload_check__err_400__public_upload_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_upload_enabled=False, save_now=True
        )
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        res = web_testapp.post_json(
            "/api/public/guest-upload/{upload_permission_token}/check".format(
                upload_permission_token=upload_permission.token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED

    def test_api__guest_upload_check__err_400__upload_permission_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        res = web_testapp.post_json(
            "/api/public/guest-upload/{upload_permission_token}/check".format(
                upload_permission_token="invalid_token"
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.UPLOAD_PERMISSION_NOT_FOUND

    def test_api__guest_upload_check__ok_200__without_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        web_testapp.post_json(
            "/api/public/guest-upload/{upload_permission_token}/check".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
        )
        web_testapp.post_json(
            "/api/public/guest-upload/{upload_permission_token}/check".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            params={"password": None},
        )
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        params = {"namespaces_filter": "upload"}
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents".format(workspace_id=workspace.workspace_id),
            params=params,
        )
        res = res.json_body
        assert len(res) == 0

    def test_api__guest_upload_info__ok_200__with_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"], password="mysuperpassword"
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=200,
        )
        assert res.json_body["has_password"] is True

    def test_api__guest_upload_info__ok_200__without_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=200,
        )
        assert res.json_body["has_password"] is False

    def test_api__guest_upload_info__err_400__public_upload_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_upload_enabled=False, save_now=True
        )
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_UPLOAD_DISABLED

    def test_api__guest_upload_info__err_400__upload_permission_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        res = web_testapp.get(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token="invalid_token"
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.UPLOAD_PERMISSION_NOT_FOUND


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize(
    "config_section", [{"name": "functional_test_workspace_size_limit"}], indirect=True
)
class TestGuestUploadEndpointsWorkspaceSizeLimit(object):
    def test_api__guest_upload_content__ok_200__workspace_size_limit(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=400,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_WORKSPACE_EMPTY_SPACE


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestGuestUploadEndpointsOwnerSizeLimit(object):
    def test_api__guest_upload_content__ok_200__workspace_size_limit(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        upload_permission_lib_factory,
        admin_user,
    ) -> None:
        admin_user.allowed_space = 200
        transaction.commit()
        workspace_api = workspace_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permission_lib.add_permission_to_workspace(
            workspace, emails=["thissharewill@notbe.presentinresponse"]
        )
        upload_permissions = upload_permission_lib.get_upload_permissions(workspace)
        assert len(upload_permissions) == 1
        upload_permission = upload_permissions[0]
        transaction.commit()
        params = {"username": "toto", "message": "hello folk !"}
        image = create_1000px_png_test_image()
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=204,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        res = web_testapp.post(
            "/api/public/guest-upload/{upload_permission_token}".format(
                upload_permission_token=upload_permission.token
            ),
            status=400,
            upload_files=[("file_1", image.name, image.getvalue())],
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.FILE_SIZE_OVER_OWNER_EMPTY_SPACE
