import pytest
import transaction

from tracim_backend.lib.core.event import BaseLiveMessageBuilder
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import OperationType
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa F403,F401
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema


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


class FakeLiveMessageBuilder(BaseLiveMessageBuilder):
    _config = None

    def __init__(self):
        pass

    def publish_messages_for_event(self, event_id: int) -> None:
        pass

    def context(self) -> None:
        pass


@pytest.mark.usefixtures("base_fixture")
class TestEventReceiver:
    def test_unit__get_receiver_ids_user_event__nominal_case(
        self, session, user_api_factory, admin_user, workspace_api_factory, role_api_factory
    ):
        user_api = user_api_factory.get()
        profile = Profile.USER
        event_initiator = user_api.create_user(
            "initiator@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        same_workspace_user = user_api.create_user(
            "same_workspace@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        other_user = user_api.create_user(
            "other_user@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        my_workspace = workspace_api_factory.get(current_user=event_initiator).create_workspace(
            "test workspace", save_now=True
        )
        rapi = role_api_factory.get()
        rapi.create_one(
            same_workspace_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        transaction.commit()
        fields = {
            Event.AUTHOR_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
            Event.CLIENT_TOKEN_FIELD: "test",
            Event.USER_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
        }
        event = Event(entity_type=EntityType.USER, operation=OperationType.MODIFIED, fields=fields)

        receivers_ids = FakeLiveMessageBuilder()._get_receiver_ids(event, session)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_event__nominal_case(
        self, session, user_api_factory, admin_user, workspace_api_factory, role_api_factory
    ):
        user_api = user_api_factory.get()
        profile = Profile.USER
        event_initiator = user_api.create_user(
            "initiator@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        same_workspace_user = user_api.create_user(
            "same_workspace@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        other_user = user_api.create_user(
            "other_user@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=event_initiator)
        my_workspace = workspace_api.create_workspace("test workspace", save_now=True)
        rapi = role_api_factory.get(current_user=event_initiator)
        rapi.create_one(
            same_workspace_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        transaction.commit()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        fields = {
            Event.AUTHOR_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
            Event.CLIENT_TOKEN_FIELD: "test",
            Event.WORKSPACE_FIELD: WorkspaceSchema().dump(workspace_in_context).data,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE, operation=OperationType.MODIFIED, fields=fields
        )

        receivers_ids = FakeLiveMessageBuilder()._get_receiver_ids(event, session)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_members_event__nominal_case(
        self, session, user_api_factory, admin_user, workspace_api_factory, role_api_factory
    ):
        user_api = user_api_factory.get()
        profile = Profile.USER
        event_initiator = user_api.create_user(
            "initiator@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        same_workspace_user = user_api.create_user(
            "same_workspace@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        other_user = user_api.create_user(
            "other_user@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=event_initiator)
        my_workspace = workspace_api.create_workspace("test workspace", save_now=True)
        rapi = role_api_factory.get(current_user=event_initiator)
        role = rapi.create_one(
            same_workspace_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        transaction.commit()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        role_in_context = rapi.get_user_role_workspace_with_context(role)
        fields = {
            Event.AUTHOR_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
            Event.USER_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
            Event.CLIENT_TOKEN_FIELD: "test",
            Event.WORKSPACE_FIELD: WorkspaceSchema().dump(workspace_in_context).data,
            Event.MEMBER_FIELD: WorkspaceMemberDigestSchema().dump(role_in_context).data,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE_MEMBER, operation=OperationType.MODIFIED, fields=fields
        )

        receivers_ids = FakeLiveMessageBuilder()._get_receiver_ids(event, session)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_content_event__nominal_case(
        self,
        session,
        user_api_factory,
        content_type_list,
        content_api_factory,
        admin_user,
        workspace_api_factory,
        role_api_factory,
    ):
        user_api = user_api_factory.get()
        profile = Profile.USER
        event_initiator = user_api.create_user(
            "initiator@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        same_workspace_user = user_api.create_user(
            "same_workspace@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        other_user = user_api.create_user(
            "other_user@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_api = workspace_api_factory.get(current_user=event_initiator)
        my_workspace = workspace_api.create_workspace("test workspace", save_now=True)
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        content_api = content_api_factory.get(current_user=event_initiator)
        rapi = role_api_factory.get(current_user=event_initiator)
        rapi.create_one(
            same_workspace_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        folder = content_api.create(
            label="test_folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=my_workspace,
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        content_in_context = content_api.get_content_in_context(folder)
        fields = {
            Event.AUTHOR_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
            Event.CONTENT_FIELD: ContentSchema().dump(content_in_context).data,
            Event.CLIENT_TOKEN_FIELD: "test",
            Event.WORKSPACE_FIELD: WorkspaceSchema().dump(workspace_in_context).data,
        }
        event = Event(
            entity_type=EntityType.CONTENT, operation=OperationType.MODIFIED, fields=fields
        )

        receivers_ids = FakeLiveMessageBuilder()._get_receiver_ids(event, session)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id not in receivers_ids
