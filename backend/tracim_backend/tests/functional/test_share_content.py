import pytest
import transaction

from tracim_backend.lib.share.share import ShareApi
from tracim_backend.models.content_share import ContentShareType
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestPrivateShareMethods(object):
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
            "/api/v2/workspaces/{}/contents/{}/shares".format(
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
        share_api_factory,
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
        share_api = share_api_factory.get()  # type: ShareApi
        share_api.share_content(test_file, emails=["test@test.test", "test2@test2.test2"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
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
            "http://localhost:6543/api/v2/public/guest-download/"
        )
        assert content[0]["created"]
        assert content[0]["author"]
        assert content[0]["share_group_id"] == content[1]["share_group_id"]
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["share_id"] != content[1]["share_id"]
        assert content[1]["email"] == "test2@test2.test2"

    def test_api__add_share__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_api_factory,
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
        share_api = share_api_factory.get()  # type: ShareApi
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 1
        params = {"emails": ["test@test.test", "test2@test2.test2"], "password": "123456"}
        res = web_testapp.put_json(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
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
        assert content[0]["email"] == "test@test.test"
        assert content[0]["url"].startswith("http://localhost:6543/ui/guest-download/")
        assert content[0]["direct_url"].startswith(
            "http://localhost:6543/api/v2/public/guest-download/"
        )
        assert content[0]["created"]
        assert content[0]["author"]
        assert content[0]["share_group_id"] == content[1]["share_group_id"]
        assert content[0]["created"] == content[1]["created"]
        assert content[0]["share_id"] != content[1]["share_id"]
        assert content[1]["email"] == "test2@test2.test2"

        res = web_testapp.get(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 3

    def test_api__delete_share__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_api_factory,
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
        share_api = share_api_factory.get()  # type: ShareApi
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 1
        assert content[0]["share_id"]
        share_id = content[0]["share_id"]

        res = web_testapp.delete(
            "/api/v2/workspaces/{}/contents/{}/shares/{}".format(
                workspace.workspace_id, test_file.content_id, share_id
            ),
            status=204,
        )

        res = web_testapp.get(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
        )
        content = res.json_body
        assert len(content) == 0

        res = web_testapp.get(
            "/api/v2/workspaces/{}/contents/{}/shares".format(
                workspace.workspace_id, test_file.content_id
            ),
            status=200,
            params={"show_disabled": 1},
        )
        content = res.json_body
        assert len(content) == 1

    def test_api__guest_download_content_info__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_api_factory,
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
        share_api = share_api_factory.get()  # type: ShareApi
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/v2/public/guest-download/{share_token}".format(
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
        assert share["content_label"] == "Test_file"
        assert share["content_size"] == 9
        assert share["content_filename"] == "Test_file.txt"
        assert share["content_file_extension"] == ".txt"

    def test_api__guest_download_content_file__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        content_type_list,
        share_api_factory,
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
        share_api = share_api_factory.get()  # type: ShareApi
        share_api.share_content(test_file, emails=["thissharewill@notbe.presentinresponse"])
        content_shares = share_api.get_content_shares(test_file)
        assert len(content_shares) == 1
        content_share = content_shares[0]
        transaction.commit()
        res = web_testapp.get(
            "/api/v2/public/guest-download/{share_token}/toto.txt".format(
                share_token=content_share.share_token
            ),
            status=200,
        )
        assert res.body == b"Test file"
        assert res.content_type == "plain/text"
        assert res.headers[
            "Content-Disposition"
        ] == "attachment; filename=\"{}\"; filename*=UTF-8''{};".format("toto.txt", "toto.txt")
