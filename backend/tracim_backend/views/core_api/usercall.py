import typing

from pyramid.config import Configurator

from tracim_backend.extensions import hapic
from tracim_backend.lib.core.usercall import UserCallLib
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.call import UserCall
from tracim_backend.models.context_models import ListItemsObject
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import CreateUserCallSchema
from tracim_backend.views.core_api.schemas import GetUserCallsQuerySchema
from tracim_backend.views.core_api.schemas import UpdateUserCallStateSchema
from tracim_backend.views.core_api.schemas import UserCallSchema
from tracim_backend.views.core_api.schemas import UserCallsSchema
from tracim_backend.views.core_api.schemas import UserIdCallIdPathSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__USER_CALL_SECTION = "User Calls"
SWAGGER_TAG__USER_CALL_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_CALL_SECTION
)


class UserCallController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CALL_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(CreateUserCallSchema())
    @hapic.output_body(UserCallSchema())
    def create_call(self, context, request: TracimRequest, hapic_data=None) -> UserCall:
        """
        Create a new call for the user given in the body.
        """
        user_call_lib = UserCallLib(
            session=request.dbsession, config=request.app_config, current_user=request.current_user
        )
        return user_call_lib.create(hapic_data.body["callee_id"])

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CALL_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdCallIdPathSchema())
    @hapic.input_body(UpdateUserCallStateSchema())
    @hapic.output_body(UserCallSchema())
    def update_call_state(self, context, request: TracimRequest, hapic_data=None) -> UserCall:
        """
        Update the state of a call.
        """
        user_call_lib = UserCallLib(
            session=request.dbsession, config=request.app_config, current_user=request.current_user
        )
        return user_call_lib.update_call_state(hapic_data.path["call_id"], hapic_data.body["state"])

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CALL_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(GetUserCallsQuerySchema())
    @hapic.output_body(UserCallsSchema())
    def get_incoming_calls(
        self, context, request: TracimRequest, hapic_data=None
    ) -> ListItemsObject[UserCall]:
        """
        Get the list of incoming calls.
        """
        user_call_lib = UserCallLib(
            session=request.dbsession, config=request.app_config, current_user=request.current_user
        )
        calls = user_call_lib.get_all(
            user_id=request.candidate_user.user_id, state=hapic_data.query["state"], caller=False
        )
        return ListItemsObject(calls)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CALL_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(GetUserCallsQuerySchema())
    @hapic.output_body(UserCallsSchema())
    def get_outgoing_calls(
        self, context, request: TracimRequest, hapic_data=None
    ) -> ListItemsObject[UserCall]:
        """
        Get the list of outgoing calls.
        """
        user_call_lib = UserCallLib(
            session=request.dbsession, config=request.app_config, current_user=request.current_user
        )
        calls = user_call_lib.get_all(
            user_id=request.candidate_user.user_id, state=hapic_data.query["state"], caller=True
        )
        return ListItemsObject(calls)

    def bind(self, configurator: Configurator) -> None:
        configurator.add_route(
            "create_call", "/users/{user_id}/outgoing_calls", request_method="POST",
        )
        configurator.add_view(self.create_call, route_name="create_call")

        configurator.add_route(
            "update_outgoing_call_state",
            "/users/{user_id}/outgoing_calls/{call_id}/state",
            request_method="PUT",
        )
        configurator.add_view(self.update_call_state, route_name="update_outgoing_call_state")

        configurator.add_route(
            "update_incoming_call_state",
            "/users/{user_id}/incoming_calls/{call_id}/state",
            request_method="PUT",
        )
        configurator.add_view(self.update_call_state, route_name="update_incoming_call_state")

        configurator.add_route(
            "get_incoming_calls", "/users/{user_id}/incoming_calls", request_method="GET",
        )
        configurator.add_view(self.get_incoming_calls, route_name="get_incoming_calls")

        configurator.add_route(
            "get_outgoing_calls", "/users/{user_id}/outgoing_calls", request_method="GET",
        )
        configurator.add_view(self.get_outgoing_calls, route_name="get_outgoing_calls")
