import typing

from hapic import HapicData
from pyramid.config import Configurator
from pyramid.response import Response

from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.event import EventApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models.event import Message
from tracim_backend.models.event import ReadStatus
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import GetLiveMessageQuerySchema
from tracim_backend.views.core_api.schemas import LiveMessageSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema

SWAGGER_TAG_EVENT_ENDPOINTS = "Event & Messages"


class MessageController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG_EVENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    def open_message_stream(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        Open the message stream for the currently connected user.
        Stream is done through server-side events.
        """
        user_id = hapic_data.path.user_id

        headers = [
            # Here we ask push pin to keep the connection open
            ("Grip-Hold", "stream"),
            # and register this connection on the user's channel
            # multiple channels subscription is possible
            ("Grip-Channel", f"user_{user_id}"),
            # content type for SSE
            ("Content-Type", "text/event-stream"),
            # do not cache the events
            ("Cache-Control", "no-cache"),
        ]
        return Response(headerlist=headers)

    @hapic.with_api_doc(tags=[SWAGGER_TAG_EVENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(GetLiveMessageQuerySchema())
    @hapic.output_body(LiveMessageSchema(many=True))
    def get_user_messages(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> typing.List[Message]:
        """
        Returns user messages matching the given query
        """
        user_id = hapic_data.path["user_id"]
        app_config = request.registry.settings["CFG"]  # type: CFG
        event_api = EventApi(request.current_user, request.dbsession, app_config)
        return event_api.get_messages_for_user(user_id, ReadStatus(hapic_data.query["read_status"]))

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """
        configurator.add_route(
            "live_messages", "/users/{user_id}/live_messages", request_method="GET"
        )
        configurator.add_view(self.open_message_stream, route_name="live_messages")
        configurator.add_route("messages", "/users/{user_id}/messages", request_method="GET")
        configurator.add_view(self.get_user_messages, route_name="messages")
