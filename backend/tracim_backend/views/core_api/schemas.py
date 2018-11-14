# coding=utf-8
import typing

import marshmallow
from marshmallow import post_load
from marshmallow.validate import Length
from marshmallow.validate import OneOf
from marshmallow.validate import Range

from tracim_backend.app_models.contents import GlobalStatus
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.contents import open_status
from tracim_backend.app_models.validator import all_content_types_validator
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.models.auth import Group
from tracim_backend.models.auth import Profile
from tracim_backend.models.context_models import ActiveContentFilter
from tracim_backend.models.context_models import CommentCreation
from tracim_backend.models.context_models import CommentPath
from tracim_backend.models.context_models import ContentCreation
from tracim_backend.models.context_models import ContentFilter
from tracim_backend.models.context_models import ContentIdsQuery
from tracim_backend.models.context_models import FileCreation
from tracim_backend.models.context_models import FilePath
from tracim_backend.models.context_models import FilePreviewSizedPath
from tracim_backend.models.context_models import FileQuery
from tracim_backend.models.context_models import FileRevisionPath
from tracim_backend.models.context_models import FolderContentUpdate
from tracim_backend.models.context_models import KnownMemberQuery
from tracim_backend.models.context_models import LoginCredentials
from tracim_backend.models.context_models import MoveParams
from tracim_backend.models.context_models import PageQuery
from tracim_backend.models.context_models import ResetPasswordCheckToken
from tracim_backend.models.context_models import ResetPasswordModify
from tracim_backend.models.context_models import ResetPasswordRequest
from tracim_backend.models.context_models import RevisionPreviewSizedPath
from tracim_backend.models.context_models import RoleUpdate
from tracim_backend.models.context_models import SetContentStatus
from tracim_backend.models.context_models import SetEmail
from tracim_backend.models.context_models import SetPassword
from tracim_backend.models.context_models import SimpleFile
from tracim_backend.models.context_models import TextBasedContentUpdate
from tracim_backend.models.context_models import UserCreation
from tracim_backend.models.context_models import UserInfos
from tracim_backend.models.context_models import UserProfile
from tracim_backend.models.context_models import UserWorkspaceAndContentPath
from tracim_backend.models.context_models import WorkspaceAndContentPath
from tracim_backend.models.context_models import \
    WorkspaceAndContentRevisionPath
from tracim_backend.models.context_models import WorkspaceAndUserPath
from tracim_backend.models.context_models import WorkspaceMemberInvitation
from tracim_backend.models.context_models import WorkspacePath
from tracim_backend.models.context_models import WorkspaceUpdate
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import UserRoleInWorkspace

FIELD_LANG_DESC = "User langage in ISO 639 format. " \
                  "See https://fr.wikipedia.org/wiki/ISO_639"
FIELD_PROFILE_DESC = "Profile of the user. The profile is Tracim wide."
FIELD_TIMEZONE_DESC = "Timezone as in tz database format"


class SimpleFileSchema(marshmallow.Schema):
    """
    Just a simple schema for file
    """
    # TODO - G.M - 2018-10-09 - Set required to True, actually disable because
    # activating it make it failed due to "is not iterable issue.
    files = marshmallow.fields.Raw(required=False, description='a file')

    @post_load
    def create_file(self, data: typing.Dict[str, typing.Any]) -> object:
        return SimpleFile(**data)


class FileCreationFormSchema(marshmallow.Schema):
    parent_id = marshmallow.fields.Int(
        example=2,
        default=0,
        validate=Range(min=0, error="Value must be positive or 0"),
        allow_none=True
    )

    @post_load
    def file_creation_object(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return FileCreation(**data)


class UserDigestSchema(marshmallow.Schema):
    """
    Simple user schema
    """
    user_id = marshmallow.fields.Int(dump_only=True, example=3)
    avatar_url = marshmallow.fields.Url(
        allow_none=True,
        example="/api/v2/asset/avatars/john-doe.jpg",
        description="avatar_url is the url of the image file. "
                    "If no avatar, then set it to an empty string "
                    "(frontend should interpret "
                    "an empty url as default avatar)",
    )
    public_name = marshmallow.fields.String(
        example='John Doe',
    )


class UserSchema(UserDigestSchema):
    """
    Complete user schema
    """
    email = marshmallow.fields.Email(
        required=True,
        example='hello@tracim.fr'
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='Date of creation of the user account',
    )
    is_active = marshmallow.fields.Bool(
        example=True,
        description='true if the user is active, '
                    'false if the user has been deactivated'
                    ' by an admin. Default is true'
    )
    is_deleted = marshmallow.fields.Bool(
        example=False,
        description='true if the user account has been deleted. '
                    'Default is false'
    )
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = marshmallow.fields.String(
        description=FIELD_TIMEZONE_DESC,
        example="Europe/Paris",
    )
    # TODO - G.M - 17-04-2018 - check this, relative url allowed ?
    caldav_url = marshmallow.fields.Url(
        allow_none=True,
        relative=True,
        attribute='calendar_url',
        example="/api/v2/calendar/user/3.ics/",
        description="CalDAV url of the user dedicated calendar",
    )
    profile = marshmallow.fields.String(
        attribute='profile',
        validate=OneOf(Profile._NAME),
        example='trusted-users',
        description=FIELD_PROFILE_DESC,
    )
    lang = marshmallow.fields.String(
        description=FIELD_LANG_DESC,
        example='en',
        required=False,
        validate=Length(min=2, max=3),
        allow_none=True,
        default=None,
    )

    class Meta:
        description = 'Representation of a tracim user account'


class LoggedInUserPasswordSchema(marshmallow.Schema):
    loggedin_user_password = marshmallow.fields.String(
        required=True,
    )


class SetEmailSchema(LoggedInUserPasswordSchema):
    email = marshmallow.fields.Email(
        required=True,
        example='hello@tracim.fr'
    )

    @post_load
    def create_set_email_object(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return SetEmail(**data)


class SetPasswordSchema(LoggedInUserPasswordSchema):
    new_password = marshmallow.fields.String(
        example='8QLa$<w',
        required=True
    )
    new_password2 = marshmallow.fields.String(
        example='8QLa$<w',
        required=True
    )

    @post_load
    def create_set_password_object(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return SetPassword(**data)


class SetUserInfoSchema(marshmallow.Schema):
    """
    Schema used for setting user information.
    This schema is for write access only
    """

    timezone = marshmallow.fields.String(
        description=FIELD_TIMEZONE_DESC,
        example="Europe/Paris",
        required=True,
    )
    public_name = marshmallow.fields.String(
        example='John Doe',
        required=True,
    )
    lang = marshmallow.fields.String(
        description=FIELD_LANG_DESC,
        example='en',
        required=True,
        validate=Length(min=2, max=3),
        allow_none=True,
        default=None,
    )

    @post_load
    def create_user_info_object(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return UserInfos(**data)


class SetUserProfileSchema(marshmallow.Schema):
    """
    Schema used for setting user profile. This schema is for write access only
    """
    profile = marshmallow.fields.String(
        attribute='profile',
        validate=OneOf(Profile._NAME),
        example='trusted-users',
        description=FIELD_PROFILE_DESC,
    )

    @post_load
    def create_user_profile(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserProfile(**data)


class UserCreationSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=True,
        example='hello@tracim.fr'
    )
    password = marshmallow.fields.String(
        example='8QLa$<w',
        required=False,
    )
    profile = marshmallow.fields.String(
        attribute='profile',
        validate=OneOf(Profile._NAME),
        example='trusted-users',
        required=False,
        default=Group.TIM_USER_GROUPNAME,
        description=FIELD_PROFILE_DESC,
    )
    timezone = marshmallow.fields.String(
        description=FIELD_TIMEZONE_DESC,
        example="Europe/Paris",
        required=False,
        default=''
    )
    public_name = marshmallow.fields.String(
        example='John Doe',
        required=False,
        default=None,
    )
    lang = marshmallow.fields.String(
        description=FIELD_LANG_DESC,
        example='en',
        required=False,
        validate=Length(min=2, max=3),
        allow_none=True,
        default=None,
    )
    email_notification = marshmallow.fields.Bool(
        example=True,
        required=False,
        default=True,
    )

    @post_load
    def create_user(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserCreation(**data)


# Path Schemas

class UserIdPathSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(
        example=3,
        required=True,
        description='id of a valid user',
        validate=Range(min=1, error="Value must be greater than 0"),
    )


class WorkspaceIdPathSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(
        example=4,
        required=True,
        description='id of a valid workspace',
        validate=Range(min=1, error="Value must be greater than 0"),
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return WorkspacePath(**data)


class ContentIdPathSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        example=6,
        required=True,
        description='id of a valid content',
        validate=Range(min=1, error="Value must be greater than 0"),
    )


class RevisionIdPathSchema(marshmallow.Schema):
    revision_id = marshmallow.fields.Int(example=6, required=True)


class WorkspaceAndUserIdPathSchema(
    UserIdPathSchema,
    WorkspaceIdPathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndUserPath(**data)


class WorkspaceAndContentIdPathSchema(
    WorkspaceIdPathSchema,
    ContentIdPathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndContentPath(**data)


class FilenamePathSchema(marshmallow.Schema):
    filename = marshmallow.fields.String('filename.ext')


class WidthAndHeightPathSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(example=256)
    height = marshmallow.fields.Int(example=256)


class AllowedJpgPreviewSizesSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(example=256)
    height = marshmallow.fields.Int(example=256)


class AllowedJpgPreviewDimSchema(marshmallow.Schema):
    restricted = marshmallow.fields.Bool()
    dimensions = marshmallow.fields.Nested(
        AllowedJpgPreviewSizesSchema,
        many=True
    )


class WorkspaceAndContentRevisionIdPathSchema(
    WorkspaceIdPathSchema,
    ContentIdPathSchema,
    RevisionIdPathSchema,
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndContentRevisionPath(**data)


class FilePathSchema(
    WorkspaceAndContentIdPathSchema,
    FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FilePath(**data)


class FileRevisionPathSchema(
    WorkspaceAndContentRevisionIdPathSchema,
    FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FileRevisionPath(**data)


class FilePreviewSizedPathSchema(
    WorkspaceAndContentIdPathSchema,
    WidthAndHeightPathSchema,
    FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FilePreviewSizedPath(**data)


class FileRevisionPreviewSizedPathSchema(
    WorkspaceAndContentRevisionIdPathSchema,
    WidthAndHeightPathSchema,
    FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return RevisionPreviewSizedPath(**data)


class UserWorkspaceAndContentIdPathSchema(
    UserIdPathSchema,
    WorkspaceIdPathSchema,
    ContentIdPathSchema,
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserWorkspaceAndContentPath(**data)


class UserWorkspaceIdPathSchema(
    UserIdPathSchema,
    WorkspaceIdPathSchema,
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndUserPath(**data)


class CommentsPathSchema(WorkspaceAndContentIdPathSchema):
    comment_id = marshmallow.fields.Int(
        example=6,
        description='id of a valid comment related to content content_id',
        required=True,
        validate=Range(min=1, error="Value must be greater than 0"),
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return CommentPath(**data)


class KnownMemberQuerySchema(marshmallow.Schema):
    acp = marshmallow.fields.Str(
        example='test',
        description='search text to query',
        validate=Length(min=2),
        required=True,
    )
    exclude_user_ids = marshmallow.fields.List(
        marshmallow.fields.Integer(
             example=6,
             validate=Range(min=1, error="Value must be greater than 0"),
        ),
        description='list of excluded user',
    )
    exclude_workspace_ids = marshmallow.fields.List(
        marshmallow.fields.Integer(
            example=3,
            validate=Range(min=1, error="Value must be greater than 0"),
        ),
        description='list of excluded workspace: user of this workspace are excluded from result',  # nopep8
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return KnownMemberQuery(**data)


class FileQuerySchema(marshmallow.Schema):
    force_download = marshmallow.fields.Int(
        example=1,
        default=0,
        description='force download of file or let browser decide if'
                    'file can be read directly from browser',
        validate=Range(min=0, max=1, error="Value must be 0 or 1"),
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any]) -> object:
        return FileQuery(**data)


class PageQuerySchema(FileQuerySchema):
    page = marshmallow.fields.Int(
        example=2,
        default=1,
        description='allow to show a specific page of a pdf file',
        validate=Range(min=1, error="Value must be positive"),
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any]) -> object:
        return PageQuery(**data)


class FilterContentQuerySchema(marshmallow.Schema):
    parent_id = marshmallow.fields.Int(
        example=2,
        default=0,
        description='allow to filter items in a folder.'
                    ' If not set, then return all contents.'
                    ' If set to 0, then return root contents.'
                    ' If set to another value, return all contents'
                    ' directly included in the folder parent_id',
        validate=Range(min=0, error="Value must be positive or 0"),
    )
    show_archived = marshmallow.fields.Int(
        example=0,
        default=0,
        description='if set to 1, then show archived contents.'
                    ' Default is 0 - hide archived content',
        validate=Range(min=0, max=1, error="Value must be 0 or 1"),
    )
    show_deleted = marshmallow.fields.Int(
        example=0,
        default=0,
        description='if set to 1, then show deleted contents.'
                    ' Default is 0 - hide deleted content',
        validate=Range(min=0, max=1, error="Value must be 0 or 1"),
    )
    show_active = marshmallow.fields.Int(
        example=1,
        default=1,
        description='f set to 1, then show active contents. '
                    'Default is 1 - show active content.'
                    ' Note: active content are content '
                    'that is neither archived nor deleted. '
                    'The reason for this parameter to exist is for example '
                    'to allow to show only archived documents',
        validate=Range(min=0, max=1, error="Value must be 0 or 1"),
    )
    content_type = marshmallow.fields.String(
        example=content_type_list.Any_SLUG,
        default=content_type_list.Any_SLUG,
        validate=all_content_types_validator
    )
    label = marshmallow.fields.String(
        example='myfilename',
        default=None,
        allow_none=True,
        description='Filter by content label'
    )

    @post_load
    def make_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentFilter(**data)


class ActiveContentFilterQuerySchema(marshmallow.Schema):
    limit = marshmallow.fields.Int(
        example=2,
        default=0,
        description='if 0 or not set, return all elements, else return only '
                    'the first limit elem (according to offset)',
        validate=Range(min=0, error="Value must be positive or 0"),
    )
    before_content_id = marshmallow.fields.Int(
        example=41,
        default=None,
        allow_none=True,
        description='return only content updated before this content',
    )

    @post_load
    def make_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return ActiveContentFilter(**data)


class ContentIdsQuerySchema(marshmallow.Schema):
    contents_ids = marshmallow.fields.List(
        marshmallow.fields.Int(
            example=6,
            validate=Range(min=1, error="Value must be greater than 0"),
        )
    )

    @post_load
    def make_contents_ids(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentIdsQuery(**data)


###


class RoleUpdateSchema(marshmallow.Schema):
    role = marshmallow.fields.String(
        required=True,
        example='contributor',
        validate=OneOf(UserRoleInWorkspace.get_all_role_slug())
    )

    @post_load
    def make_role(self, data: typing.Dict[str, typing.Any]) -> object:
        return RoleUpdate(**data)


class WorkspaceMemberInviteSchema(marshmallow.Schema):
    role = marshmallow.fields.String(
        example='contributor',
        validate=OneOf(UserRoleInWorkspace.get_all_role_slug()),
        required=True
    )
    user_id = marshmallow.fields.Int(
        example=5,
        default=None,
        allow_none=True,
    )
    user_email = marshmallow.fields.Email(
        example='suri@cate.fr',
        default=None,
        allow_none=True,
    )
    user_public_name = marshmallow.fields.String(
        example='John',
        default=None,
        allow_none=True,
    )

    @post_load
    def make_role(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceMemberInvitation(**data)


class ResetPasswordRequestSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=True,
        example='hello@tracim.fr'
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordRequest(**data)


class ResetPasswordCheckTokenSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=True,
        example='hello@tracim.fr'
    )
    reset_password_token = marshmallow.fields.String(
        description="token to reset password of given user",
        required=True,
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordCheckToken(**data)


class ResetPasswordModifySchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=True,
        example='hello@tracim.fr'
    )
    reset_password_token = marshmallow.fields.String(
        description="token to reset password of given user",
        required=True,
    )
    new_password = marshmallow.fields.String(
        example='8QLa$<w',
        required=True
    )
    new_password2 = marshmallow.fields.String(
        example='8QLa$<w',
        required=True
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordModify(**data)


class BasicAuthSchema(marshmallow.Schema):

    email = marshmallow.fields.Email(
        example='hello@tracim.fr',
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
    def make_login(self, data: typing.Dict[str, typing.Any]) -> object:
        return LoginCredentials(**data)


class LoginOutputHeaders(marshmallow.Schema):
    expire_after = marshmallow.fields.String()


class WorkspaceModifySchema(marshmallow.Schema):
    label = marshmallow.fields.String(
        required=True,
        example='My Workspace',
        validate=Length(min=1),
    )
    description = marshmallow.fields.String(
        required=True,
        example='A super description of my workspace.',
    )

    @post_load
    def make_workspace_modifications(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return WorkspaceUpdate(**data)


class WorkspaceCreationSchema(WorkspaceModifySchema):
    pass


class NoContentSchema(marshmallow.Schema):

    class Meta:
        description = 'Empty Schema'
    pass


class WorkspaceMenuEntrySchema(marshmallow.Schema):
    slug = marshmallow.fields.String(example='markdown-pages')
    label = marshmallow.fields.String(example='Markdown Documents')
    route = marshmallow.fields.String(
        example='/workspace/{workspace_id}/contents/?type=mardown-page',
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
    workspace_id = marshmallow.fields.Int(
        example=4,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    slug = marshmallow.fields.String(example='intranet')
    label = marshmallow.fields.String(example='Intranet')
    sidebar_entries = marshmallow.fields.Nested(
        WorkspaceMenuEntrySchema,
        many=True,
    )
    is_deleted = marshmallow.fields.Bool(example=False, default=False)

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
    user_id = marshmallow.fields.Int(
        example=3,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    workspace_id = marshmallow.fields.Int(
        example=4,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    user = marshmallow.fields.Nested(
        UserDigestSchema()
    )
    workspace = marshmallow.fields.Nested(
        WorkspaceDigestSchema(exclude=('sidebar_entries',))
    )
    is_active = marshmallow.fields.Bool()
    do_notify = marshmallow.fields.Bool(
        description='has user enabled notification for this workspace',
        example=True,
    )

    class Meta:
        description = 'Workspace Member information'


class WorkspaceMemberCreationSchema(WorkspaceMemberSchema):
    newly_created = marshmallow.fields.Bool(
        exemple=False,
        description='Is the user completely new '
                    '(and account was just created) or not ?',
    )
    email_sent = marshmallow.fields.Bool(
        exemple=False,
        description='Has an email been sent to user to inform him about '
                    'this new workspace registration and eventually his account'
                    'creation'
    )


class ApplicationConfigSchema(marshmallow.Schema):
    pass
    #  TODO - G.M - 24-05-2018 - Set this


class TimezoneSchema(marshmallow.Schema):
    name = marshmallow.fields.String(example='Europe/London')


class AboutSchema(marshmallow.Schema):
    name = marshmallow.fields.String(example='Tracim', description='Software name')  # nopep8
    version = marshmallow.fields.String(example='2.0', allow_none=True, description='Version of Tracim')  # nopep8
    datetime = marshmallow.fields.DateTime(format=DATETIME_FORMAT)
    website = marshmallow.fields.URL(allow_none=True)


class ConfigSchema(marshmallow.Schema):
    email_notification_activated = marshmallow.fields.Bool()


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
        validate=all_content_types_validator,
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
        description='id of the new parent content id.',
        allow_none=True,
        required=True,
        validate=Range(min=0, error="Value must be positive or 0"),
    )
    new_workspace_id = marshmallow.fields.Int(
        example=2,
        description='id of the new workspace id.',
        required=True,
        validate=Range(min=1, error="Value must be greater than 0"),
    )

    @post_load
    def make_move_params(self, data: typing.Dict[str, typing.Any]) -> object:
        return MoveParams(**data)


class ContentCreationSchema(marshmallow.Schema):
    label = marshmallow.fields.String(
        required=True,
        example='contract for client XXX',
        description='Title of the content to create',
        validate=Length(min=1),
    )
    content_type = marshmallow.fields.String(
        required=True,
        example='html-document',
        validate=all_content_types_validator,
    )
    parent_id = marshmallow.fields.Integer(
        example=35,
        description='content_id of parent content, if content should be placed '
                    'in a folder, this should be folder content_id.',
        allow_none=True,
        default=None,
        validate=Range(min=1, error="Value must be positive"),
    )

    @post_load
    def make_content_creation(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return ContentCreation(**data)


class ContentDigestSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        example=6,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    slug = marshmallow.fields.Str(example='intervention-report-12')
    parent_id = marshmallow.fields.Int(
        example=34,
        allow_none=True,
        default=None,
        validate=Range(min=0, error="Value must be positive or 0"),
    )
    workspace_id = marshmallow.fields.Int(
        example=19,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    label = marshmallow.fields.Str(example='Intervention Report 12')
    content_type = marshmallow.fields.Str(
        example='html-document',
        validate=all_content_types_validator,
    )
    sub_content_types = marshmallow.fields.List(
        marshmallow.fields.String(
            example='html-content',
            validate=all_content_types_validator
        ),
        description='list of content types allowed as sub contents. '
                    'This field is required for folder contents, '
                    'set it to empty list in other cases'
    )
    status = marshmallow.fields.Str(
        example='closed-deprecated',
        validate=OneOf(content_status_list.get_all_slugs_values()),
        description='this slug is found in content_type available statuses',
        default=open_status
    )
    is_archived = marshmallow.fields.Bool(example=False, default=False)
    is_deleted = marshmallow.fields.Bool(example=False, default=False)
    is_editable = marshmallow.fields.Bool(example=True, default=True)
    show_in_ui = marshmallow.fields.Bool(
        example=True,
        description='if false, then do not show content in the treeview. '
                    'This may his maybe used for specific contents or '
                    'for sub-contents. Default is True. '
                    'In first version of the API, this field is always True',
    )
    file_extension = marshmallow.fields.String(
        example='.txt'
    )
    filename = marshmallow.fields.String(
        example='nameofthefile.txt'
    )
    modified = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='date of last modification of content.'
                    ' note: this does not include comments or any subcontents.',
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='Content creation date',
    )


class ReadStatusSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        example=6,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    read_by_user = marshmallow.fields.Bool(example=False, default=False)
#####
# Content
#####


class ContentSchema(ContentDigestSchema):
    current_revision_id = marshmallow.fields.Int(example=12)
    author = marshmallow.fields.Nested(UserDigestSchema)
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)


class TextBasedDataAbstractSchema(marshmallow.Schema):
    raw_content = marshmallow.fields.String(
        description='Content of the object, may be raw text or <b>html</b> for example'  # nopep8
    )


class FileInfoAbstractSchema(marshmallow.Schema):
    raw_content = marshmallow.fields.String(
        description='raw text or html description of the file'
    )
    page_nb = marshmallow.fields.Int(
        description='number of pages, return null value if unaivalable',
        example=1,
        allow_none=True,
    )
    mimetype = marshmallow.fields.String(
        description='file content mimetype',
        example='image/jpeg',
        required=True,
    )
    size = marshmallow.fields.Int(
        description='file size in byte, return null value if unaivalable',
        example=1024,
        allow_none=True,
    )
    has_pdf_preview = marshmallow.fields.Bool(
        description="true if a pdf preview is available or false",
        example=True,
    )
    has_jpeg_preview = marshmallow.fields.Bool(
        description="true if a jpeg preview is available or false",
        example=True,
    )


class TextBasedContentSchema(ContentSchema, TextBasedDataAbstractSchema):
    pass


class FileContentSchema(ContentSchema, FileInfoAbstractSchema):
    pass

#####
# Revision
#####


class RevisionSchema(ContentDigestSchema):
    comment_ids = marshmallow.fields.List(
        marshmallow.fields.Int(
            example=4,
            validate=Range(min=1, error="Value must be greater than 0"),
        )
    )
    revision_id = marshmallow.fields.Int(
        example=12,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    revision_type = marshmallow.fields.String(
        example=ActionDescription.CREATION,
        validate=OneOf(ActionDescription.allowed_values()),
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='Content creation date',
    )
    author = marshmallow.fields.Nested(UserDigestSchema)


class TextBasedRevisionSchema(RevisionSchema, TextBasedDataAbstractSchema):
    pass


class FileRevisionSchema(RevisionSchema, FileInfoAbstractSchema):
    pass


class CommentSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        example=6,
        validate=Range(min=1, error="Value must be greater than 0"),
    )
    parent_id = marshmallow.fields.Int(
        example=34,
        validate=Range(min=0, error="Value must be positive or 0"),
    )
    raw_content = marshmallow.fields.String(
        example='<p>This is just an html comment !</p>'
    )
    author = marshmallow.fields.Nested(UserDigestSchema)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='comment creation date',
    )


class SetCommentSchema(marshmallow.Schema):
    raw_content = marshmallow.fields.String(
        example='<p>This is just an html comment !</p>',
        validate=Length(min=1),
        required=True,
    )

    @post_load()
    def create_comment(self, data: typing.Dict[str, typing.Any]) -> object:
        return CommentCreation(**data)


class ContentModifyAbstractSchema(marshmallow.Schema):
    label = marshmallow.fields.String(
        required=True,
        example='contract for client XXX',
        description='New title of the content',
        validate=Length(min=1)
    )


class TextBasedContentModifySchema(ContentModifyAbstractSchema, TextBasedDataAbstractSchema):  # nopep8

    @post_load
    def text_based_content_update(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return TextBasedContentUpdate(**data)


class FolderContentModifySchema(ContentModifyAbstractSchema, TextBasedDataAbstractSchema):  # nopep8
    sub_content_types = marshmallow.fields.List(
        marshmallow.fields.String(
            example='html-document',
            validate=all_content_types_validator,
        ),
        description='list of content types allowed as sub contents. '
                    'This field is required for folder contents, '
                    'set it to empty list in other cases'
    )

    @post_load
    def folder_content_update(self, data: typing.Dict[str, typing.Any]) -> object:  # nopep8
        return FolderContentUpdate(**data)


class FileContentModifySchema(TextBasedContentModifySchema):
    pass


class SetContentStatusSchema(marshmallow.Schema):
    status = marshmallow.fields.Str(
        example='closed-deprecated',
        validate=OneOf(content_status_list.get_all_slugs_values()),
        description='this slug is found in content_type available statuses',
        default=open_status,
        required=True,
    )

    @post_load
    def set_status(self, data: typing.Dict[str, typing.Any]) -> object:
        return SetContentStatus(**data)
