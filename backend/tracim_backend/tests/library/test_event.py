import pytest
import transaction

from tracim_backend.lib.core.event import BaseLiveMessageBuilder
from tracim_backend.lib.core.event import EventApi
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import OperationType
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.tests.fixtures import *  # noqa F403,F401
from tracim_backend.tests.utils import RoleApiFactory
from tracim_backend.tests.utils import SubscriptionLibFactory
from tracim_backend.tests.utils import UserApiFactory
from tracim_backend.tests.utils import WorkspaceApiFactory
from tracim_backend.views.core_api.schemas import ContentSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema
from tracim_backend.views.core_api.schemas import WorkspaceSubscriptionSchema


def create_workspace_and_users(
    access_type: WorkspaceAccessType, user_api_factory, workspace_api_factory, role_api_factory,
):
    """
    Create a workspace, a member and a non member user
    Return a tuple (workspace, member, member_role, non_member, current_user)
    current_user is the user who created the workspace/role.
    """
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
    my_workspace = workspace_api.create_workspace(
        "test workspace", access_type=access_type, save_now=True
    )
    rapi = role_api_factory.get(current_user=event_initiator)
    role = rapi.create_one(
        same_workspace_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
    )
    transaction.commit()
    return (my_workspace, same_workspace_user, role, other_user, event_initiator)


@pytest.fixture
def workspace_and_users(
    user_api_factory, workspace_api_factory, role_api_factory,
):
    return create_workspace_and_users(
        WorkspaceAccessType.CONFIDENTIAL, user_api_factory, workspace_api_factory, role_api_factory
    )


@pytest.fixture
def accessible_workspace_and_users(
    user_api_factory, workspace_api_factory, role_api_factory,
):
    return create_workspace_and_users(
        WorkspaceAccessType.OPEN, user_api_factory, workspace_api_factory, role_api_factory
    )


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
        self, session, workspace_and_users, admin_user, user_api_factory, app_config
    ):
        (my_workspace, same_workspace_user, _, other_user, event_initiator) = workspace_and_users
        user_api = user_api_factory.get()
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

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_event__nominal_case(
        self,
        session,
        workspace_and_users,
        admin_user,
        user_api_factory,
        workspace_api_factory,
        app_config,
    ):
        (my_workspace, same_workspace_user, _, other_user, event_initiator) = workspace_and_users
        workspace_api = workspace_api_factory.get()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        user_api = user_api_factory.get()
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

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_event__accessible_workspace(
        self,
        session,
        accessible_workspace_and_users,
        admin_user,
        user_api_factory,
        workspace_api_factory,
        app_config,
    ):
        (
            my_workspace,
            same_workspace_user,
            _,
            other_user,
            event_initiator,
        ) = accessible_workspace_and_users
        workspace_api = workspace_api_factory.get()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        user_api = user_api_factory.get()
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

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_event__workspace_without_access_type(
        self,
        session,
        accessible_workspace_and_users,
        admin_user,
        user_api_factory,
        workspace_api_factory,
        app_config,
    ):
        (
            my_workspace,
            same_workspace_user,
            _,
            other_user,
            event_initiator,
        ) = accessible_workspace_and_users
        workspace_api = workspace_api_factory.get()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        user_api = user_api_factory.get()
        workspace_dict = WorkspaceSchema(exclude=("access_type",)).dump(workspace_in_context).data
        fields = {
            Event.AUTHOR_FIELD: UserSchema()
            .dump(user_api.get_user_with_context(event_initiator))
            .data,
            Event.CLIENT_TOKEN_FIELD: "test",
            Event.WORKSPACE_FIELD: workspace_dict,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE, operation=OperationType.MODIFIED, fields=fields
        )

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_members_event__nominal_case(
        self,
        session,
        workspace_and_users,
        admin_user,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        app_config,
    ):
        (my_workspace, same_workspace_user, role, other_user, event_initiator) = workspace_and_users
        workspace_api = workspace_api_factory.get()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        rapi = role_api_factory.get()
        user_api = user_api_factory.get()
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

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id in receivers_ids

    def test_unit__get_receiver_ids_workspace_members_event__accessible_workspace(
        self,
        session,
        accessible_workspace_and_users,
        admin_user,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        app_config,
    ):
        (
            my_workspace,
            same_workspace_user,
            role,
            other_user,
            event_initiator,
        ) = accessible_workspace_and_users
        workspace_api = workspace_api_factory.get()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        rapi = role_api_factory.get()
        user_api = user_api_factory.get()
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

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
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
        workspace_and_users,
        app_config,
    ):
        (my_workspace, same_workspace_user, role, other_user, event_initiator) = workspace_and_users
        workspace_api = workspace_api_factory.get()
        user_api = user_api_factory.get()
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        content_api = content_api_factory.get(current_user=event_initiator)
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

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert event_initiator.user_id in receivers_ids
        assert same_workspace_user.user_id in receivers_ids
        assert other_user.user_id not in receivers_ids
        assert admin_user.user_id not in receivers_ids

    def test_unit__get_receiver_ids_workspace_subscription_event__subscription(
        self,
        session: TracimSession,
        user_api_factory: UserApiFactory,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
        workspace_api_factory: WorkspaceApiFactory,
        role_api_factory: RoleApiFactory,
        app_config,
    ):
        user_api = user_api_factory.get()
        profile = Profile.USER
        subscriber = user_api.create_user(
            "initiator@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_content_manager = user_api.create_user(
            "workspace_content_manager@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_manager = user_api.create_user(
            "workspace_manager@test.test",
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
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        my_workspace = workspace_api.create_workspace(
            "test workspace", save_now=True, access_type=WorkspaceAccessType.ON_REQUEST
        )
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        subscription_lib = subscription_lib_factory.get(current_user=subscriber)
        rapi = role_api_factory.get(current_user=subscriber)
        rapi.create_one(
            workspace_content_manager, my_workspace, UserRoleInWorkspace.CONTENT_MANAGER, False
        )
        rapi.create_one(
            workspace_manager, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        subscription = subscription_lib.submit_subscription(my_workspace)
        transaction.commit()
        fields = {
            Event.AUTHOR_FIELD: UserSchema().dump(user_api.get_user_with_context(subscriber)).data,
            Event.WORKSPACE_FIELD: WorkspaceSchema().dump(workspace_in_context).data,
            Event.SUBSCRIPTION_FIELD: WorkspaceSubscriptionSchema().dump(subscription).data,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE_SUBSCRIPTION,
            operation=OperationType.CREATED,
            fields=fields,
        )

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert subscriber.user_id in receivers_ids
        assert workspace_manager.user_id in receivers_ids
        assert admin_user.user_id in receivers_ids
        assert workspace_content_manager.user_id not in receivers_ids
        assert other_user.user_id not in receivers_ids

    def test_unit__get_receiver_ids_workspace_subscription_event__reject_subscription(
        self,
        session: TracimSession,
        user_api_factory: UserApiFactory,
        subscription_lib_factory: SubscriptionLibFactory,
        admin_user: User,
        workspace_api_factory: WorkspaceApiFactory,
        role_api_factory: RoleApiFactory,
        app_config,
    ):
        user_api = user_api_factory.get()
        profile = Profile.USER
        subscriber = user_api.create_user(
            "initiator@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_content_manager = user_api.create_user(
            "workspace_content_manager@test.test",
            password="test@test.test",
            do_save=True,
            do_notify=False,
            profile=profile,
        )
        workspace_manager = user_api.create_user(
            "workspace_manager@test.test",
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
        workspace_api = workspace_api_factory.get(current_user=admin_user)
        my_workspace = workspace_api.create_workspace(
            "test workspace", save_now=True, access_type=WorkspaceAccessType.ON_REQUEST
        )
        workspace_in_context = workspace_api.get_workspace_with_context(my_workspace)
        subscription_lib = subscription_lib_factory.get(current_user=subscriber)
        rapi = role_api_factory.get(current_user=subscriber)
        rapi.create_one(
            workspace_content_manager, my_workspace, UserRoleInWorkspace.CONTENT_MANAGER, False
        )
        rapi.create_one(
            workspace_manager, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False
        )
        subscription = subscription_lib.submit_subscription(my_workspace)
        subscription_lib.reject_subscription(subscription)
        transaction.commit()
        fields = {
            Event.AUTHOR_FIELD: UserSchema().dump(user_api.get_user_with_context(admin_user)).data,
            Event.WORKSPACE_FIELD: WorkspaceSchema().dump(workspace_in_context).data,
            Event.SUBSCRIPTION_FIELD: WorkspaceSubscriptionSchema().dump(subscription).data,
        }
        event = Event(
            entity_type=EntityType.WORKSPACE_SUBSCRIPTION,
            operation=OperationType.MODIFIED,
            fields=fields,
        )

        receivers_ids = FakeLiveMessageBuilder().get_receiver_ids(event, session, app_config)
        assert subscriber.user_id in receivers_ids
        assert workspace_manager.user_id in receivers_ids
        assert admin_user.user_id in receivers_ids
        assert workspace_content_manager.user_id not in receivers_ids
        assert other_user.user_id not in receivers_ids


@pytest.mark.usefixtures("base_fixture")
class TestEventApi:
    def test__message_history_creation_with_workspace_join_hook__ok__nominal_case(
        self, session, app_config, admin_user, workspace_and_users, message_helper, role_api_factory
    ):
        """
        Test hook on workspace_join about adding previous workspace event as user messages,
        Default tracim config should add all previous event as user message without sent set.
        Please notice that only those message are generated in this test, MessageBuilder is disabled
        in this test context, so anly created message are historic one.
        """
        (my_workspace, same_workspace_user, _, other_user, event_initiator) = workspace_and_users
        default_workspace_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert default_workspace_messages == []

        rapi = role_api_factory.get(current_user=event_initiator)
        rapi.create_one(other_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        transaction.commit()

        workspace_message_at_workspace_join = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert len(workspace_message_at_workspace_join) > len(default_workspace_messages)
        for message in workspace_message_at_workspace_join:
            assert message.sent is None
            assert message.receiver_id == other_user.user_id
            assert message.event.workspace["workspace_id"] == my_workspace.workspace_id

    @pytest.mark.parametrize(
        "config_section",
        [{"name": "base_test_historic_message_generation_disabled"}],
        indirect=True,
    )
    @pytest.mark.parametrize("max_message_generated", [1, 2, 100])
    def test__create_messages_history_for_user__ok__positive_max_message(
        self,
        session,
        app_config,
        admin_user,
        workspace_and_users,
        message_helper,
        role_api_factory,
        max_message_generated,
    ):
        """
        Test more specifically generate_historic_workspaces_messages method, we do set
        config parameter to 0 to avoid hook creating itself the required messages itself.
        Case where max_message_generated > 0
        """
        (my_workspace, same_workspace_user, _, other_user, event_initiator) = workspace_and_users
        # default
        default_workspace_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert default_workspace_messages == []

        # try generate workspace message: not in workspace, should return empty list
        event_api = EventApi(current_user=admin_user, session=session, config=app_config)
        generated_messages = event_api.create_messages_history_for_user(
            user_id=other_user.user_id,
            workspace_ids=[my_workspace.workspace_id],
            max_messages_count=max_message_generated,
        )
        assert generated_messages == []
        transaction.commit()
        last_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert last_messages == []

        # join workspace: should not generated message these feature are disabled
        rapi = role_api_factory.get(current_user=event_initiator)
        rapi.create_one(other_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        transaction.commit()
        last_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert last_messages == []

        # retry generate workspace message: should return message list
        event_api = EventApi(current_user=admin_user, session=session, config=app_config)
        generated_messages = event_api.create_messages_history_for_user(
            user_id=other_user.user_id,
            workspace_ids=[my_workspace.workspace_id],
            max_messages_count=max_message_generated,
        )
        transaction.commit()
        assert generated_messages
        last_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert last_messages
        assert len(generated_messages) == len(last_messages)
        assert len(last_messages) <= max_message_generated

        # re-retry generate workspace message: should not create new message
        event_api = EventApi(current_user=admin_user, session=session, config=app_config)
        new_generated_messages = event_api.create_messages_history_for_user(
            user_id=other_user.user_id,
            workspace_ids=[my_workspace.workspace_id],
            max_messages_count=max_message_generated,
        )
        transaction.commit()
        assert not new_generated_messages
        last_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert last_messages
        assert len(generated_messages) == len(last_messages)
        assert len(last_messages) <= max_message_generated

    @pytest.mark.parametrize(
        "config_section",
        [{"name": "base_test_historic_message_generation_disabled"}],
        indirect=True,
    )
    @pytest.mark.parametrize("max_message_generated", [-1, 0])
    def test__create_messages_history_for_user_ok__not_positive_max_message(
        self,
        session,
        app_config,
        admin_user,
        workspace_and_users,
        message_helper,
        role_api_factory,
        max_message_generated,
    ):
        """
        Test more specifically generate_historic_workspaces_messages method, we do set
        config parameter to 0 to avoid hook creating itself the required messages itself.
        Case where max_message_generated == 0 or -1 (infinite)
        """
        (my_workspace, same_workspace_user, _, other_user, event_initiator) = workspace_and_users
        # default
        default_workspace_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert default_workspace_messages == []

        # join workspace: should not generated message these feature are disabled
        rapi = role_api_factory.get(current_user=event_initiator)
        rapi.create_one(other_user, my_workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, False)
        transaction.commit()
        last_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        assert last_messages == []

        # generate workspace message: should return message list
        event_api = EventApi(current_user=admin_user, session=session, config=app_config)
        event_api.create_messages_history_for_user(
            user_id=other_user.user_id,
            workspace_ids=[my_workspace.workspace_id],
            max_messages_count=max_message_generated,
        )
        transaction.commit()
        last_messages = message_helper.last_user_workspace_messages(
            100, my_workspace.workspace_id, other_user.user_id
        )
        if max_message_generated == -1:
            assert len(last_messages) == 5
        elif not max_message_generated:
            assert len(last_messages) == 0
