# -*- coding: utf-8 -*-
import pytest
import transaction

from tracim_backend.error import ErrorCode
from tracim_backend.lib.core.reaction import ReactionLib
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.views.core_api.schemas import UserDigestSchema

SAMPLE_REACTION_LIST = (":custom_text:", "🐧", "🐻‍❄️", "👨‍👨‍👧‍👧", "👍🏾")


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestReactionsEndpoint(object):
    """
    Tests for /api/workspaces/{workspace_id}/contents/{content_id}/reactions
    endpoint
    """

    @pytest.mark.parametrize(
        "admin_reaction_values, ryiad_reaction_values",
        [((":custom_text:", "😀", "🐧", "🦋",), ("🐧", "🐻‍❄️", "👨‍👨‍👧‍👧"))],
    )
    def test_api__get_contents_reactions__ok_200__nominal_case(
        self,
        web_testapp,
        session,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        admin_user,
        riyad_user,
        admin_reaction_values,
        ryiad_reaction_values,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        reaction_lib = ReactionLib(session)
        for reaction in admin_reaction_values:
            reaction_lib.create(admin_user, folder, reaction, do_save=True)
        for reaction in ryiad_reaction_values:
            reaction_lib.create(riyad_user, folder, reaction, do_save=True)
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id
            ),
            status=200,
        )
        assert len(res.json_body) == len(admin_reaction_values) + len(ryiad_reaction_values)
        reactions = iter(res.json_body)
        for reaction_value in admin_reaction_values:
            reaction_res = next(reactions)
            assert reaction_res["author"]["user_id"] == admin_user.user_id
            assert reaction_res["content_id"] == folder.content_id
            assert reaction_res["value"] == reaction_value
        for reaction_value in ryiad_reaction_values:
            reaction_res = next(reactions)
            assert reaction_res["author"]["user_id"] == riyad_user.user_id
            assert reaction_res["content_id"] == folder.content_id
            assert reaction_res["value"] == reaction_value

    @pytest.mark.parametrize(
        "reaction_value", SAMPLE_REACTION_LIST,
    )
    def test_api__get_one_reaction__ok_200__nominal_case(
        self,
        web_testapp,
        session,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
        riyad_user,
        reaction_value,
    ) -> None:
        """
        Get one specific reaction of a content
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        reaction_lib = ReactionLib(session)
        reaction = reaction_lib.create(riyad_user, folder, reaction_value, do_save=True)
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction.reaction_id,
            ),
            status=200,
        )
        reaction_res = res.json_body
        assert reaction_res["author"]["user_id"] == riyad_user.user_id
        assert reaction_res["content_id"] == folder.content_id
        assert reaction_res["reaction_id"] == reaction.reaction_id
        assert reaction_res["value"] == reaction_value

    @pytest.mark.parametrize("reaction_value", SAMPLE_REACTION_LIST)
    def test_api__post_content_reaction__ok_200__nominal_case(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        event_helper,
        reaction_value,
    ) -> None:
        """
        Create a reaction
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"value": reaction_value}
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        reaction_res = res.json_body
        assert reaction_res["author"]["user_id"] == admin_user.user_id
        assert reaction_res["content_id"] == folder.content_id
        assert reaction_res["reaction_id"]
        assert reaction_res["value"] == reaction_value

        reaction_id = reaction_res["reaction_id"]

        last_event = event_helper.last_event
        assert last_event.event_type == "reaction.created"
        author = web_testapp.get("/api/users/{}".format(admin_user.user_id), status=200).json_body
        assert last_event.author == UserDigestSchema().dump(author).data
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(test_workspace.workspace_id), status=200
        ).json_body
        assert last_event.workspace == {k: v for k, v in workspace.items() if k != "description"}
        assert last_event.reaction["author"] == UserDigestSchema().dump(author).data
        assert last_event.reaction["content_id"] == folder.content_id
        assert last_event.reaction["reaction_id"] == reaction_id
        assert last_event.reaction["created"]
        assert last_event.reaction["value"] == reaction_value

    @pytest.mark.parametrize("reaction_value", SAMPLE_REACTION_LIST)
    def test_api__post_content_reaction__err_400__already_exist(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        event_helper,
        reaction_value,
    ) -> None:
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"value": reaction_value}
        web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=400,
            params=params,
        )
        assert res.json_body["code"] == ErrorCode.REACTION_ALREADY_EXISTS

    @pytest.mark.parametrize("reaction_value", SAMPLE_REACTION_LIST)
    def test_api__delete_content_reaction__ok_200__user_is_author_and_workspace_manager(
        self,
        workspace_api_factory,
        content_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        event_helper,
        reaction_value,
    ) -> None:
        """
        delete reaction (user is workspace_manager and owner)
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"value": reaction_value}
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        reaction_id = res.json_body["reaction_id"]
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction_id,
            ),
            status=200,
        )
        res = web_testapp.delete(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction_id,
            ),
            status=204,
        )

        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction_id,
            ),
            status=400,
        )
        assert res.json_body["code"] == ErrorCode.REACTION_NOT_FOUND

        last_event = event_helper.last_event
        assert last_event.event_type == "reaction.deleted"
        author = web_testapp.get("/api/users/{}".format(admin_user.user_id), status=200).json_body
        assert last_event.author == UserDigestSchema().dump(author).data
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        workspace = web_testapp.get(
            "/api/workspaces/{}".format(test_workspace.workspace_id), status=200
        ).json_body
        assert last_event.workspace == {k: v for k, v in workspace.items() if k != "description"}
        assert last_event.reaction["author"] == UserDigestSchema().dump(author).data
        assert last_event.reaction["content_id"] == folder.content_id
        assert last_event.reaction["reaction_id"] == reaction_id
        assert last_event.reaction["created"]
        assert last_event.reaction["value"] == reaction_value

    @pytest.mark.parametrize("reaction_value", SAMPLE_REACTION_LIST)
    def test_api__delete_content_reaction__ok_400__is_not_author_and_contributor(
        self,
        workspace_api_factory,
        content_api_factory,
        role_api_factory,
        session,
        web_testapp,
        admin_user,
        content_type_list,
        riyad_user,
        reaction_value,
    ) -> None:
        """
        delete reaction (user is workspace_manager and owner)
        """
        workspace_api = workspace_api_factory.get()
        content_api = content_api_factory.get()
        test_workspace = workspace_api.create_workspace(label="test", save_now=True)
        rapi = role_api_factory.get()
        rapi.create_one(
            riyad_user, test_workspace, UserRoleInWorkspace.CONTRIBUTOR, with_notif=False
        )
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        params = {"value": reaction_value}
        res = web_testapp.post_json(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions".format(
                workspace_id=test_workspace.workspace_id, content_id=folder.content_id,
            ),
            status=200,
            params=params,
        )
        reaction_id = res.json_body["reaction_id"]
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction_id,
            ),
            status=200,
        )
        web_testapp.authorization = ("Basic", (riyad_user.username, "password"))
        res = web_testapp.delete(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction_id,
            ),
            status=403,
        )
        assert res.json_body["code"] == ErrorCode.INSUFFICIENT_USER_ROLE_IN_WORKSPACE
        res = web_testapp.get(
            "/api/workspaces/{workspace_id}/contents/{content_id}/reactions/{reaction_id}".format(
                workspace_id=test_workspace.workspace_id,
                content_id=folder.content_id,
                reaction_id=reaction_id,
            ),
            status=200,
        )
