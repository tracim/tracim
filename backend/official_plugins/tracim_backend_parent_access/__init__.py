from pluggy import PluginManager

from tracim_backend.exceptions import RoleAlreadyExistError
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.tracim_session import TracimSession


class ParentAccessPlugin:
    """Needs a registration using 'register_tracim_plugin' function."""

    def _is_role_in_session(self, session: TracimSession, user_id: int, workspace_id: int) -> bool:
        for obj in session.new:
            if (
                isinstance(obj, UserRoleInWorkspace)
                and obj.user.user_id == user_id
                and obj.workspace.workspace_id == workspace_id
            ):
                return True
        return False

    @hookimpl
    def on_user_role_in_workspace_created(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        """
        Set user as members of all parent of this workspace with default workspace default_user_role
        """
        user = role.user
        current_workspace = role.workspace.parent
        rapi = RoleApi(session=context.dbsession, config=context.app_config, current_user=None)
        while current_workspace:
            if not current_workspace.is_deleted and not self._is_role_in_session(
                context.dbsession, user.user_id, current_workspace.workspace_id
            ):
                try:
                    rapi.create_one(
                        user=user,
                        workspace=current_workspace,
                        role_level=current_workspace.default_user_role.level,
                        with_notif=True,
                        flush=False,
                    )
                except RoleAlreadyExistError:
                    break
            current_workspace = current_workspace.parent


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(ParentAccessPlugin())
