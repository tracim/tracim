from pluggy import PluginManager

from tracim_backend.exceptions import RoleAlreadyExistError
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import UserRoleInWorkspace


class HookImpl:
    """Needs a registration using 'register_tracim_plugin' function."""

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
            try:
                rapi.create_one(
                    user=user,
                    workspace=current_workspace,
                    role_level=current_workspace.default_user_role.level,
                    with_notif=True,
                    flush=False,
                )
            except RoleAlreadyExistError:
                pass
            current_workspace = current_workspace.parent


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(HookImpl())
