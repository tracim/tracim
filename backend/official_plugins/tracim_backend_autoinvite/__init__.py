from pluggy import PluginManager

from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceAccessType


class HookImpl:
    """Needs a registration using 'register_tracim_plugin' function."""

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        """
        Set all new user as members on all OPEN workspace as workspace default_user_role
        """
        open_workspaces = WorkspaceApi(
            session=context.dbsession,
            config=context.app_config,
            current_user=None,
            access_types_filter=[WorkspaceAccessType.OPEN],
        ).get_all()
        rapi = RoleApi(session=context.dbsession, config=context.app_config, current_user=None)
        for workspace in open_workspaces:
            rapi.create_one(
                user=user,
                workspace=workspace,
                role_level=workspace.default_user_role.level,
                with_notif=True,
                flush=False,
            )

    @hookimpl
    def on_workspace_created(self, workspace: Workspace, context: TracimContext) -> None:
        """
        Set all user as members of new open workspace as default workspace default_user_role
        """
        if workspace.access_type == WorkspaceAccessType.OPEN:
            all_users = UserApi(
                session=context.dbsession, config=context.app_config, current_user=None
            ).get_all()
            rapi = RoleApi(session=context.dbsession, config=context.app_config, current_user=None)
            for user in all_users:
                if user != workspace.owner:
                    rapi.create_one(
                        user=user,
                        workspace=workspace,
                        role_level=workspace.default_user_role.level,
                        with_notif=True,
                        flush=False,
                    )


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(HookImpl())
