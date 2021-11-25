import argparse

from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import TracimException
from tracim_backend.lib.core.workspace import WorkspaceApi


class MoveSpaceCommand(AppContextCommand):
    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-s",
            "--space-id",
            help="Id of the space id to move",
            dest="space_id",
            required=True,
            type=int,
        )
        parser.add_argument(
            "-p",
            "--new-parent",
            help="Id of the new parent of workspace id to move",
            dest="parent_space_id",
            required=False,
            default=None,
            type=int,
        )
        return parser

    def get_description(self) -> str:
        return """Move a space from a parent to another (use 0 to move to root)"""

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self._workspace_api = WorkspaceApi(
            current_user=None, session=self._session, config=self._app_config
        )
        try:
            workspace = self._workspace_api.get_one(parsed_args.space_id)
            if parsed_args.parent_space_id == 0:
                parent_workspace = None
            else:
                parent_workspace = self._workspace_api.get_one(parsed_args.parent_space_id)
            self._workspace_api.move_workspace(workspace, parent_workspace)
        except TracimException as exc:
            self._session.rollback()
            print("Error: " + str(exc))
            print(
                "Space {} can not be moved to {}.".format(
                    parsed_args.space_id, parsed_args.parent_space_id or "root"
                )
            )
            if parsed_args.debug:
                raise exc
            else:
                exit(1)

        if parsed_args.parent_space_id == 0:
            print("Space {}({}) moved to root.".format(parsed_args.space_id, workspace.label,))
        else:
            print(
                "Space {}({}) moved to {}({}).".format(
                    parsed_args.space_id,
                    workspace.label,
                    parsed_args.parent_space_id,
                    parent_workspace.label,
                )
            )
