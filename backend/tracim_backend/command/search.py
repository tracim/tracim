import argparse

from pyramid.scripting import AppEnvironment

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.command import AppContextCommand
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.search.search_factory import SearchFactory
from tracim_backend.models.context_models import ContentInContext


class IndexingCommand(AppContextCommand):
    def _index_one_content(self, content_id: int) -> None:
        print('Indexing content "{}"'.format(content_id))
        content_api = ContentApi(current_user=None, session=self._session, config=self._app_config)
        content = content_api.get_one(
            content_id=content_id, content_type=content_type_list.Any_SLUG
        )
        content_in_context = ContentInContext(
            content, dbsession=self._session, config=self._app_config
        )
        self.search_api.index_content(content_in_context)
        print('content "{}" correctly indexed.'.format(content_id))

    def _index_all_contents(self) -> None:
        print("Indexing all content")
        index_contents_result = self.search_api.index_all_content()
        nb_index_errors = index_contents_result.get_nb_index_errors()
        nb_contents_to_index = index_contents_result.get_nb_contents_to_index()
        if nb_index_errors == 0:
            print("{} content(s) were indexed".format(nb_contents_to_index))
        else:
            print(
                "Warning! Failed to index {}/{} content(s)".format(
                    nb_index_errors, nb_contents_to_index
                )
            )


class SearchIndexInitCommand(IndexingCommand):
    def get_description(self) -> str:
        return "create index of search engine"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--index-all",
            help="do index content after creating index template",
            dest="index_all",
            required=False,
            action="store_true",
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
        self.search_api.create_indices()
        print("Index templates were created")
        if parsed_args.index_all:
            self._index_all_contents()


class SearchIndexUpgradeCommand(AppContextCommand):
    def get_description(self) -> str:
        return "upgrade index: create a copy of current index with updated index template (useful for migration), set index alias to this new index (experimental)"

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        # TODO - G.M - 05-04-2018 -Refactor this in order
        # to not setup object var outside of __init__ .
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        self.search_api = SearchFactory.get_search_lib(
            current_user=None, session=self._session, config=self._app_config
        )
        self.search_api.migrate_indices()


class SearchIndexIndexCommand(IndexingCommand):
    def get_description(self) -> str:
        return "index content(s) into search engine"

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--content_id",
            help="select a specific content_id to index, "
            "if not provided will index all content of tracim",
            dest="content_id",
            required=False,
            default=None,
            type=int,
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
                content_id=parsed_args.content_id, content_type=content_type_list.Any_SLUG
            )
            content_in_context = ContentInContext(
                content, dbsession=self._session, config=self._app_config
            )
            self.search_api.index_content(content_in_context)
        else:
            self._index_all_contents()


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
        print("Indices were deleted")
