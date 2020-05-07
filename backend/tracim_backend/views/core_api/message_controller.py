from pyramid.config import Configurator
from pyramid.response import Response

from tracim_backend.extensions import hapic
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import UserIdPathSchema

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus  # noqa: F401

SWAGGER_TAG_EVENT_ENDPOINTS = "Event & Messages"


class MessageController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG_EVENT_ENDPOINTS])
    @hapic.input_path(UserIdPathSchema)
    @check_right(has_personal_access)
    def open_message_stream(self, context, request: TracimRequest, hapic_data) -> Response:
        """
        Open the message stream for the currently connected user
        """
        user_id = hapic_data.path.user_id

        headers = [
            # Here we ask push pin to keep the connection open
            ("Grip-Hold", "stream"),
            # and register this connection on the given channel
            # multiple channels subscription is possible
            ("Grip-Channel", f"user_{user_id}"),
            # content type for SSE
            ("Content-Type", "text/event-stream"),
            # do not cache the events
            ("Cache-Control", "no-cache"),
        ]
        return Response(headerlist=headers)

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # account workspace
        configurator.add_route(
            "live_messages", "/users/{user_id}/live_messages", request_method="GET"
        )
        configurator.add_view(self.open_message_stream, route_name="live_messages")
