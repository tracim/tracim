from pluggy import PluginManager
from sqlalchemy import event
from sqlalchemy.orm.session import UOWTransaction

from tracim_backend.models.auth import User
from tracim_backend.models.call import UserCall
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceSubscription
from tracim_backend.models.reaction import Reaction
from tracim_backend.models.tag import Tag
from tracim_backend.models.tag import TagOnContent
from tracim_backend.models.tracim_session import TracimSession
from tracim_backend.models.user_custom_properties import UserCustomProperties


class DatabaseCrudHookCaller:
    """Listen for sqlalchemy session events and call the pluggy hooks
    as defined in hookspec.py."""

    def __init__(self, session: TracimSession, plugin_manager: PluginManager) -> None:
        assert session.context
        self._plugin_manager = plugin_manager
        # calling hooks after flush allows to get database-generated
        # values (primary key...) in the objects
        event.listen(session, "after_flush", self._call_hooks)

    def _call_hooks(
        self,
        session: TracimSession,
        flush_context: UOWTransaction,
    ) -> None:
        assert session.context, "session must have a context"
        assert session.context.dbsession
        roles = []
        for obj in session.new:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_created(user=obj, context=session.context)
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_created(
                    workspace=obj, context=session.context
                )
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_created(
                    role=obj, context=session.context
                )
                roles.append(obj)
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_created(content=obj, context=session.context)
            elif isinstance(obj, WorkspaceSubscription):
                self._plugin_manager.hook.on_workspace_subscription_created(
                    subscription=obj, context=session.context
                )
            elif isinstance(obj, Reaction):
                self._plugin_manager.hook.on_reaction_created(reaction=obj, context=session.context)
            elif isinstance(obj, TagOnContent):
                self._plugin_manager.hook.on_content_tag_created(
                    content_tag=obj, context=session.context
                )
            elif isinstance(obj, Tag):
                self._plugin_manager.hook.on_tag_created(tag=obj, context=session.context)
            elif isinstance(obj, UserCall):
                self._plugin_manager.hook.on_user_call_created(
                    user_call=obj, context=session.context
                )
        if roles:
            self._plugin_manager.hook.on_user_role_in_workspaces_created(
                roles=roles, context=session.context
            )

        for obj in session.dirty:
            # NOTE S.G 2020-05-08: session.dirty contains objects that do not have to be
            # updated, don't consider them
            # see https://docs.sqlalchemy.org/en/13/orm/session_api.html#sqlalchemy.orm.session.Session.dirty
            if not session.is_modified(obj):
                continue
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_modified(user=obj, context=session.context)
            elif isinstance(obj, UserCustomProperties):
                self._plugin_manager.hook.on_user_modified(user=obj.user, context=session.context)
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_modified(
                    workspace=obj, context=session.context
                )
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_modified(
                    role=obj, context=session.context
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_modified(content=obj, context=session.context)
            elif isinstance(obj, WorkspaceSubscription):
                self._plugin_manager.hook.on_workspace_subscription_modified(
                    subscription=obj, context=session.context
                )
            elif isinstance(obj, Reaction):
                self._plugin_manager.hook.on_reaction_modified(
                    reaction=obj, context=session.context
                )
            elif isinstance(obj, TagOnContent):
                self._plugin_manager.hook.on_content_tag_modified(
                    content_tag=obj, context=session.context
                )
            elif isinstance(obj, Tag):
                self._plugin_manager.hook.on_tag_modified(tag=obj, context=session.context)
            elif isinstance(obj, UserCall):
                self._plugin_manager.hook.on_user_call_modified(
                    user_call=obj, context=session.context
                )

        for obj in session.deleted:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_deleted(user=obj, context=session.context)
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_deleted(
                    workspace=obj, context=session.context
                )
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_deleted(
                    role=obj, context=session.context
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_deleted(content=obj, context=session.context)
            elif isinstance(obj, WorkspaceSubscription):
                self._plugin_manager.hook.on_workspace_subscription_deleted(
                    subscription=obj, context=session.context
                )
            elif isinstance(obj, Reaction):
                self._plugin_manager.hook.on_reaction_deleted(reaction=obj, context=session.context)
            elif isinstance(obj, TagOnContent):
                self._plugin_manager.hook.on_content_tag_deleted(
                    content_tag=obj, context=session.context
                )
            elif isinstance(obj, Tag):
                self._plugin_manager.hook.on_tag_deleted(tag=obj, context=session.context)
            elif isinstance(obj, UserCall):
                self._plugin_manager.hook.on_user_call_deleted(
                    user_call=obj, context=session.context
                )
