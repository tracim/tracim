import pytest
import transaction

from tracim_backend.lib.search.simple_search.simple_search_api import SimpleSearchApi
from tracim_backend.models.auth import Profile
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa F403,F401


@pytest.mark.usefixtures("base_fixture")
class TestSimpleSearchApi(object):
    def test_unit__search_in_label__ok__nominal_case(
        self,
        workspace_api_factory,
        session,
        app_config,
        user_api_factory,
        content_api_factory,
        content_type_list,
    ):
        # HACK - D.A. - 2015-03-09
        # This test is based on a bug which does NOT return results found
        # at root of a workspace (eg a folder)
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = content_api_factory.get(user)
        a = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            label="this is randomized folder",
            do_save=True,
        )
        p = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=a,
            label="this is another thing",
            do_save=True,
        )

        with new_revision(session=session, tm=transaction.manager, content=p):
            p.description = "This is some other test"

        api.save(p)
        original_id = a.content_id

        simple_search_api = SimpleSearchApi(current_user=user, session=session, config=app_config)
        res = simple_search_api._search_query(["randomized"], content_api=api)
        assert 1 == len(res.all())
        item = res.all()[0]
        assert original_id == item.content_id

    def test_unit__search_in_filename__nominal_case(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_api_factory,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = content_api_factory.get(user)
        a = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            label="this is randomized folder",
            do_save=True,
        )
        p = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=a,
            label="this is dummy label content",
            do_save=True,
        )

        with new_revision(tm=transaction.manager, session=session, content=p):
            p.description = "This is some amazing test"

        api.save(p)
        original_id = a.content_id

        simple_search_api = SimpleSearchApi(current_user=user, session=session, config=app_config)

        res = simple_search_api._search_query(["this is randomized folder"], content_api=api)
        assert 1 == len(res.all())
        item = res.all()[0]
        assert original_id == item.content_id

        original_id = p.content_id
        res = simple_search_api._search_query(
            ["this is dummy label content.document.html"], content_api=api
        )
        assert 1 == len(res.all())
        item = res.all()[0]
        assert original_id == item.content_id
