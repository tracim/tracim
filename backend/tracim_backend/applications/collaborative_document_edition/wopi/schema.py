from datetime import datetime
import marshmallow
from marshmallow import post_load
import typing


class WopiPutHeadersSchema(marshmallow.Schema):
    wopi_lool_timestamp = marshmallow.fields.DateTime(
        required=False,
        load_from="X-LOOL-WOPI-Timestamp",
        dump_to="X-LOOL-WOPI-Timestamp",
    )

    @post_load
    def make_wopi_put_headers(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WopiPutHeaders(**data)


class WopiPutHeaders(object):
    def __init__(self, wopi_lool_timestamp: datetime = None) -> None:
        self.wopi_lool_timestamp = wopi_lool_timestamp


class WOPITokenQuerySchema(marshmallow.Schema):
    access_token = marshmallow.fields.String(
        required=True, metadata={"description": "Access token which uniquely identifies a user"}
    )


class WOPICheckFileInfoSchema(marshmallow.Schema):
    BaseFileName = marshmallow.fields.String(
        required=True,
        metadata={"description": "Filename as shown in collabora Online"},
        attribute="base_file_name",
    )
    Size = marshmallow.fields.Int(
        required=True, metadata={"description": "File length, in bytes"}, attribute="size"
    )
    OwnerId = marshmallow.fields.Int(
        metadata={"description": "Owner's database identifier"}, attribute="owner_id"
    )
    UserId = marshmallow.fields.Int(
        metadata={"description": "User's database identifier"}, attribute="user_id"
    )
    UserFriendlyName = marshmallow.fields.String(
        metadata={"description": "User's display name"}, attribute="user_friendly_name"
    )
    Version = marshmallow.fields.String(
        metadata={"description": "Version of the file (the revision_id)"}, attribute="version"
    )
    UserCanWrite = marshmallow.fields.Boolean(
        metadata={
            "description": "Whether the user can (or can't) edit the file in libreoffice online"
        },
        attribute="user_can_write",
    )
    UserCanNotWriteRelative = marshmallow.fields.Boolean(
        dump_default=True,
        metadata={
            "description": "Whether it's possible to save the document as a new name ("
            "Save As functionality)"
        },
        attribute="user_can_not_write_relative",
    )
    LastModifiedTime = marshmallow.fields.DateTime(
        metadata={"description": "Last time the file was modified"}, attribute="last_modified_time"
    )


class WopiPutResponseSchema(marshmallow.Schema):
    LastModifiedTime = marshmallow.fields.DateTime(
        metadata={"description": "Last time the file was modified"}, attribute="last_modified_time"
    )
