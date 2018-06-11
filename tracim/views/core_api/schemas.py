# coding=utf-8
import marshmallow
from marshmallow import post_load
from marshmallow.validate import OneOf

from tracim.models.auth import Profile
from tracim.models.context_models import LoginCredentials
from tracim.models.data import UserRoleInWorkspace


class ProfileSchema(marshmallow.Schema):
    slug = marshmallow.fields.String(
        attribute='name',
        validate=OneOf(Profile._NAME),
        example='managers',
    )

    class Meta:
        description = 'User Profile, give user right on whole Tracim instance.'


class UserSchema(marshmallow.Schema):

    user_id = marshmallow.fields.Int(dump_only=True, example=3)
    email = marshmallow.fields.Email(
        required=True,
        example='suri.cate@algoo.fr'
    )
    display_name = marshmallow.fields.String(
        example='Suri Cate',
    )
    created = marshmallow.fields.DateTime(
        format='iso8601',
        description='User account creation date (iso8601 format).',
    )
    is_active = marshmallow.fields.Bool(
        example=True,
         # TODO - G.M - Explains this value.
    )
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = marshmallow.fields.String(
        example="Paris/Europe",
    )
    # TODO - G.M - 17-04-2018 - check this, relative url allowed ?
    caldav_url = marshmallow.fields.Url(
        allow_none=True,
        relative=True,
        attribute='calendar_url',
        example="/api/v2/calendar/user/3.ics/",
        description="The url for calendar CalDAV direct access",
    )
    avatar_url = marshmallow.fields.Url(
        allow_none=True,
        example="/api/v2/assets/avatars/suri-cate.jpg",
        description="avatar_url is the url to the image file. "
                    "If no avatar, then set it to null "
                    "(and frontend will interpret this with a default avatar)",
    )
    profile = marshmallow.fields.Nested(
        ProfileSchema,
        many=False,
    )

    class Meta:
        description = 'User account of Tracim'


class UserIdPathSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(example=3)


class WorkspaceIdPathSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4)


class BasicAuthSchema(marshmallow.Schema):

    email = marshmallow.fields.Email(
        example='suri.cate@algoo.fr',
        required=True
    )
    password = marshmallow.fields.String(
        example='8QLa$<w',
        required=True,
        load_only=True,
    )

    class Meta:
        description = 'Entry for HTTP Basic Auth'

    @post_load
    def make_login(self, data):
        return LoginCredentials(**data)


class LoginOutputHeaders(marshmallow.Schema):
    expire_after = marshmallow.fields.String()


class NoContentSchema(marshmallow.Schema):

    class Meta:
        description = 'Empty Schema'
    pass


class WorkspaceMenuEntrySchema(marshmallow.Schema):
    slug = marshmallow.fields.String(example='markdown-pages')
    label = marshmallow.fields.String(example='Markdown Documents')
    route = marshmallow.fields.String(
        example='/#/workspace/{workspace_id}/contents/?type=mardown-page',
        description='the route is the frontend route. '
                    'It may include workspace_id '
                    'which must be replaced on backend size '
                    '(the route must be ready-to-use)'
    )
    icon = marshmallow.fields.String(
        example='file-text-o',
        description='CSS class of the icon. Example: file-o for using Fontawesome file-text-o icon',  # nopep8
    )
    hexcolor = marshmallow.fields.String(
        example='#F0F9DC',
        description='Hexadecimal color of the entry.'
    )

    class Meta:
        description = 'Entry element of a workspace menu'


class WorkspaceDigestSchema(marshmallow.Schema):
    id = marshmallow.fields.Int(example=4)
    label = marshmallow.fields.String(example='Intranet')
    sidebar_entries = marshmallow.fields.Nested(
        WorkspaceMenuEntrySchema,
        many=True,
    )

    class Meta:
        description = 'Digest of workspace informations'


class WorkspaceSchema(WorkspaceDigestSchema):
    slug = marshmallow.fields.String(example='intranet')
    description = marshmallow.fields.String(example='All intranet data.')

    class Meta:
        description = 'Full workspace informations'


class WorkspaceMemberSchema(marshmallow.Schema):
    role_slug = marshmallow.fields.String(
        example='contributor',
        validate=OneOf(UserRoleInWorkspace.get_all_role_slug())
    )
    user_id = marshmallow.fields.Int(example=3)
    workspace_id = marshmallow.fields.Int(example=4)
    user = marshmallow.fields.Nested(
        UserSchema(only=('display_name', 'avatar_url'))
    )

    class Meta:
        description = 'Workspace Member information'


class ApplicationConfigSchema(marshmallow.Schema):
    pass
    #  TODO - G.M - 24-05-2018 - Set this


class ApplicationSchema(marshmallow.Schema):
    label = marshmallow.fields.String(example='Calendar')
    slug = marshmallow.fields.String(example='calendar')
    icon = marshmallow.fields.String(
        example='file-o',
        description='CSS class of the icon. Example: file-o for using Fontawesome file-o icon',  # nopep8
    )
    hexcolor = marshmallow.fields.String(
        example='#FF0000',
        description='HTML encoded color associated to the application. Example:#FF0000 for red'  # nopep8
    )
    is_active = marshmallow.fields.Boolean(
        example=True,
        description='if true, the application is in use in the context',
    )
    config = marshmallow.fields.Nested(
        ApplicationConfigSchema,
    )

    class Meta:
        description = 'Tracim Application informations'
