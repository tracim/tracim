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
    def __init__(self, wopi_lool_timestamp: datetime = None):
        self.wopi_lool_timestamp = wopi_lool_timestamp


class WOPITokenQuerySchema(marshmallow.Schema):
    access_token = marshmallow.fields.String(
        required=True, description="Access token which uniquely identifies a user"
    )


class WOPICheckFileInfoSchema(marshmallow.Schema):
    BaseFileName = marshmallow.fields.String(
        required=True,
        description="Filename as shown in collabora Online",
        attribute="base_file_name",
    )
    Size = marshmallow.fields.Int(
        required=True, description="File length, in bytes", attribute="size"
    )
    OwnerId = marshmallow.fields.Int(
        description="Owner's database identifier", attribute="owner_id"
    )
    UserId = marshmallow.fields.Int(description="User's database identifier", attribute="user_id")
    UserFriendlyName = marshmallow.fields.String(
        description="User's display name", attribute="user_friendly_name"
    )
    Version = marshmallow.fields.String(
        description="Version of the file (the revision_id)", attribute="version"
    )
    UserCanWrite = marshmallow.fields.Boolean(
        description="Whether the user can (or can't) edit the file in libreoffice online",
        attribute="user_can_write",
    )
    UserCanNotWriteRelative = marshmallow.fields.Boolean(
        default=True,
        description="Whether it's possible to save the document as a new name ("
        "Save As functionality)",
        attribute="user_can_not_write_relative",
    )
    LastModifiedTime = marshmallow.fields.DateTime(
        description="Last time the file was modified", attribute="last_modified_time"
    )


class WopiPutResponseSchema(marshmallow.Schema):
    LastModifiedTime = marshmallow.fields.DateTime(
        description="Last time the file was modified", attribute="last_modified_time"
    )
