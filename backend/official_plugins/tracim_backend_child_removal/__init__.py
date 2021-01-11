from pluggy import PluginManager

from tracim_backend.exceptions import UserRoleNotFound
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import UserRoleInWorkspace


class ChildRemovalPlugin:
    """
    This plugin ensures that a user who is removed from a space is also removed from
    every child/descendant space he is member of.

    Needs a registration using 'register_tracim_plugin' function.
    """

    @hookimpl
    def on_user_role_in_workspace_deleted(
        self, role: UserRoleInWorkspace, context: TracimContext
    ) -> None:
        """
        Remove the user from all child spaces
        """
        user = role.user
        parent_workspace = role.workspace
        rapi = RoleApi(session=context.dbsession, config=context.app_config, current_user=None)
        for workspace in parent_workspace.recursive_children:
            try:
                rapi.delete_one(
                    user_id=user.user_id, workspace_id=workspace.workspace_id, flush=False,
                )
            except UserRoleNotFound:
                pass


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(ChildRemovalPlugin())
