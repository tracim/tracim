# coding=utf-8
import marshmallow
from marshmallow import post_load
from marshmallow.validate import OneOf

from tracim.lib.utils.utils import DATETIME_FORMAT
from tracim.models.auth import Profile
from tracim.models.contents import GlobalStatus
from tracim.models.contents import open_status
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.models.contents import ContentStatusLegacy as ContentStatus
from tracim.models.context_models import ContentCreation
from tracim.models.context_models import WorkspaceMemberInvitation
from tracim.models.context_models import WorkspaceUpdate
from tracim.models.context_models import RoleUpdate
from tracim.models.context_models import CommentCreation
from tracim.models.context_models import TextBasedContentUpdate
from tracim.models.context_models import SetContentStatus
from tracim.models.context_models import CommentPath
from tracim.models.context_models import MoveParams
from tracim.models.context_models import WorkspaceAndContentPath
from tracim.models.context_models import WorkspaceAndUserPath
from tracim.models.context_models import ContentFilter
from tracim.models.context_models import LoginCredentials
from tracim.models.data import UserRoleInWorkspace


class UserDigestSchema(marshmallow.Schema):
    """
    Simple user schema
    """
    user_id = marshmallow.fields.Int(dump_only=True, example=3)
    avatar_url = marshmallow.fields.Url(
        allow_none=True,
        example="/api/v2/assets/avatars/suri-cate.jpg",
        description="avatar_url is the url to the image file. "
                    "If no avatar, then set it to null "
                    "(and frontend will interpret this with a default avatar)",
    )
    public_name = marshmallow.fields.String(
        example='Suri Cate',
    )


class UserSchema(UserDigestSchema):
    """
    Complete user schema
    """
    email = marshmallow.fields.Email(
        required=True,
        example='suri.cate@algoo.fr'
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
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


class WorkspaceAndUserIdPathSchema(
    UserIdPathSchema,
    WorkspaceIdPathSchema
):
    @post_load
    def make_path_object(self, data):
        return WorkspaceAndUserPath(**data)


class WorkspaceAndContentIdPathSchema(
    WorkspaceIdPathSchema,
    ContentIdPathSchema
):
    @post_load
    def make_path_object(self, data):
        return WorkspaceAndContentPath(**data)


class CommentsPathSchema(WorkspaceAndContentIdPathSchema):
    comment_id = marshmallow.fields.Int(
        example=6,
        description='id of a comment related to content content_id',
        required=True
    )

    @post_load
    def make_path_object(self, data):
        return CommentPath(**data)


class FilterContentQuerySchema(marshmallow.Schema):
    parent_id = marshmallow.fields.Int(
        example=2,
        default=0,
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


class RoleUpdateSchema(marshmallow.Schema):
    role = marshmallow.fields.String(
        example='contributor',
        validate=OneOf(UserRoleInWorkspace.get_all_role_slug())
    )

    @post_load
    def make_role(self, data):
        return RoleUpdate(**data)


class WorkspaceMemberInviteSchema(RoleUpdateSchema):
    user_id = marshmallow.fields.Int(
        example=5,
        default=None,
        allow_none=True,
    )
    user_email_or_public_name = marshmallow.fields.String(
        example='suri@cate.fr',
        default=None,
        allow_none=True,
    )

    @post_load
    def make_role(self, data):
        return WorkspaceMemberInvitation(**data)


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


class WorkspaceModifySchema(marshmallow.Schema):
    label = marshmallow.fields.String(
        example='My Workspace',
    )
    description = marshmallow.fields.String(
        example='A super description of my workspace.',
    )

    @post_load
    def make_workspace_modifications(self, data):
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
        UserDigestSchema()
    )
    workspace = marshmallow.fields.Nested(
        WorkspaceDigestSchema(exclude=('sidebar_entries',))
    )
    is_active = marshmallow.fields.Bool()

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
        validate=OneOf(ContentType.allowed_types()),
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
    )
    new_workspace_id = marshmallow.fields.Int(
        example=2,
        description='id of the new workspace id.',
        required=True
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
        example='html-documents',
        validate=OneOf(ContentType.allowed_types_for_folding()),  # nopep8
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
        example='html-documents',
        validate=OneOf(ContentType.allowed_types()),
    )
    sub_content_types = marshmallow.fields.List(
        marshmallow.fields.String(
            example='html-content',
            validate=OneOf(ContentType.allowed_types())
        ),
        description='list of content types allowed as sub contents. '
                    'This field is required for folder contents, '
                    'set it to empty list in other cases'
    )
    status = marshmallow.fields.Str(
        example='closed-deprecated',
        validate=OneOf(ContentStatus.allowed_values()),
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


#####
# Content
#####

class ContentSchema(ContentDigestSchema):
    current_revision_id = marshmallow.fields.Int(example=12)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='Content creation date',
    )
    author = marshmallow.fields.Nested(UserDigestSchema)
    modified = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='date of last modification of content',
    )
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)


class TextBasedDataAbstractSchema(marshmallow.Schema):
    raw_content = marshmallow.fields.String(
        description='Content of the object, may be raw text or <b>html</b> for example'  # nopep8
    )


class TextBasedContentSchema(ContentSchema, TextBasedDataAbstractSchema):
    pass


#####
# Revision
#####


class RevisionSchema(ContentDigestSchema):
    comment_ids = marshmallow.fields.List(marshmallow.fields.Int(example=4))
    revision_id = marshmallow.fields.Int(example=12)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description='Content creation date',
    )
    author = marshmallow.fields.Nested(UserDigestSchema)


class TextBasedRevisionSchema(RevisionSchema, TextBasedDataAbstractSchema):
    pass


class CommentSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6)
    parent_id = marshmallow.fields.Int(example=34)
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
        example='<p>This is just an html comment !</p>'
    )

    @post_load()
    def create_comment(self, data):
        return CommentCreation(**data)


class ContentModifyAbstractSchema(marshmallow.Schema):
    label = marshmallow.fields.String(
        required=True,
        example='contract for client XXX',
        description='New title of the content'
    )


class TextBasedContentModifySchema(ContentModifyAbstractSchema, TextBasedDataAbstractSchema):  # nopep8

    @post_load
    def text_based_content_update(self, data):
        return TextBasedContentUpdate(**data)


class SetContentStatusSchema(marshmallow.Schema):
    status = marshmallow.fields.Str(
        example='closed-deprecated',
        validate=OneOf(ContentStatus.allowed_values()),
        description='this slug is found in content_type available statuses',
        default=open_status,
        required=True,
    )

    @post_load
    def set_status(self, data):
        return SetContentStatus(**data)
