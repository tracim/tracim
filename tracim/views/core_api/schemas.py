# coding=utf-8
import marshmallow
from marshmallow import post_load
from marshmallow.validate import OneOf

from tracim.models.context_models import LoginCredentials
from tracim.models.data import UserRoleInWorkspace


class ProfileSchema(marshmallow.Schema):
    id = marshmallow.fields.Int(dump_only=True)
    slug = marshmallow.fields.String(attribute='name')


class UserSchema(marshmallow.Schema):

    user_id = marshmallow.fields.Int(dump_only=True)
    email = marshmallow.fields.Email(required=True)
    display_name = marshmallow.fields.String()
    created = marshmallow.fields.DateTime(format='iso8601')
    is_active = marshmallow.fields.Bool()
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = marshmallow.fields.String()
    # TODO - G.M - 17-04-2018 - check this, relative url allowed ?
    caldav_url = marshmallow.fields.Url(
        allow_none=True,
        relative=True,
        attribute='calendar_url'
    )
    avatar_url = marshmallow.fields.Url(allow_none=True)
    profile = marshmallow.fields.Nested(
        ProfileSchema,
        many=False,
    )


class UserIdPathSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int()


class WorkspaceIdPathSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int()


class BasicAuthSchema(marshmallow.Schema):

    email = marshmallow.fields.Email(required=True)
    password = marshmallow.fields.String(required=True, load_only=True)

    @post_load
    def make_login(self, data):
        return LoginCredentials(**data)


class LoginOutputHeaders(marshmallow.Schema):
    expire_after = marshmallow.fields.String()


class NoContentSchema(marshmallow.Schema):
    pass


class WorkspaceMenuEntrySchema(marshmallow.Schema):
    slug = marshmallow.fields.String()
    label = marshmallow.fields.String()
    route = marshmallow.fields.String()
    hexcolor = marshmallow.fields.String()
    icon = marshmallow.fields.String()


class WorkspaceSchema(marshmallow.Schema):
    id = marshmallow.fields.Int()
    slug = marshmallow.fields.String()
    label = marshmallow.fields.String()
    description = marshmallow.fields.String()
    sidebar_entries = marshmallow.fields.Nested(
        WorkspaceMenuEntrySchema,
        many=True,
    )


class WorkspaceDigestSchema(marshmallow.Schema):
    id = marshmallow.fields.Int()
    label = marshmallow.fields.String()
    sidebar_entries = marshmallow.fields.Nested(
        WorkspaceMenuEntrySchema,
        many=True,
    )


class WorkspaceMemberSchema(marshmallow.Schema):
    role_id = marshmallow.fields.Int(validate=OneOf(UserRoleInWorkspace.get_all_role_values()))  # nopep8
    role_slug = marshmallow.fields.String(validate=OneOf(UserRoleInWorkspace.get_all_role_slug()))  # nopep8
    user_id = marshmallow.fields.Int()
    workspace_id = marshmallow.fields.Int()
    user = marshmallow.fields.Nested(
        UserSchema(only=('display_name', 'avatar_url'))
    )


class ApplicationConfigSchema(marshmallow.Schema):
    pass
    #  TODO - G.M - 24-05-2018 - Set this


class ApplicationSchema(marshmallow.Schema):
    label = marshmallow.fields.String()
    slug = marshmallow.fields.String()
    icon = marshmallow.fields.String()
    hexcolor = marshmallow.fields.String()
    is_active = marshmallow.fields.Boolean()
    config = marshmallow.fields.Nested(
        ApplicationConfigSchema,
    )
