from http import HTTPStatus

from hapic import HapicData
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.exceptions import AdvancedSearchNotEnabled
from tracim_backend.extensions import hapic
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import (
    AdvancedContentSearchParameters,
)
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.search_factory import ELASTICSEARCH__SEARCH_ENGINE_SLUG
from tracim_backend.lib.search.search_factory import SearchFactory
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.search_api.schemas import AdvancedContentSearchFilterQuerySchema
from tracim_backend.views.search_api.schemas import AdvancedContentSearchResultSchema
from tracim_backend.views.search_api.schemas import ContentSearchFilterQuery
from tracim_backend.views.search_api.schemas import ContentSearchFilterQuerySchema
from tracim_backend.views.search_api.schemas import ContentSearchResultSchema

SWAGGER_TAG__SEARCH_SECTION = "Search"


class SearchController(Controller):
    @classmethod
    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(ContentSearchFilterQuerySchema())
    @hapic.output_body(ContentSearchResultSchema())
    def search_content(
        self, context, request: TracimRequest, hapic_data: HapicData = None
    ) -> ContentSearchResponse:
        app_config = request.registry.settings["CFG"]  # type: CFG
        search_api = SearchFactory.get_search_lib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        search = search_api.search_content(ContentSearchFilterQuery(**hapic_data.query.__dict__))
        return search

    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(AdvancedContentSearchFilterQuerySchema())
    @hapic.output_body(AdvancedContentSearchResultSchema())
    @hapic.handle_exception(AdvancedSearchNotEnabled, HTTPStatus.BAD_REQUEST)
    def advanced_search_content(
        self, context, request: TracimRequest, hapic_data: HapicData = None
    ) -> ContentSearchResponse:
        app_config = request.registry.settings["CFG"]  # type: CFG
        if app_config.SEARCH__ENGINE != ELASTICSEARCH__SEARCH_ENGINE_SLUG:
            raise AdvancedSearchNotEnabled("Advanced search is not enabled on this instance")

        search_api = SearchFactory.get_elastic_search_api(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        search = search_api.search_content(
            ContentSearchFilterQuery(
                search_string=hapic_data.query.get("search_string"),
                size=hapic_data.query.get("size"),
                page_nb=hapic_data.query.get("page_nb"),
                content_types=hapic_data.query.get("content_types"),
                show_archived=hapic_data.query.get("show_archived"),
                show_deleted=hapic_data.query.get("show_deleted"),
                show_active=hapic_data.query.get("show_active"),
            ),
            AdvancedContentSearchParameters(
                workspace_names=hapic_data.query.get("workspace_names"),
                author__public_names=hapic_data.query.get("author__public_names"),
                last_modifier__public_names=hapic_data.query.get("last_modifier__public_names"),
                file_extensions=hapic_data.query.get("file_extensions"),
                search_fields=hapic_data.query.get("search_fields"),
                statuses=hapic_data.query.get("statuses"),
                created_from=hapic_data.query.get("created_from"),
                created_to=hapic_data.query.get("created_to"),
                updated_from=hapic_data.query.get("updated_from"),
                updated_to=hapic_data.query.get("updated_to"),
            ),
        )
        return search

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # INFO - G.M - 2019-04-01 - user search
        configurator.add_route(
            "search_content", "/search/content", request_method="GET"
        )  # noqa: W605
        configurator.add_view(self.search_content, route_name="search_content")

        configurator.add_route(
            "advanced_search_content", "/advanced_search/content", request_method="GET"
        )  # noqa: W605
        configurator.add_view(self.advanced_search_content, route_name="advanced_search_content")
