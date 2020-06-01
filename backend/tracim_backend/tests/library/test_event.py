import pytest

from tracim_backend.lib.core.event import EventBuilder
from tracim_backend.lib.core.plugins import init_plugin_manager
from tracim_backend.lib.crud_hook.caller import DatabaseCrudHookCaller
from tracim_backend.models.auth import Profile
from tracim_backend.tests.fixtures import *  # noqa F403,F401


@pytest.mark.usefixtures("base_fixture")
class TestEventBuilder:
    def test_unit__on_modified_user__is_deleted(
        self, user_api_factory, session, app_config, event_helper
    ) -> None:
        manager = init_plugin_manager(app_config)
        DatabaseCrudHookCaller(session, manager)
        manager.register(EventBuilder(app_config))

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
