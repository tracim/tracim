# coding=utf-8
import marshmallow
from marshmallow import post_load
from marshmallow.validate import OneOf

from tracim.models.auth import Profile
from tracim.models.contents import CONTENT_DEFAULT_TYPE
from tracim.models.contents import CONTENT_DEFAULT_STATUS
from tracim.models.contents import GlobalStatus
from tracim.models.contents import open_status
from tracim.models.context_models import ContentCreation
from tracim.models.context_models import MoveParams
from tracim.models.context_models import WorkspaceAndContentPath
from tracim.models.context_models import ContentFilter
from tracim.models.context_models import LoginCredentials
from tracim.models.data import UserRoleInWorkspace


class UserSchema(marshmallow.Schema):

    user_id = marshmallow.fields.Int(dump_only=True, example=3)
    email = marshmallow.fields.Email(
        required=True,
        example='suri.cate@algoo.fr'
    )
    public_name = marshmallow.fields.String(
        example='Suri Cate',
    )
    created = marshmallow.fields.DateTime(
        format='%Y-%m-%dT%H:%M:%SZ',
        description='User account creation date',
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
    profile = marshmallow.fields.String(
        attribute='profile',
        validate=OneOf(Profile._NAME),
        example='managers',
    )

    class Meta:
        description = 'User account of Tracim'


# Path Schemas


class UserIdPathSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(example=3, required=True)


class WorkspaceIdPathSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, required=True)


class ContentIdPathSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, required=True)


class WorkspaceAndContentIdPathSchema(WorkspaceIdPathSchema, ContentIdPathSchema):
    @post_load
    def make_path_object(self, data):
        return WorkspaceAndContentPath(**data)


class FilterContentQuerySchema(marshmallow.Schema):
    parent_id = workspace_id = marshmallow.fields.Int(
        example=2,
        default=None,
        description='allow to filter items in a folder.'
                    ' If not set, then return all contents.'
                    ' If set to 0, then return root contents.'
                    ' If set to another value, return all contents'
                    ' directly included in the folder parent_id'
    )
    show_archived = marshmallow.fields.Int(
        example=0,
        default=0,
        description='if set to 1, then show archived contents.'
                    ' Default is 0 - hide archived content'
    )
    show_deleted = marshmallow.fields.Int(
        example=0,
        default=0,
        description='if set to 1, then show deleted contents.'
                    ' Default is 0 - hide deleted content'
    )
    show_active = marshmallow.fields.Int(
        example=1,
        default=1,
        description='f set to 1, then show active contents. '
                    'Default is 1 - show active content.'
                    ' Note: active content are content '
                    'that is neither archived nor deleted. '
                    'The reason for this parameter to exist is for example '
                    'to allow to show only archived documents'
    )
    @post_load
    def make_content_filter(self, data):
        return ContentFilter(**data)
###


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
    fa_icon = marshmallow.fields.String(
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
    workspace_id = marshmallow.fields.Int(example=4)
    slug = marshmallow.fields.String(example='intranet')
    label = marshmallow.fields.String(example='Intranet')
    sidebar_entries = marshmallow.fields.Nested(
        WorkspaceMenuEntrySchema,
        many=True,
    )

    class Meta:
        description = 'Digest of workspace informations'


class WorkspaceSchema(WorkspaceDigestSchema):
    description = marshmallow.fields.String(example='All intranet data.')

    class Meta:
        description = 'Full workspace informations'


class WorkspaceMemberSchema(marshmallow.Schema):
    role = marshmallow.fields.String(
        example='contributor',
        validate=OneOf(UserRoleInWorkspace.get_all_role_slug())
    )
    user_id = marshmallow.fields.Int(example=3)
    workspace_id = marshmallow.fields.Int(example=4)
    user = marshmallow.fields.Nested(
        UserSchema(only=('public_name', 'avatar_url'))
    )

    class Meta:
        description = 'Workspace Member information'


class ApplicationConfigSchema(marshmallow.Schema):
    pass
    #  TODO - G.M - 24-05-2018 - Set this


class ApplicationSchema(marshmallow.Schema):
    label = marshmallow.fields.String(example='Calendar')
    slug = marshmallow.fields.String(example='calendar')
    fa_icon = marshmallow.fields.String(
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


class StatusSchema(marshmallow.Schema):
    slug = marshmallow.fields.String(
        example='open',
        description='the slug represents the type of status. '
                    'Statuses are open, closed-validated, closed-invalidated, closed-deprecated'  # nopep8
    )
    global_status = marshmallow.fields.String(
        example='open',
        description='global_status: open, closed',
        validate=OneOf([status.value for status in GlobalStatus]),
    )
    label = marshmallow.fields.String(example='Open')
    fa_icon = marshmallow.fields.String(example='fa-check')
    hexcolor = marshmallow.fields.String(example='#0000FF')


class ContentTypeSchema(marshmallow.Schema):
    slug = marshmallow.fields.String(
        example='pagehtml',
        validate=OneOf([content.slug for content in CONTENT_DEFAULT_TYPE]),
    )
    fa_icon = marshmallow.fields.String(
        example='fa-file-text-o',
        description='CSS class of the icon. Example: file-o for using Fontawesome file-o icon',  # nopep8
    )
    hexcolor = marshmallow.fields.String(
        example="#FF0000",
        description='HTML encoded color associated to the application. Example:#FF0000 for red'  # nopep8
    )
    label = marshmallow.fields.String(
        example='Text Documents'
    )
    creation_label = marshmallow.fields.String(
        example='Write a document'
    )
    available_statuses = marshmallow.fields.Nested(
        StatusSchema,
        many=True
    )


class ContentMoveSchema(marshmallow.Schema):
    # TODO - G.M - 30-05-2018 - Read and apply this note
    # Note:
    # if the new workspace is different, then the backend
    # must check if the user is allowed to move to this workspace
    # (the user must be content manager of both workspaces)
    new_parent_id = marshmallow.fields.Int(
        example=42,
        description='id of the new parent content id.'
    )
    new_workspace_id = marshmallow.fields.Int(
        example=2,
        description='id of the new workspace id.',
        allow_none=True,
        default=None,
    )

    @post_load
    def make_move_params(self, data):
        return MoveParams(**data)


class ContentCreationSchema(marshmallow.Schema):
    label = marshmallow.fields.String(
        example='contract for client XXX',
        description='Title of the content to create'
    )
    content_type = marshmallow.fields.String(
        example='htmlpage',
        validate=OneOf([content.slug for content in CONTENT_DEFAULT_TYPE]),
    )

    @post_load
    def make_content_filter(self, data):
        return ContentCreation(**data)


class ContentDigestSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6)
    slug = marshmallow.fields.Str(example='intervention-report-12')
    parent_id = marshmallow.fields.Int(
        example=34,
        allow_none=True,
        default=None
    )
    workspace_id = marshmallow.fields.Int(
        example=19,
    )
    label = marshmallow.fields.Str(example='Intervention Report 12')
    content_type = marshmallow.fields.Str(
        example='htmlpage',
        validate=OneOf([content.slug for content in CONTENT_DEFAULT_TYPE]),
    )
    sub_content_types = marshmallow.fields.List(
        marshmallow.fields.Str,
        description='list of content types allowed as sub contents. '
                    'This field is required for folder contents, '
                    'set it to empty list in other cases'
    )
    status = marshmallow.fields.Str(
        example='closed-deprecated',
        validate=OneOf([status.slug for status in CONTENT_DEFAULT_STATUS]),
        description='this slug is found in content_type available statuses',
        default=open_status
    )
    is_archived = marshmallow.fields.Bool(example=False, default=False)
    is_deleted = marshmallow.fields.Bool(example=False, default=False)
    show_in_ui = marshmallow.fields.Bool(
        example=True,
        description='if false, then do not show content in the treeview. '
                    'This may his maybe used for specific contents or '
                    'for sub-contents. Default is True. '
                    'In first version of the API, this field is always True',
    )
