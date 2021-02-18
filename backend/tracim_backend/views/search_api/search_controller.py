from http import HTTPStatus

from hapic import HapicData
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.exceptions import AdvancedSearchNotEnabled
from tracim_backend.extensions import hapic
from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESSearchApi
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.search_factory import ELASTICSEARCH__SEARCH_ENGINE_SLUG
from tracim_backend.lib.search.simple_search.simple_search_api import SimpleSearchApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.search_api.schemas import AdvancedContentSearchQuery
from tracim_backend.views.search_api.schemas import AdvancedContentSearchQuerySchema
from tracim_backend.views.search_api.schemas import AdvancedContentSearchResultSchema
from tracim_backend.views.search_api.schemas import ContentSearchQuery
from tracim_backend.views.search_api.schemas import ContentSearchQuerySchema
from tracim_backend.views.search_api.schemas import ContentSearchResultSchema

SWAGGER_TAG__SEARCH_SECTION = "Search"


class SearchController(Controller):
    @classmethod
    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(ContentSearchQuerySchema())
    @hapic.output_body(ContentSearchResultSchema())
    def search_content(
        self, context, request: TracimRequest, hapic_data: HapicData = None
    ) -> ContentSearchResponse:
        app_config = request.registry.settings["CFG"]  # type: CFG
        search = SimpleSearchApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        ).search_content(ContentSearchQuery(**hapic_data.query))
        return search

    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(AdvancedContentSearchQuerySchema())
    @hapic.output_body(AdvancedContentSearchResultSchema())
    @hapic.handle_exception(AdvancedSearchNotEnabled, HTTPStatus.BAD_REQUEST)
    def advanced_search_content(
        self, context, request: TracimRequest, hapic_data: HapicData = None
    ) -> ContentSearchResponse:
        app_config = request.registry.settings["CFG"]  # type: CFG
        if app_config.SEARCH__ENGINE != ELASTICSEARCH__SEARCH_ENGINE_SLUG:
            raise AdvancedSearchNotEnabled("Advanced search is not enabled on this instance")

        search = ESSearchApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        ).search_content(AdvancedContentSearchQuery(**hapic_data.query))
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
