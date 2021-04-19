import pytest
from rq import SimpleWorker
import transaction

from tracim_backend.applications.share.lib import ShareLib
from tracim_backend.applications.share.models import ContentShareType
from tracim_backend.error import ErrorCode
from tracim_backend.lib.rq import RqQueueName
from tracim_backend.lib.rq import get_redis_connection
from tracim_backend.lib.rq import get_rq_queue
from tracim_backend.models.auth import User
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestPrivateShareEndpoints(object):
    def test_api__get_shares__ok_200__no_result(
        self, workspace_api_factory, content_api_factory, session, web_testapp, content_type_list
    ) -> None:
        """
        Get one file of a content
        """

        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 0

    def test_api__get_shares__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["test@test.test", "test2@test2.test2"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 2
        assert content[0]["author_id"] == admin_user.user_id
        assert content[0]["has_password"] is False
        assert content[0]["type"] == ContentShareType.EMAIL.value
        assert content[0]["disabled"] is None
        assert content[0]["is_disabled"] is False
        assert content[0]["share_id"]
        assert content[0]["email"] == "test@test.test"
        assert content[0]["url"].startswith("http://localhost:6543/ui/guest-download/")
        assert content[0]["direct_url"].startswith(
            "http://localhost:6543/api/public/guest-download/"
        )
        assert content[0]["created"]
        assert content[0]["author"]
        assert content[0]["share_token"]
        assert content[0]["share_group_uuid"] == content[1]["share_group_uuid"]
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["share_id"] != content[1]["share_id"]
        assert content[1]["email"] == "test2@test2.test2"

    def test_api__get_shares__err_400__not_shareable_type(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["test@test.test", "test2@test2.test2"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 2
        assert content[0]["author_id"] == admin_user.user_id
        assert content[0]["has_password"] is False
        assert content[0]["type"] == ContentShareType.EMAIL.value
        assert content[0]["disabled"] is None
        assert content[0]["is_disabled"] is False
        assert content[0]["share_id"]
        assert content[0]["email"] == "test@test.test"
        assert content[0]["url"].startswith("http://localhost:6543/ui/guest-download/")
        assert content[0]["direct_url"].startswith(
            "http://localhost:6543/api/public/guest-download/"
        )
        assert content[0]["created"]
        assert content[0]["author"]
        assert content[0]["share_group_uuid"] == content[1]["share_group_uuid"]
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["share_id"] != content[1]["share_id"]
        assert content[1]["email"] == "test2@test2.test2"

    def test_api__get_shares__err_400__public_download_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_download_enabled=False, save_now=True
        )
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["test@test.test", "test2@test2.test2"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

    def test_api__add_share__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 1
        params = {"emails": ["test <test@test.test>", "test2@test2.test2"], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
            params=params,
        )
        content = res.json_body
        assert len(content) == 2
        assert content[0]["author_id"] == admin_user.user_id
        assert content[0]["has_password"] is True
        assert content[0]["type"] == ContentShareType.EMAIL.value
        assert content[0]["disabled"] is None
        assert content[0]["is_disabled"] is False
        assert content[0]["share_id"]
        assert content[0]["email"] == "test <test@test.test>"
        assert content[0]["url"].startswith("http://localhost:6543/ui/guest-download/")
        assert content[0]["direct_url"].startswith(
            "http://localhost:6543/api/public/guest-download/"
        )
        assert content[0]["created"]
        assert content[0]["author"]
        assert content[0]["share_group_uuid"] == content[1]["share_group_uuid"]
        assert content[0]["share_token"]
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["share_id"] != content[1]["share_id"]
        assert content[1]["email"] == "test2@test2.test2"

        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 3

    def test_api__add_share__err_400__empty_email_list(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"emails": [], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR

    def test_api__add_share__err_400__not_shareable_content(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            label="Test folder",
            do_save=False,
            do_notify=False,
        )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"emails": ["test@test.test", "test2@test2.test2"], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__add_share__err_400__public_download_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_download_enabled=False, save_now=True
        )
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"emails": ["test@test.test", "test2@test2.test2"], "password": "123456"}
        res = web_testapp.post_json(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

    def test_api__delete_share__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 1
        assert content[0]["share_id"]
        share_id = content[0]["share_id"]
        share_token = content[0]["share_token"]

        web_testapp.delete(
            "/api/workspaces/{}/contents/{}/shares/{}".format(
                workspace.workspace_id, test_file.content_id, share_id
            ),
            status=204,
        )

        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 0

        res = web_testapp.get(
            "/api/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
            params={"show_disabled": 1},
        )
        content = res.json_body
        assert len(content) == 1

        res = web_testapp.get(
            "/api/public/guest-download/{share_token}/Test_file.txt".format(
                share_token=share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_SHARE_NOT_FOUND
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}".format(share_token=share_token), status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_SHARE_NOT_FOUND

    def test_api__delete_share__err_400__public_download_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_download_enabled=False, save_now=True
        )
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        shares = share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"]
        )
        share_id = shares[0].share_id
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.delete(
            "/api/workspaces/{}/contents/{}/shares/{}".format(
                workspace.workspace_id, test_file.content_id, share_id
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

    def test_api__delete_share__err__400__content_share_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.delete(
            "/api/workspaces/{}/contents/{}/shares/{}".format(
                workspace.workspace_id, test_file.content_id, 1
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_SHARE_NOT_FOUND


@pytest.mark.usefixtures("base_fixture")
class TestPrivateShareEndpointsWithNotification(object):
    @pytest.mark.parametrize(
        "config_section", [{"name": "functional_test_with_mail_test_sync"}], indirect=True
    )
    def test_api__add_share__ok_200__with_email_notification(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
        mailhog,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["test@test.test", "test2@test2.test2"], do_notify=True
        )
        transaction.commit()
        response = mailhog.get_mailhog_mails()
        assert len(response) == 3
        valid_dests = ["Global manager <admin@admin.admin>", "test@test.test", "test2@test2.test2"]
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
    def test_api__add_share__ok_200__with_email_notification_async(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
        mailhog,
        app_config,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["test@test.test", "test2@test2.test2"], do_notify=True
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
        valid_dests = ["Global manager <admin@admin.admin>", "test@test.test", "test2@test2.test2"]
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
    def test_api__add_share__ok_200__with_email_notification_and_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
        mailhog,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file,
            emails=["toto <test@test.test>", "test2@test2.test2"],
            password="toto",
            do_notify=True,
        )
        transaction.commit()
        response = mailhog.get_mailhog_mails()
        assert len(response) == 3
        valid_dests = [
            "Global manager <admin@admin.admin>",
            "toto <test@test.test>",
            "test2@test2.test2",
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
    def test_api__add_share__ok_200__with_email_notification_and_emitter_without_email(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user: User,
        mailhog,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib

        # remove admin (emitter) email before share content
        admin_user.email = None
        session.add(admin_user)
        session.flush()

        share_api.share_content(
            test_file, emails=["test@test.test", "test2@test2.test2"], do_notify=True
        )
        transaction.commit()
        response = mailhog.get_mailhog_mails()
        assert len(response) == 2
        # admin not in list because have no mail
        valid_dests = ["test@test.test", "test2@test2.test2"]
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


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestGuestDownloadShareEndpoints(object):
    def test_api__guest_download_content_info__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}".format(
                share_token=content_share.share_token
            ),
            status=200,
        )
        share = res.json_body
        assert share["share_id"] == content_share.share_id
        assert share["content_id"] == test_file.content_id
        assert share["author_id"] == admin_user.user_id
        assert share["author"]
        assert share["author"]["public_name"] == "Global manager"
        assert share["author"]["username"] == "TheAdmin"
        assert share["content_label"] == "Test_file"
        assert share["content_size"] == 9
        assert share["content_filename"] == "Test_file.txt"
        assert share["content_file_extension"] == ".txt"
        assert share["has_password"] is False

    def test_api__guest_download_content_info__err_400__public_download_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_download_enabled=False, save_now=True
        )
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

    def test_api__guest_download_content_info__err_400__not_shareable_type(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_folder = content_api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            label="Test folder",
            do_save=False,
            do_notify=False,
        )
        content_api.save(test_folder)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_folder, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_folder)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__guest_download_content_info__err_400__content_share_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}".format(share_token="invalid-token"),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_SHARE_NOT_FOUND

    def test_api__guest_download_content_file__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=200,
        )
        assert res.body == b"Test file"
        assert res.content_type == "plain/text"
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format("toto.txt", "toto.txt")

        res2 = web_testapp.post(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=200,
        )
        assert res.body == res2.body

    def test_api__guest_download_content_file__err_400__public_download_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_download_enabled=False, save_now=True
        )
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

        res2 = web_testapp.post(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res2.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

    def test_api__guest_download_content_file__err_400__content_share_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}/toto.txt".format(share_token="invalid-token"),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_SHARE_NOT_FOUND

    def test_api__guest_download_content_file__err_400__not_shareable_type(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_folder = content_api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            label="Test folder",
            do_save=False,
            do_notify=False,
        )
        content_api.save(test_folder)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_folder, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_folder)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__guest_download_content_file_post__ok_200__with_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"], password="123456"
        )
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.post(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            params={"password": "123456"},
            status=200,
        )
        assert res.body == b"Test file"
        assert res.content_type == "plain/text"
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format("toto.txt", "toto.txt")

    def test_api__guest_download_content_file__err_403__no_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"], password="123456"
        )
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        web_testapp.get(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=403,
        )
        web_testapp.post(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=403,
        )

    def test_api__guest_download_content_file_post__err_403__wrong_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"], password="123456"
        )
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        web_testapp.post(
            "/api/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            params={"password": "987654321"},
            status=403,
        )

    def test_api__guest_download_check__ok_204__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            status=204,
        )

    def test_api__guest_download_check__err_400__public_download_disabled(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace(
            "test workspace", public_download_enabled=False, save_now=True
        )
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.WORKSPACE_PUBLIC_DOWNLOAD_DISABLED

    def test_api__guest_download_check__err_400__content_share_not_found(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        res = web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(share_token="invalid-token"),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_SHARE_NOT_FOUND

    def test_api__guest_download_check__err_400__deleted__file(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.delete(test_file)
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__guest_download_check__err_400__archived__file(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.archive(test_file)
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_NOT_FOUND

    def test_api__guest_download_check__err_400__not_shareable_type(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_folder = content_api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            label="Test folder",
            do_save=False,
            do_notify=False,
        )
        content_api.save(test_folder)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(test_folder, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_folder)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.CONTENT_TYPE_NOT_ALLOWED

    def test_api__guest_download_check__ok_200__with_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"], password="123456"
        )
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            params={"password": "123456"},
            status=204,
        )

    def test_api__guest_download_check__err_403__no_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"], password="123456"
        )
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            status=403,
        )

    def test_api__guest_download_check__err_403__wrong_password(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_lib_factory,
        admin_user,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        test_file = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            label="Test file",
            do_save=False,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=test_file):
            content_api.update_file_data(
                test_file, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.save(test_file)
        share_api = share_lib_factory.get()  # type: ShareLib
        share_api.share_content(
            test_file, emails=["thissharewill@notbe.presentinresponse"], password="123456"
        )
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        web_testapp.post_json(
            "/api/public/guest-download/{share_token}/check".format(
                share_token=content_share.share_token
            ),
            params={"password": "987654321"},
            status=403,
        )
