from hapic import HapicData
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.search_factory import ELASTICSEARCH__SEARCH_ENGINE_SLUG
from tracim_backend.lib.search.search_factory import SearchFactory
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.search_api.schema import AdvancedSearchFilterQuerySchema
from tracim_backend.views.search_api.schema import ContentSearchResultSchema
from tracim_backend.views.search_api.schema import ContentSearchResultWithFacetsSchema
from tracim_backend.views.search_api.schema import SearchFilterQuerySchema

SWAGGER_TAG__SEARCH_SECTION = "Search"


class SearchController(Controller):
    @classmethod
    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(SearchFilterQuerySchema())
    @hapic.output_body(ContentSearchResultSchema())
    def search_content(
        self, context, request: TracimRequest, hapic_data: HapicData = None
    ) -> ContentSearchResponse:
        app_config = request.registry.settings["CFG"]  # type: CFG
        search_api = SearchFactory.get_search_lib(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        search = search_api.search_content(SearchFilterQuery(**hapic_data))
        return search

    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(AdvancedSearchFilterQuerySchema())
    @hapic.output_body(ContentSearchResultWithFacetsSchema())
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
        search = search_api.search_content(SearchFilterQuery(**hapic_data),)
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

        app_config = request.registry.settings["CFG"]  # type: CFG

        configurator.add_route(
            "advanced_search_content", "/advanced_search/content", request_method="GET"
        )  # noqa: W605
        configurator.add_view(self.advanced_search_content, route_name="advanced_search_content")
