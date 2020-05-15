import json
import typing

from gripcontrol import GripPubControl

# TODO - G.M - 2020-05-14 - Use default event "message" for TLM to be usable with
# "onmessage" EventSource Object in javascript.
from tracim_backend import CFG
from tracim_backend.models.event import Message
from tracim_backend.views.core_api.schemas import LiveMessageSchema

TLM_EVENT_NAME = "message"


class ServerSideEvent(object):
    """Create a ServerSideEvent String Like"""

    def __init__(
        self, data: typing.List[str], event: typing.Optional[str] = None,
    ):
        self.data = data
        self.event = event
        self._buffer = ""
        self._convert_to_sse_string()

    def _convert_to_sse_string(self):
        if self.event:
            self._buffer += "event: {}\n".format(self.event)
        for row in self.data:
            self._buffer += "data: {}\n".format(row)

        self._buffer += "\n"

    def __str__(self):
        return self._buffer


class LiveMessagesLib(object):
    def __init__(self, config: CFG,) -> None:
        self.control_uri = config.LIVE_MESSAGES__CONTROL_URI
        self.grip_pub_control = GripPubControl({"control_uri": self.control_uri})

    def publish_message_to_user(self, message: Message):
        channel_name = "user_{}".format(message.receiver_id)
        message_schema = LiveMessageSchema()
        message_as_dict = message_schema.dump(message).data
        self.publish_dict(channel_name, message_as_dict=message_as_dict)

    def publish_dict(self, channel_name: str, message_as_dict: typing.Dict[str, typing.Any]):
        # todo - G.M - 07-05-2020 - Message should be a specific type, not dict
        message_as_dict = json.dumps(message_as_dict)
        self.grip_pub_control.publish_http_stream(
            channel_name, str(ServerSideEvent(data=[message_as_dict], event=TLM_EVENT_NAME))
        )
