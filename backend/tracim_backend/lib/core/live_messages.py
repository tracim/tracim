import json
import threading
import typing

from gripcontrol import GripPubControl

# TODO - G.M - 2020-05-14 - Use default event "message" for TLM to be usable with
# "onmessage" EventSource Object in javascript.
from tracim_backend import CFG
from tracim_backend.models.event import Message
from tracim_backend.views.core_api.schemas import LiveMessageSchema

TLM_EVENT_NAME = "message"
STREAM_OPENED_EVENT_NAME = "stream-opened"
KEEPALIVE_EVENT_NAME = "keepalive"


class JsonServerSideEvent(object):
    """Create a ServerSideEvent with single-line json as data"""

    def __init__(
        self, data: typing.Dict[str, typing.Any], event: typing.Optional[str] = None,
    ):
        self.data = data
        self.event = event

    def __str__(self):
        buffer = ""
        if self.event:
            buffer += "event: {}\n".format(self.event)
        buffer += "data: {}\n".format(json.dumps(self.data))
        buffer += "\n"
        return buffer


# NOTE S.G - 2020-08-06 - only one GripPubControl instance as it is:
#  - thread safe
#  - meant to be used like this (see example usage in fanout django_grip python package).
# TODO S.G. - 2020-08-07 - find a way to avoid those global variables
_grip_pub_control = None  # type: typing.Optional[GripPubControl]
_pub_control_create_lock = threading.Lock()


class LiveMessagesLib(object):
    """Publish messages using pushpin."""

    def __init__(self, config: CFG,) -> None:
        self._blocking_publish = config.LIVE_MESSAGES__BLOCKING_PUBLISH
        global _pub_control_create_lock
        global _grip_pub_control
        with _pub_control_create_lock:
            if not _grip_pub_control:
                # NOTE S.G. - 2020-08-06 - publishing using ZMQ to avoid
                # low maximum (1Mbytes) message size when using HTTP transport (#3415)
                _grip_pub_control = GripPubControl(
                    {"control_zmq_uri": config.LIVE_MESSAGES__CONTROL_ZMQ_URI}
                )

    def publish_message_to_user(self, message: Message):
        channel_name = "user_{}".format(message.receiver_id)
        message_schema = LiveMessageSchema()
        self.publish_dict(channel_name, message_as_dict=message_schema.as_dict(message))

    def publish_dict(self, channel_name: str, message_as_dict: typing.Dict[str, typing.Any]):
        global _grip_pub_control
        assert _grip_pub_control
        _grip_pub_control.publish_http_stream(
            channel_name,
            str(JsonServerSideEvent(data=message_as_dict, event=TLM_EVENT_NAME)),
            blocking=self._blocking_publish,
        )
