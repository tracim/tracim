import typing

import marshmallow
from marshmallow import post_load
from marshmallow.validate import OneOf

from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.applications.upload_permissions.models import UploadPermissionType
from tracim_backend.applications.upload_permissions.validators import (
    upload_permission_email_validator,
)
from tracim_backend.applications.upload_permissions.validators import (
    upload_permission_password_validator,
)
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.views.core_api.schemas import StrippedString
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema


class UploadDataForm(object):
    """
    Simple parent_id object
    """

    def __init__(self, message: str = "", name: str = "", password: str = "") -> None:
        self.message = message
        self.name = name
        self.password = password


class UploadDataFormSchema(marshmallow.Schema):
    message = StrippedString()
    name = StrippedString()
    password = marshmallow.fields.String(
        example="8QLa$<w",
        required=False,
        validate=upload_permission_password_validator,
        allow_none=True,
    )

    @post_load
    def file_creation_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UploadDataForm(**data)


class UploadPermissionListQuery(object):
    def __init__(self, show_disabled: int = 0) -> None:
        self.show_disabled = bool(show_disabled)


class UploadPermissionListQuerySchema(marshmallow.Schema):
    show_disabled = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show disabled share." " Default is 0 - hide disabled share",
        validate=bool_as_int_validator,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UploadPermissionListQuery(**data)


class UploadPermissionToken(object):
    def __init__(self, upload_permission_token: str):
        self.upload_permission_token = upload_permission_token


class UploadPermissionTokenPath(marshmallow.Schema):
    upload_permission_token = marshmallow.fields.String(
        required=True, description="valid share token"
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UploadPermissionToken(**data)


class UploadPermissionIdPath(object):
    def __init__(self, workspace_id: int, upload_permission_id: int):
        self.workspace_id = workspace_id
        self.upload_permission_id = upload_permission_id


class UploadPermissionIdPathSchema(WorkspaceIdPathSchema):
    upload_permission_id = marshmallow.fields.Int(
        example=6,
        required=True,
        description="id of a valid share id",
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UploadPermissionIdPath(**data)


class UploadPermissionCreationBody(object):
    def __init__(self, emails: typing.List[str], password: str):
        self.emails = emails
        self.password = password


class UploadPermissionCreationBodySchema(marshmallow.Schema):
    emails = marshmallow.fields.List(
        marshmallow.fields.Email(validate=upload_permission_email_validator)
    )
    password = marshmallow.fields.String(
        example="8QLa$<w", required=True, validate=upload_permission_password_validator
    )

    @post_load
    def make_body_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UploadPermissionCreationBody(**data)


class UploadPermissionSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        example="hello@tracim.fr", required=True, validate=upload_permission_email_validator
    )
    has_password = marshmallow.fields.Boolean(required=True)
    upload_permission_group_uuid = marshmallow.fields.String(required=True)
    upload_permission_id = marshmallow.fields.Int(
        example=4,
        required=True,
        description="id of this upload permission",
        validate=strictly_positive_int_validator,
    )
    workspace_id = marshmallow.fields.Integer(
        example=6,
        validate=strictly_positive_int_validator,
        description="workspace id of workspace on which upload is permitted",
    )
    token = marshmallow.fields.String(required=True)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Upload permission creation date"
    )
    disabled = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Upload permission disabled date", allow_none=True
    )
    is_disabled = marshmallow.fields.Boolean(
        required=True, description="is this upload permission disabled ?"
    )
    url = marshmallow.fields.URL(example="/ui/guest-upload/<token>")
    author_id = marshmallow.fields.Integer(
        example=3, validate=strictly_positive_int_validator, required=True
    )
    author = marshmallow.fields.Nested(UserDigestSchema)
    type = marshmallow.fields.String(
        validate=OneOf([share_type.value for share_type in UploadPermissionType]),
        example=UploadPermissionType.EMAIL.value,
        description="type of sharing",
    )
