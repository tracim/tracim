from unittest.mock import MagicMock

from pluggy import PluginManager
import pytest
import transaction

from tracim_backend.lib.core.plugins import PLUGIN_NAMESPACE
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.crud_hook.caller import DatabaseCrudHookCaller
from tracim_backend.lib.crud_hook.hookspec import DatabaseCrudHookSpec
from tracim_backend.models.auth import User
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


class UserHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_user_created(self, user: User, db_session: TracimSession) -> None:
        self.mock_hooks("created", user=user, db_session=db_session)

    @hookimpl
    def on_user_modified(self, user: User, db_session: TracimSession) -> None:
        self.mock_hooks("modified", user=user, db_session=db_session)

    @hookimpl
    def on_user_deleted(self, user: User, db_session: TracimSession) -> None:
        self.mock_hooks("deleted", user=user, db_session=db_session)


class WorkspaceHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_workspace_created(self, workspace: Workspace, db_session: TracimSession) -> None:
        self.mock_hooks("created", workspace=workspace, db_session=db_session)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, db_session: TracimSession) -> None:
        self.mock_hooks("modified", workspace=workspace, db_session=db_session)

    @hookimpl
    def on_workspace_deleted(self, workspace: Workspace, db_session: TracimSession) -> None:
        self.mock_hooks("deleted", workspace=workspace, db_session=db_session)


class ContentHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_content_created(self, content: Content, db_session: TracimSession) -> None:
        self.mock_hooks("created", content=content, db_session=db_session)

    @hookimpl
    def on_content_modified(self, content: Content, db_session: TracimSession) -> None:
        self.mock_hooks("modified", content=content, db_session=db_session)

    @hookimpl
    def on_content_deleted(self, content: Content, db_session: TracimSession) -> None:
        self.mock_hooks("deleted", content=content, db_session=db_session)


class UserRoleInWorkspaceHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        self.mock_hooks("created", role=role, db_session=db_session)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        self.mock_hooks("modified", role=role, db_session=db_session)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, db_session: TracimSession
    ) -> None:
        self.mock_hooks("deleted", role=role, db_session=db_session)


@pytest.mark.usefixtures("base_fixture")
class TestDatabaseCrudHookCaller:
    def test_unit__crud_caller__ok__user(self, session):
        plugin_manager = PluginManager(PLUGIN_NAMESPACE)
        plugin_manager.add_hookspecs(DatabaseCrudHookSpec)
        hook = UserHookImpl()
        plugin_manager.register(hook)
        DatabaseCrudHookCaller(plugin_manager)

        user = User(email="foo@bar")
        session.add(user)
        session.flush()
        hook.mock_hooks.assert_called_with("created", user=user, db_session=session)

        user.display_name = "John doe"
        session.flush()
        hook.mock_hooks.assert_called_with("modified", user=user, db_session=session)

        session.delete(user)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", user=user, db_session=session)

    def test_unit__crud_caller__ok__workspace(self, session):
        plugin_manager = PluginManager(PLUGIN_NAMESPACE)
        plugin_manager.add_hookspecs(DatabaseCrudHookSpec)
        hook = WorkspaceHookImpl()
        plugin_manager.register(hook)
        DatabaseCrudHookCaller(plugin_manager)

        owner = User(email="john")
        session.add(owner)
        session.flush()

        workspace = Workspace(label="Hello", owner_id=owner.user_id)
        session.add(workspace)
        session.flush()
        hook.mock_hooks.assert_called_with("created", workspace=workspace, db_session=session)

        workspace.label = "World"
        session.flush()
        hook.mock_hooks.assert_called_with("modified", workspace=workspace, db_session=session)

        session.delete(workspace)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", workspace=workspace, db_session=session)

    def test_unit__crud_caller__ok__user_role_in_workspace(self, session):
        plugin_manager = PluginManager(PLUGIN_NAMESPACE)
        plugin_manager.add_hookspecs(DatabaseCrudHookSpec)
        hook = UserRoleInWorkspaceHookImpl()
        plugin_manager.register(hook)
        DatabaseCrudHookCaller(plugin_manager)

        owner = User(email="john")
        workspace = Workspace(label="Hello", owner=owner)
        session.add(workspace)
        session.flush()

        role = UserRoleInWorkspace(role=UserRoleInWorkspace.READER, user=owner, workspace=workspace)
        session.add(role)
        session.flush()
        hook.mock_hooks.assert_called_with("created", role=role, db_session=session)

        role.role = UserRoleInWorkspace.WORKSPACE_MANAGER
        session.add(role)
        session.flush()
        hook.mock_hooks.assert_called_with("modified", role=role, db_session=session)

        session.delete(role)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", role=role, db_session=session)

    def test_unit__crud_caller__ok__content(self, session):
        plugin_manager = PluginManager(PLUGIN_NAMESPACE)
        plugin_manager.add_hookspecs(DatabaseCrudHookSpec)
        hook = ContentHookImpl()
        plugin_manager.register(hook)
        DatabaseCrudHookCaller(plugin_manager)

        owner = User(email="john")
        session.add(owner)
        workspace = Workspace(label="Hello", owner=owner)
        session.add(workspace)
        session.flush()

        content = Content(
            label="Foo",
            owner=owner,
            workspace=workspace,
            revision_type=ActionDescription.CREATION,
            type="html-document",
        )
        session.add(content)
        session.flush()
        hook.mock_hooks.assert_called_with("created", content=content, db_session=session)

        with new_revision(
            session=session, tm=transaction.manager, content=content,
        ):
            content.label = "Bar"

        session.add(content)
        session.flush()
        hook.mock_hooks.assert_called_with("modified", content=content, db_session=session)

        # TODO SGD 2020/05/06: add this test when deleting a Content is possible
        session.delete(content)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", content=content, db_session=session)
