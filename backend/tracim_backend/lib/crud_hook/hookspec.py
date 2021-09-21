from tracim_backend.lib.core.plugins import hookspec
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.call import UserCall
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceSubscription
from tracim_backend.models.reaction import Reaction
from tracim_backend.models.tag import Tag
from tracim_backend.models.tag import TagOnContent


class DatabaseCrudHookSpec:
    """Hook specifications for crud operations on tracim entities:
    - User
    - Content
    - Workspace
    - UserRoleInWorkspace
    - WorkspaceSubscription
    - Reaction
    - Tag
    - TagOnContent
    - UserCall
    """

    @hookspec
    def on_user_created(self, user: User, context: TracimContext) -> None:
        ...

    @hookspec
    def on_user_modified(self, user: User, context: TracimContext) -> None:
        ...

    @hookspec
    def on_user_deleted(self, user: User, context: TracimContext) -> None:
        ...

    @hookspec
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        ...

    @hookspec
    def on_workspace_modified(self, workspace: Workspace, context: TracimContext) -> None:
        ...

    @hookspec
    def on_workspace_deleted(self, workspace: Workspace, context: TracimContext) -> None:
        ...

    @hookspec
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext,
    ) -> None:
        ...

    @hookspec
    def on_user_role_in_workspace_modified(
        self, role: UserRoleInWorkspace, context: TracimContext,
    ) -> None:
        ...

    @hookspec
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext,
    ) -> None:
        ...

    @hookspec
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        ...

    @hookspec
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        ...

    @hookspec
    def on_content_deleted(self, content: Content, context: TracimContext) -> None:
        ...

    @hookspec
    def on_content_revision_created(self, content: Content, context: TracimContext) -> None:
        ...

    @hookspec
    def on_workspace_subscription_created(
        self, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        ...

    @hookspec
    def on_workspace_subscription_modified(
        self, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        ...

    @hookspec
    def on_workspace_subscription_deleted(
        self, subscription: WorkspaceSubscription, context: TracimContext
    ) -> None:
        ...

    @hookspec
    def on_reaction_created(self, reaction: Reaction, context: TracimContext) -> None:
        ...

    @hookspec
    def on_reaction_modified(self, reaction: Reaction, context: TracimContext) -> None:
        ...

    @hookspec
    def on_reaction_deleted(self, reaction: Reaction, context: TracimContext) -> None:
        ...

    @hookspec
    def on_tag_created(self, tag: Tag, context: TracimContext) -> None:
        ...

    @hookspec
    def on_tag_modified(self, tag: Tag, context: TracimContext) -> None:
        ...

    @hookspec
    def on_tag_deleted(self, tag: Tag, context: TracimContext) -> None:
        ...

    @hookspec
    def on_content_tag_created(self, content_tag: TagOnContent, context: TracimContext) -> None:
        ...

    @hookspec
    def on_content_tag_deleted(self, content_tag: TagOnContent, context: TracimContext) -> None:
        ...

    @hookspec
    def on_user_call_created(self, user_call: UserCall, context: TracimContext) -> None:
        ...

    @hookspec
    def on_user_call_modified(self, user_call: UserCall, context: TracimContext) -> None:
        ...

    @hookspec
    def on_user_call_deleted(self, user_call: UserCall, context: TracimContext) -> None:
        ...
