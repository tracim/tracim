from unittest.mock import MagicMock

import pytest
import transaction

from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


class UserHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        self.mock_hooks("created", user=user, context=context)

    @hookimpl
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        self.mock_hooks("modified", user=user, context=context)

    @hookimpl
    def on_user_deleted(self, user: User, context: TracimContext) -> None:
        self.mock_hooks("deleted", user=user, context=context)


class WorkspaceHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        self.mock_hooks("created", workspace=workspace, context=context)

    @hookimpl
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:
        self.mock_hooks("modified", workspace=workspace, context=context)

    @hookimpl
    def on_workspace_deleted(self, workspace: Workspace, context: TracimContext) -> None:
        self.mock_hooks("deleted", workspace=workspace, context=context)


class ContentHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        self.mock_hooks("created", content=content, context=context)

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        self.mock_hooks("modified", content=content, context=context)

    @hookimpl
    def on_content_deleted(self, content: Content, context: TracimContext) -> None:
        self.mock_hooks("deleted", content=content, context=context)


class UserRoleInWorkspaceHookImpl:
    def __init__(self) -> None:
        self.mock_hooks = MagicMock()

    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self.mock_hooks("created", role=role, context=context)

    @hookimpl
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self.mock_hooks("modified", role=role, context=context)

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        self.mock_hooks("deleted", role=role, context=context)


@pytest.mark.usefixtures("base_fixture")
class TestDatabaseCrudHookCaller:
    def test_unit__crud_caller__ok__user(self, session):
        hook = UserHookImpl()
        session.context.plugin_manager.register(hook)
        user = User(email="foo@bar")
        session.add(user)
        session.flush()
        hook.mock_hooks.assert_called_with("created", user=user, context=session.context)

        user.display_name = "John doe"
        session.flush()
        hook.mock_hooks.assert_called_with("modified", user=user, context=session.context)

        session.delete(user)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", user=user, context=session.context)

    def test_unit__crud_caller__ok__workspace(self, session):
        hook = WorkspaceHookImpl()
        session.context.plugin_manager.register(hook)

        owner = User(email="john")
        session.add(owner)
        session.flush()

        workspace = Workspace(label="Hello", owner_id=owner.user_id)
        session.add(workspace)
        session.flush()
        hook.mock_hooks.assert_called_with("created", workspace=workspace, context=session.context)

        workspace.label = "World"
        session.flush()
        hook.mock_hooks.assert_called_with("modified", workspace=workspace, context=session.context)

        session.delete(workspace)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", workspace=workspace, context=session.context)

    def test_unit__crud_caller__ok__user_role_in_workspace(self, session):

        hook = UserRoleInWorkspaceHookImpl()
        session.context.plugin_manager.register(hook)

        owner = User(email="john")
        workspace = Workspace(label="Hello", owner=owner)
        session.add(workspace)
        session.flush()

        role = UserRoleInWorkspace(role=UserRoleInWorkspace.READER, user=owner, workspace=workspace)
        session.add(role)
        session.flush()
        hook.mock_hooks.assert_called_with("created", role=role, context=session.context)

        role.role = UserRoleInWorkspace.WORKSPACE_MANAGER
        session.add(role)
        session.flush()
        hook.mock_hooks.assert_called_with("modified", role=role, context=session.context)

        session.delete(role)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", role=role, context=session.context)

    def test_unit__crud_caller__ok__content(self, session):
        hook = ContentHookImpl()
        session.context.plugin_manager.register(hook)

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
        hook.mock_hooks.assert_called_with("created", content=content, context=session.context)

        with new_revision(
            session=session, tm=transaction.manager, content=content,
        ):
            content.label = "Bar"

        session.add(content)
        session.flush()
        hook.mock_hooks.assert_called_with("modified", content=content, context=session.context)

        # TODO SGD 2020/05/06: add this test when deleting a Content is possible
        session.delete(content)
        session.flush()
        hook.mock_hooks.assert_called_with("deleted", content=content, context=session.context)
