import argparse
from pyramid.scripting import AppEnvironment

from tracim_backend.command import AppContextCommand
from tracim_backend.lib.core.content import ContentApi


class ShowContentTreeCommand(AppContextCommand):
    def get_description(self) -> str:
        return """show content Tree"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-z",
            "--content_id",
            help="content_id",
            dest="content_id",
            required=True,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]

        capi = ContentApi(
            config=self._app_config,
            session=self._session,
            current_user=None,
            show_deleted=True,
        )
        content = capi.get_one(content_id=parsed_args.content_id)
        content_in_context = capi.get_content_in_context(content)
        print("~~~~~~~~~~~")
        print("General informations")
        print("~~~~~~~~~~~")
        print("content_id:\t{}".format(content_in_context.content_id))
        print("workspace_id:\t{}".format(content_in_context.workspace_id))
        print("namespace:\t{}".format(content_in_context.content_namespace))
        print("last_revision_id:\t{}".format(content_in_context.current_revision_id))
        print("parent_id:\t{}".format(content_in_context.parent_id))
        print("deleted?:\t {}".format(content_in_context.is_deleted))
        print("creation date: \t {}".format(content_in_context.created))
        print("last update: \t {}".format(content_in_context.updated))
        print("type: \t {}".format(content_in_context.content_type))
        print("~~~~~~~~~~~")
        print("Revisions")
        print("~~~~~~~~~~~")
        print("revision_number\trevision_id\trevision_creation_date\trevision_type")
        revisions = [
            capi.get_revision_in_context(revision, number)
            for revision, number in content.get_revisions()
        ]
        for revision in revisions:
            print(
                "({})\t{}\t{}\t{}".format(
                    revision.version_number,
                    revision.revision_id,
                    revision.created,
                    revision.revision_type,
                )
            )
        print("~~~~~~~~~~~")
        print("Direct children content")
        print("~~~~~~~~~~~")
        print("content_id\ttype\tlast_revision_id\tcreation_date\t deleted?")
        for child in content.children:
            print(
                "\t{}\t{}\t{}\t{}\t{}".format(
                    child.content_id, child.type, child.revision_id, child.created, child.is_deleted
                )
            )
        print("~~~~~~~~~~~")
