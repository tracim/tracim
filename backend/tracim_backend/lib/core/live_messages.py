import json
import typing

from gripcontrol import GripPubControl

from tracim_backend import CFG


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

    def publish_live_message(self, channel_name: str, message: typing.Dict[str, typing.Any]):
        # todo - G.M - 07-05-2020 - Message should be a specific type, not dict
        message = json.dumps(message)
        self.grip_pub_control.publish_http_stream(
            channel_name, str(ServerSideEvent(data=[message], event="TLM"))
        )
