import enum
import json
import threading
import typing

from gripcontrol import GripPubControl
from gripcontrol import HttpStreamFormat

# TODO - G.M - 2020-05-14 - Use default event "message" for TLM to be usable with
# "onmessage" EventSource Object in javascript.
from tracim_backend.config import CFG
from tracim_backend.models.event import Message
from tracim_backend.views.core_api.schemas import LiveMessageSchema


class ServerSideEventType(str, enum.Enum):
    TLM = "message"
    STREAM_OPEN = "stream-open"
    KEEPALIVE = "keep-alive"
    STREAM_ERROR = "stream-error"


class JsonServerSideEvent:
    """Create a ServerSideEvent with single-line json as data"""

    def __init__(
        self,
        event_type: ServerSideEventType,
        data: typing.Optional[typing.Dict[str, typing.Any]] = None,
        comment: str = "",
    ) -> None:
        self.event_type = event_type
        self.data = data
        self.comment = comment

    def __str__(self) -> str:
        comment_string = ":{}\n".format(self.comment) if self.comment else ""
        data_string = json.dumps(self.data) if self.data is not None else ""
        return "{}event: {}\ndata: {}\n\n".format(
            comment_string, self.event_type.value, data_string
        )


# NOTE S.G - 2020-08-06 - only one GripPubControl instance as it is:
#  - thread safe
#  - meant to be used like this (see example usage in fanout django_grip python package).
# TODO S.G. - 2020-08-07 - find a way to avoid those global variables
_grip_pub_control = None  # type: typing.Optional[GripPubControl]
_pub_control_create_lock = threading.Lock()


class LiveMessagesLib(object):
    """Publish messages using pushpin."""

    # RJ - 2020-08-22 - NOTE
    # This avoids reinstanciating LiveMessageSchema each time we need to serialize a live message
    _message_schema = LiveMessageSchema()

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

    @classmethod
    def message_as_dict(cls, message: Message):
        return cls._message_schema.dump(message).data

    @classmethod
    def get_server_side_event_string(
        cls, event_type: ServerSideEventType, data: typing.Any, comment: str = ""
    ) -> str:
        return str(JsonServerSideEvent(event_type=event_type, data=data, comment=comment))

    @staticmethod
    def user_grip_channel(user_id: int) -> str:
        return "user_{}".format(user_id)

    def publish_message_to_user(self, message: Message):
        channel_name = self.user_grip_channel(message.receiver_id)
        self.publish_dict(channel_name, message_as_dict=LiveMessagesLib.message_as_dict(message))

    def close_channel_connections(self, channel: str) -> None:
        _grip_pub_control.publish_http_stream(
            channel, HttpStreamFormat(close=True), blocking=self._blocking_publish
        )

    def publish_dict(self, channel_name: str, message_as_dict: typing.Dict[str, typing.Any]):
        global _grip_pub_control
        assert _grip_pub_control
        _grip_pub_control.publish_http_stream(
            channel_name,
            str(JsonServerSideEvent(data=message_as_dict, event_type=ServerSideEventType.TLM)),
            blocking=self._blocking_publish,
        )
