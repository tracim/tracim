from hapic import HapicData
from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.search.search import SearchApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.search_api.schema import SearchFilterQuerySchema

SWAGGER_TAG__SEARCH_SECTION = "Search"


class SearchController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__SEARCH_SECTION])
    @check_right(is_user)
    @hapic.input_query(SearchFilterQuerySchema())
    def search_content(self, context, request: TracimRequest, hapic_data: HapicData = None):
        app_config = request.registry.settings["CFG"]  # type: CFG
        search_api = SearchApi(
            current_user=request.current_user, session=request.dbsession, config=app_config
        )
        search = search_api.search_content(hapic_data.query.search_string)
        # TODO - G.M - 2019-05-14 - Result should be converted to something else for frontend
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
        configurator.add_view(self.search_content, route_name="search_content", renderer="json")
