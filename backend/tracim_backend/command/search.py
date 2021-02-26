import argparse

from pyramid.scripting import AppEnvironment

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.command import AppContextCommand
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESContentIndexer
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESUserIndexer
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESWorkspaceIndexer
from tracim_backend.lib.search.search_factory import SearchFactory
from tracim_backend.lib.utils.request import TracimContext


class IndexingCommand(AppContextCommand):
    def _index_one_content(self, content_id: int, context: TracimContext) -> None:
        print('Indexing content "{}"'.format(content_id))
        if context.app_config.SEARCH__ENGINE == "simple":
            return
        content_api = ContentApi(
            current_user=None, session=context.dbsession, config=context.app_config
        )
        content = content_api.get_one(
            content_id=content_id, content_type=content_type_list.Any_SLUG
        )
        ESContentIndexer().index_contents([content], context)
        print('content "{}" correctly indexed.'.format(content_id))

    def _index_all_contents(self, context: TracimContext) -> None:
        print("Indexing all contents")
        if context.app_config.SEARCH__ENGINE == "simple":
            return
        content_api = ContentApi(
            current_user=None, session=context.dbsession, config=context.app_config
        )
        contents = content_api.get_all()
        ESContentIndexer().index_contents(contents, context)
        print("{} content(s) were indexed".format(len(contents)))

    def _index_all_users(self, context: TracimContext) -> None:
        print("Indexing all users")
        if context.app_config.SEARCH__ENGINE == "simple":
            return
        user_api = UserApi(current_user=None, session=context.dbsession, config=context.app_config)
        indexed_user_count = 0
        for user in user_api.get_all():
            ESUserIndexer().index_user(user, context)
            indexed_user_count += 1
        print("{} user(s) were indexed".format(indexed_user_count))

    def _index_all_workspaces(self, context: TracimContext) -> None:
        print("Indexing all workspaces")
        if context.app_config.SEARCH__ENGINE == "simple":
            return
        indexed_workspace_count = 0
        workspace_api = WorkspaceApi(
            current_user=None, session=context.dbsession, config=context.app_config
        )
        for workspace in workspace_api.get_all():
            ESWorkspaceIndexer().index_workspace(workspace, context)
            indexed_workspace_count += 1
        print("{} space(s) were indexed".format(indexed_workspace_count))

    def _index_all(self, context: TracimContext) -> None:
        self._index_all_users(context)
        self._index_all_workspaces(context)
        self._index_all_contents(context)


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
            self._index_all(app_context["request"])


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
            "if not provided will index all existing contents/users/spaces",
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
            self._index_one_content(parsed_args.content_id, app_context["request"])
        else:
            self._index_all(app_context["request"])


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
        self.search_api.delete_indices()
        print("Indices were deleted")
