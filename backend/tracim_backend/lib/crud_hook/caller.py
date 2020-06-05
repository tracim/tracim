from pluggy import PluginManager
from sqlalchemy import event
from sqlalchemy.orm.session import UOWTransaction

from tracim_backend.exceptions import NotAuthenticated
from tracim_backend.models.auth import User
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.tracim_session import TracimSession


class DatabaseCrudHookCaller:
    """Listen for sqlalchemy session events and call the pluggy hooks
    as defined in hookspec.py."""

    def __init__(self, session: TracimSession, plugin_manager: PluginManager) -> None:
        assert session.context
        self._plugin_manager = plugin_manager
        event.listen(session, "after_flush", self._call_hooks)

    def _call_hooks(self, session: TracimSession, flush_context: UOWTransaction,) -> None:
        try:
            current_user = session.context.current_user
        except NotAuthenticated:
            current_user = None
        for obj in session.new:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_created(
                    user=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_created(
                    workspace=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_created(
                    role=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_created(
                    content=obj, db_session=session, current_user=current_user
                )

        for obj in session.dirty:
            # NOTE S.G 2020-05-08: session.dirty contains objects that do not have to be
            # updated, don't consider them
            # see https://docs.sqlalchemy.org/en/13/orm/session_api.html#sqlalchemy.orm.session.Session.dirty
            if not session.is_modified(obj):
                continue
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_modified(
                    user=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_modified(
                    workspace=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_modified(
                    role=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_modified(
                    content=obj, db_session=session, current_user=current_user
                )

        for obj in session.deleted:
            if isinstance(obj, User):
                self._plugin_manager.hook.on_user_deleted(
                    user=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, Workspace):
                self._plugin_manager.hook.on_workspace_deleted(
                    workspace=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, UserRoleInWorkspace):
                self._plugin_manager.hook.on_user_role_in_workspace_deleted(
                    role=obj, db_session=session, current_user=current_user
                )
            elif isinstance(obj, Content):
                self._plugin_manager.hook.on_content_deleted(
                    content=obj, db_session=session, current_user=current_user
                )
