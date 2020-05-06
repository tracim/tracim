from pluggy import PluginManager
from sqlalchemy import event

from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.tracim_session import TracimSession


class DatabaseCrudHookCaller:
    """Listen for sqlalchemy session events and call the pluggy hooks
    as defined in hookspec.py."""

    def __init__(self, plugin_manager: PluginManager) -> None:
        self._plugin_manager = plugin_manager
        event.listen(TracimSession, "after_flush", self._call_hooks)

    def _call_hooks(self, session: TracimSession, flush_context) -> None:
        for obj in session.new:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_created(user=obj, db_session=session)
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_created(workspace=obj, db_session=session)
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_created(
                    role=obj, db_session=session
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_created(content=obj, db_session=session)

        for obj in session.dirty:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_modified(user=obj, db_session=session)
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_modified(workspace=obj, db_session=session)
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_modified(
                    role=obj, db_session=session
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_modified(content=obj, db_session=session)

        for obj in session.deleted:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_deleted(user=obj, db_session=session)
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_deleted(workspace=obj, db_session=session)
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_deleted(
                    role=obj, db_session=session
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_deleted(content=obj, db_session=session)
