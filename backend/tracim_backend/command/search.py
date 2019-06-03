import argparse

from pyramid.scripting import AppEnvironment

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.command import AppContextCommand
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.search.search_factory import SearchFactory
from tracim_backend.models.context_models import ContentInContext


class SearchIndexInitCommand(AppContextCommand):
    def get_description(self) -> str:
        return "init index of search engine"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--empty",
            help="do not insered content after creating index template",
            dest="empty",
            required=False,
            default=None,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self.search_api = SearchFactory.get_search_lib(
            current_user=None, session=self._session, config=self._app_config
        )
        self.search_api.create_index()
        print("Index template was created")
        if not parsed_args.empty:
            print("Indexing all content")
            self.search_api.index_all_content()
            print("All content where indexed")


class SearchIndexUpdateCommand(AppContextCommand):
    def get_description(self) -> str:
        return "update index of search engine"

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self.search_api = SearchFactory.get_search_lib(
            current_user=None, session=self._session, config=self._app_config
        )
        self.search_api.migrate_index()


class SearchIndexAddCommand(AppContextCommand):
    def get_description(self) -> str:
        return "Add content into search engine"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--content_id",
            help="select a specific content_id to index, "
            "if not provided will index all content of tracim",
            dest="content_id",
            required=False,
            default=None,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self.search_api = SearchFactory.get_search_lib(
            current_user=None, session=self._session, config=self._app_config
        )
        if parsed_args.content_id:
            content_api = ContentApi(
                current_user=None, session=self._session, config=self._app_config
            )
            content = content_api.get_one(
                content_id=int(parsed_args.content_id), content_type=content_type_list.Any_SLUG
            )
            content_in_context = ContentInContext(
                content, dbsession=self._session, config=self._app_config
            )
            self.search_api.index_content(content_in_context)
        else:
            print("Indexing all content")
            self.search_api.index_all_content()
            print("All content where indexed")


class SearchIndexDeleteCommand(AppContextCommand):
    def get_description(self) -> str:
        return "Delete all index, alias and template of tracim document"

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self.search_api = SearchFactory.get_search_lib(
            current_user=None, session=self._session, config=self._app_config
        )
        print("delete index")
        self.search_api.delete_index()
        print("Index where deleted")
