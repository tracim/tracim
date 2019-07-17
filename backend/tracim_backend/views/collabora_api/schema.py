from datetime import datetime
import typing

import marshmallow
from marshmallow import post_load


class WopiPutHeadersSchema(marshmallow.Schema):
    wopi_lool_timestamp = marshmallow.fields.DateTime(
        required=False, load_from="X-LOOL-WOPI-Timestamp", dump_to="X-LOOL-WOPI-Timestamp"
    )

    @post_load
    def make_wopi_put_headers(self, data: typing.Dict[str, typing.Any]) -> object:
        return WopiPutHeaders(**data)


class WopiPutHeaders(object):
    def __init__(self, wopi_lool_timestamp: datetime):
        self.wopi_lool_timestamp = wopi_lool_timestamp
