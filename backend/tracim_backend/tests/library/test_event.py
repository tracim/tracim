import pytest
import transaction

from tracim_backend.models.auth import Profile
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa F403,F401


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("session", [{"mock_event_builder": False}], indirect=True)
class TestEventBuilder:
    def test_unit__on_modified_user__is_deleted(
        self, user_api_factory, session, app_config, event_helper
    ) -> None:
        uapi = user_api_factory.get()
        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)

        uapi.delete(user, do_save=True)
        assert event_helper.last_event.event_type == "user.deleted"

        uapi.update(user, name="John", do_save=True)
        update_while_deleted_event = event_helper.last_event
        assert update_while_deleted_event.event_type == "user.modified"

        uapi.undelete(user, do_save=True)
        undelete_event = event_helper.last_event
        assert undelete_event.event_type == "user.undeleted"

        assert undelete_event.event_id == update_while_deleted_event.event_id + 1

    def test_unit__on_modified_content__is_deleted(
        self,
        content_api_factory,
        workspace_api_factory,
        session,
        app_config,
        event_helper,
        content_type_list,
    ) -> None:
        capi = content_api_factory.get()
        wapi = workspace_api_factory.get()
        workspace = wapi.create_workspace("test workspace", save_now=True)

        content = capi.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )

        with new_revision(session=session, tm=transaction.manager, content=content):
            capi.delete(content)
        transaction.commit()
        assert event_helper.last_event.event_type == "content.deleted.file"

        with new_revision(session=session, tm=transaction.manager, content=content):
            capi.undelete(content)
        transaction.commit()
        undelete_event = event_helper.last_event
        assert undelete_event.event_type == "content.undeleted.file"
