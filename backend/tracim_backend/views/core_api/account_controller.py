from hapic import HapicData
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPTemporaryRedirect
from webob.multidict import GetDict

from tracim_backend import BASE_API_V2
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


def redirect_account_route(
    user_id: int, path_suffix: str, get_params: GetDict
) -> HTTPTemporaryRedirect:
    param_string_list = []
    for name, value in get_params.items():
        param_string_list.append("{}={}".format(name, value))
    get_params_string = ""
    if param_string_list:
        get_params_string += "?"
        get_params_string += "&".join(param_string_list)
    raise HTTPTemporaryRedirect(
        "{base_url}users/{user_id}{path_suffix}{get_params_string}".format(
            base_url=BASE_API_V2,
            user_id=user_id,
            path_suffix=path_suffix,
            get_params_string=get_params_string,
        )
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
        return redirect_account_route(
            user_id=request.current_user.user_id,
            path_suffix=request.matchdict.get("path_suffix"),
            get_params=request.GET,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.input_path(PathSuffixSchema())
    def account_route_put(self, context, request: TracimRequest, hapic_data: HapicData):
        """
        Convenient route allowing to use PUT /api/v2/users/{user_id}/* endpoint with authenticated user
        without giving directly user id.
        This route generate a HTTP 307 with the right url
        """
        return redirect_account_route(
            user_id=request.current_user.user_id,
            path_suffix=request.matchdict.get("path_suffix"),
            get_params=request.GET,
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
