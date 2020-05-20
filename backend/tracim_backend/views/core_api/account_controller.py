from hapic import HapicData
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPTemporaryRedirect

from tracim_backend.extensions import hapic
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import PathSuffixSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__NOTIFICATION_SECTION

SWAGGER_TAG__ACCOUNT_ENDPOINTS = "Account"
SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__ACCOUNT_ENDPOINTS, SWAGGER_TAG__CONTENT_ENDPOINTS
)
SWAGGER_TAG__ACCOUNT_NOTIFICATION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__ACCOUNT_ENDPOINTS, SWAGGER_TAG__NOTIFICATION_SECTION
)


class AccountController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.input_path(PathSuffixSchema())
    def account_route_get(self, context, request: TracimRequest, hapic_data: HapicData):
        """
        Convenient route allowing to use PUT /api/v2/users/{user_id}/* endpoint with authenticated user
        without giving directly user id.
        This route generate a HTTP 307 with the right url
        """
        return HTTPTemporaryRedirect(
            request.url.replace("/me", "/{user_id}".format(user_id=request.current_user.user_id), 1)
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.input_path(PathSuffixSchema())
    def account_route_put(self, context, request: TracimRequest, hapic_data: HapicData):
        """
        Convenient route allowing to use PUT /api/v2/users/{user_id}/* endpoint with authenticated user
        without giving directly user id.
        This route generate a HTTP 307 with the right url
        """
        return HTTPTemporaryRedirect(
            request.url.replace("/me", "/{user_id}".format(user_id=request.current_user.user_id), 1)
        )

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # account workspace
        configurator.add_route(
            "account_routes_get", "/users/me{path_suffix:.*}", request_method="GET"
        )
        configurator.add_view(self.account_route_get, route_name="account_routes_get")

        configurator.add_route(
            "account_routes_put", "/users/me{path_suffix:.*}", request_method="PUT"
        )
        configurator.add_view(self.account_route_put, route_name="account_routes_put")
