import argparse

from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import ForceArgumentNeeded
from tracim_backend.exceptions import TracimException
from tracim_backend.lib.core.workspace import WorkspaceApi


class MoveSpaceCommand(AppContextCommand):
    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-w",
            "--workspace_id",
            help="Id of the workspace to move",
            dest="workspace_id",
            required=True,
            type=int,
        )
        parser.add_argument(
            "-p",
            "--new-parent",
            help="Id of the new parent workspace",
            dest="parent_workspace_id",
            required=False,
            default=None,
            type=int,
        )
        parser.add_argument(
            "--force",
            help="force move of workspace",
            dest="force",
            required=False,
            action="store_true",
            default=False,
        )
        return parser

    def get_description(self) -> str:
        return """Move a Workspace from a parent to another"""

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self._workspace_api = WorkspaceApi(
            current_user=None, session=self._session, config=self._app_config
        )
        if not parsed_args.parent_workspace_id and not parsed_args.force:
            force_arg_required = (
                "Warning! You should use --force if you really want to move a space to root."
            )
            print(force_arg_required)
            print("Workspace {} can not be moved to root.".format(parsed_args.workspace_id,))
            raise ForceArgumentNeeded(force_arg_required)
        try:
            workspace = self._workspace_api.get_one(parsed_args.workspace_id)
            parent_workspace = None
            if parsed_args.parent_workspace_id:
                parent_workspace = self._workspace_api.get_one(parsed_args.parent_workspace_id)

            self._workspace_api.move_workspace(workspace, parent_workspace)
        except TracimException as exc:
            self._session.rollback()
            print("Error: " + str(exc))
            print(
                "Workspace {} can not be moved to {}.".format(
                    parsed_args.workspace_id, parsed_args.parent_workspace_id or "root"
                )
            )
            raise exc
        print(
            "Workspace {} moved to {}.".format(
                parsed_args.workspace_id, parsed_args.parent_workspace_id
            )
        )
