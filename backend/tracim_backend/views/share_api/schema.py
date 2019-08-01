import typing

import marshmallow
from marshmallow import post_load
from marshmallow.validate import OneOf

from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import share_email_validator
from tracim_backend.app_models.validator import share_password_validator
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.models.content_share import ContentShareType
from tracim_backend.views.core_api.schemas import ContentIdPathSchema
from tracim_backend.views.core_api.schemas import StrippedString
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema


class TracimSharePasswordHeader(object):
    def __init__(self, tracim_share_password: typing.Optional[str] = None):
        self.tracim_share_password = tracim_share_password


class TracimSharePasswordHeaderSchema(marshmallow.Schema):
    tracim_share_password = marshmallow.fields.String(
        required=False,
        allow_none=True,
        example="8QLa$<w",
        validate=share_password_validator,
        load_from="Tracim-Share-Password",
        dump_to="Tracim-Share-Password",
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return TracimSharePasswordHeader(**data)


class ShareListQuery(object):
    def __init__(self, show_disabled: int = 0) -> None:
        self.show_disabled = bool(show_disabled)


class ShareListQuerySchema(marshmallow.Schema):
    show_disabled = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show disabled share." " Default is 0 - hide disabled share",
        validate=bool_as_int_validator,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ShareListQuery(**data)


class ShareIdPath(object):
    def __init__(self, workspace_id: int, content_id: int, share_id: int):
        self.workspace_id = workspace_id
        self.content_id = content_id
        self.share_id = share_id


class ShareIdPathSchema(WorkspaceIdPathSchema, ContentIdPathSchema):
    share_id = marshmallow.fields.Int(
        example=6,
        required=True,
        description="id of a valid share id",
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ShareIdPath(**data)


class ShareTokenPath(object):
    def __init__(self, share_token: str):
        self.share_token = share_token


class ShareTokenPathSchema(marshmallow.Schema):
    share_token = marshmallow.fields.String(required=True, description="valid share token")

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ShareTokenPath(**data)


class ShareTokenWithFilenamePath(object):
    def __init__(self, share_token: str, filename: str):
        self.share_token = share_token
        self.filename = filename


class ShareCreationBody(object):
    def __init__(self, emails: typing.List[str], password: str):
        self.emails = emails
        self.password = password


class ShareCreationBodySchema(marshmallow.Schema):
    emails = marshmallow.fields.List(marshmallow.fields.Email(validate=share_email_validator))
    password = marshmallow.fields.String(
        example="8QLa$<w", required=True, validate=share_password_validator
    )

    @post_load
    def make_body_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ShareCreationBody(**data)


class ShareTokenWithFilenamePathSchema(marshmallow.Schema):
    share_token = marshmallow.fields.String(required=True, description="valid share token")
    filename = marshmallow.fields.String()

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ShareTokenWithFilenamePath(**data)


class ContentShareInfoSchema(marshmallow.Schema):
    author = marshmallow.fields.Nested(UserDigestSchema)

    content_file_extension = StrippedString(example=".txt")
    content_filename = StrippedString(example="nameofthefile.txt")
    content_label = StrippedString(example="nameofthefile")
    content_size = marshmallow.fields.Int(
        description="file size in byte, return null value if unaivalable",
        example=1024,
        allow_none=True,
    )
    share_id = marshmallow.fields.Int(
        example=4,
        required=True,
        description="id of this share",
        validate=strictly_positive_int_validator,
    )
    content_id = marshmallow.fields.Integer(
        example=6,
        validate=strictly_positive_int_validator,
        description="content id of the content shared.",
    )
    author_id = marshmallow.fields.Integer(
        example=3, validate=strictly_positive_int_validator, required=True
    )


class ContentShareSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        example="hello@tracim.fr", required=True, validate=share_email_validator
    )
    has_password = marshmallow.fields.Boolean(required=True)
    share_group_id = marshmallow.fields.String(required=True)
    share_id = marshmallow.fields.Int(
        example=4,
        required=True,
        description="id of this share",
        validate=strictly_positive_int_validator,
    )
    content_id = marshmallow.fields.Integer(
        example=6,
        validate=strictly_positive_int_validator,
        description="content id of the content shared.",
    )
    created = marshmallow.fields.DateTime(format=DATETIME_FORMAT, description="Share creation date")
    disabled = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Share disabled date", allow_none=True
    )
    is_disabled = marshmallow.fields.Boolean(required=True, description="is this share disabled ?")
    url = marshmallow.fields.URL(example="/ui/guest-download/<token>")
    direct_url = marshmallow.fields.URL(
        allow_none=True, example="/api/v2/public/guest-download/<token>/<filename>"
    )
    author_id = marshmallow.fields.Integer(
        example=3, validate=strictly_positive_int_validator, required=True
    )
    author = marshmallow.fields.Nested(UserDigestSchema)
    type = marshmallow.fields.String(
        validate=OneOf([share_type.value for share_type in ContentShareType]),
        example=ContentShareType.EMAIL.value,
        description="type of sharing",
    )
