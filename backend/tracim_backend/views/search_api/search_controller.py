from hapic import HapicData
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.search.models import ContentSearchResponse
from tracim_backend.lib.search.search_factory import SearchFactory
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.search_api.schema import ContentSearchResultSchema
from tracim_backend.views.search_api.schema import SearchFilterQuerySchema

SWAGGER_TAG__SEARCH_SECTION = "Search"


class SearchController(Controller):
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
        search = search_api.search_content(
            search_string=hapic_data.query.search_string,
            size=hapic_data.query.size,
            page_nb=hapic_data.query.page_nb,
            show_deleted=hapic_data.query.show_deleted,
            show_archived=hapic_data.query.show_archived,
            show_active=hapic_data.query.show_active,
            content_types=hapic_data.query.content_types,
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
