# coding=utf-8
import typing

import marshmallow
from marshmallow import post_load
from marshmallow.fields import String
from marshmallow.fields import ValidatedField
from marshmallow.validate import OneOf

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.app_models.contents import open_status
from tracim_backend.app_models.rfc_email_validator import RFCEmailValidator
from tracim_backend.app_models.validator import action_description_validator
from tracim_backend.app_models.validator import all_content_types_validator
from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import content_global_status_validator
from tracim_backend.app_models.validator import content_status_validator
from tracim_backend.app_models.validator import not_empty_string_validator
from tracim_backend.app_models.validator import page_token_validator
from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.app_models.validator import regex_string_as_list_of_int
from tracim_backend.app_models.validator import regex_string_as_list_of_string
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.app_models.validator import user_config_validator
from tracim_backend.app_models.validator import user_email_validator
from tracim_backend.app_models.validator import user_lang_validator
from tracim_backend.app_models.validator import user_password_validator
from tracim_backend.app_models.validator import user_profile_validator
from tracim_backend.app_models.validator import user_profile_validator_with_nobody
from tracim_backend.app_models.validator import user_public_name_validator
from tracim_backend.app_models.validator import user_role_validator
from tracim_backend.app_models.validator import user_timezone_validator
from tracim_backend.app_models.validator import user_username_validator
from tracim_backend.app_models.validator import workspace_access_type_validator
from tracim_backend.app_models.validator import workspace_subscription_state_validator
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.lib.utils.utils import DEFAULT_NB_ITEM_PAGINATION
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.models.auth import AuthType
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
from tracim_backend.models.context_models import KnownMembersQuery
from tracim_backend.models.context_models import LiveMessageQuery
from tracim_backend.models.context_models import LoginCredentials
from tracim_backend.models.context_models import MoveParams
from tracim_backend.models.context_models import PageQuery
from tracim_backend.models.context_models import RadicaleUserSubitemsPath
from tracim_backend.models.context_models import RadicaleWorkspaceSubitemsPath
from tracim_backend.models.context_models import ResetPasswordCheckToken
from tracim_backend.models.context_models import ResetPasswordModify
from tracim_backend.models.context_models import ResetPasswordRequest
from tracim_backend.models.context_models import RevisionPreviewSizedPath
from tracim_backend.models.context_models import RoleUpdate
from tracim_backend.models.context_models import SetContentStatus
from tracim_backend.models.context_models import SetEmail
from tracim_backend.models.context_models import SetPassword
from tracim_backend.models.context_models import SetUsername
from tracim_backend.models.context_models import SimpleFile
from tracim_backend.models.context_models import TextBasedContentUpdate
from tracim_backend.models.context_models import UserAllowedSpace
from tracim_backend.models.context_models import UserCreation
from tracim_backend.models.context_models import UserFollowQuery
from tracim_backend.models.context_models import UserInfos
from tracim_backend.models.context_models import UserMessagesSummaryQuery
from tracim_backend.models.context_models import UserProfile
from tracim_backend.models.context_models import UserWorkspaceAndContentPath
from tracim_backend.models.context_models import WorkspaceAndContentPath
from tracim_backend.models.context_models import WorkspaceAndContentRevisionPath
from tracim_backend.models.context_models import WorkspaceAndUserPath
from tracim_backend.models.context_models import WorkspaceCreate
from tracim_backend.models.context_models import WorkspaceMemberInvitation
from tracim_backend.models.context_models import WorkspacePath
from tracim_backend.models.context_models import WorkspaceUpdate
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import EventTypeDatabaseParameters
from tracim_backend.models.event import OperationType
from tracim_backend.models.event import ReadStatus
from tracim_backend.models.roles import WorkspaceRoles

FIELD_LANG_DESC = "User langage in ISO 639 format. " "See https://fr.wikipedia.org/wiki/ISO_639"
FIELD_PROFILE_DESC = "Profile of the user. The profile is Tracim wide."
FIELD_TIMEZONE_DESC = "Timezone as in tz database format"


class StrippedString(String):
    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        if value:
            value = value.strip()
        return value.strip()


class EventTypeListField(StrippedString):
    def _deserialize(self, value, attr, data, **kwargs):
        result = []
        value = super()._deserialize(value, attr, data, **kwargs)
        if value:
            values = value.split(",")
            for item in values:
                result.append(EventTypeDatabaseParameters.from_event_type(item.strip()))
            return result
        return None


ExcludeAuthorIdsField = StrippedString(
    required=False,
    default=None,
    allow_none=True,
    validate=regex_string_as_list_of_int,
    example="1,5",
    description="comma separated list of excluded authors",
)


class RFCEmail(ValidatedField, String):
    """A validated email rfc style "john <john@john.ndd>" field.
    Validation occurs during both serialization and
    deserialization.

    :param args: The same positional arguments that :class:`String` receives.
    :param kwargs: The same keyword arguments that :class:`String` receives.
    """

    default_error_messages = {"invalid": "Not a valid rfc email address."}

    def __init__(self, *args, **kwargs):
        String.__init__(self, *args, **kwargs)
        # Insert validation into self.validators so that multiple errors can be
        # stored.
        self.validators.insert(0, RFCEmailValidator(error=self.error_messages["invalid"]))

    def _validated(self, value):
        if value is None:
            return None
        return RFCEmailValidator(error=self.error_messages["invalid"])(value)


class CollaborativeFileTypeSchema(marshmallow.Schema):
    mimetype = marshmallow.fields.String(
        example="application/vnd.oasis.opendocument.text",
        required=True,
        description="Collabora Online file mimetype",
    )
    extension = marshmallow.fields.String(
        example="odt", required=True, description="Collabora Online file extensions"
    )
    associated_action = marshmallow.fields.String(
        example="edit", required=True, description="Collabora Online action allowed"
    )
    url_source = marshmallow.fields.URL(
        required=True,
        description="URL of the collabora online editor for this type of file",
        example="http://localhost:9980/loleaflet/305832f/loleaflet.html",
    )


class SimpleFileSchema(marshmallow.Schema):
    """
    Just a simple schema for file
    """

    # TODO - G.M - 2018-10-09 - Set required to True, actually disable because
    # activating it make it failed due to "is not iterable issue.
    # see https://github.com/tracim/tracim/issues/2350
    files = marshmallow.fields.Raw(required=False, description="a file")

    @post_load
    def create_file(self, data: typing.Dict[str, typing.Any]) -> object:
        return SimpleFile(**data)


class FileCreationFormSchema(marshmallow.Schema):
    parent_id = marshmallow.fields.Int(
        example=2, default=0, validate=positive_int_validator, allow_none=True
    )

    @post_load
    def file_creation_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FileCreation(**data)


class UserDigestSchema(marshmallow.Schema):
    """
    Simple user schema
    """

    user_id = marshmallow.fields.Int(dump_only=True, example=3)
    avatar_url = marshmallow.fields.Url(
        allow_none=True,
        example="/api/asset/avatars/john-doe.jpg",
        description="avatar_url is the url of the image file. "
        "If no avatar, then set it to an empty string "
        "(frontend should interpret "
        "an empty url as default avatar)",
    )
    public_name = StrippedString(example="John Doe")
    username = StrippedString(
        example="My-Power_User99", required=False, default=None, allow_none=True
    )


class UserDiskSpaceSchema(UserDigestSchema):
    user_id = marshmallow.fields.Int(dump_only=True, example=3)
    allowed_space = marshmallow.fields.Integer(
        description="allowed space per user in bytes. this apply on sum of user owned workspace size."
        "if user_space > allowed_space, no file can be created/updated in any user owned workspaces. 0 mean no limit"
    )
    used_space = marshmallow.fields.Integer(
        description="used space per user in bytes. this apply on sum of user owned workspace size."
        "if user_space > allowed_space, no file can be created/updated in any user owned workspaces."
    )
    user = marshmallow.fields.Nested(UserDigestSchema(), attribute="user_in_context")


class UserSchema(UserDigestSchema):
    """
    Complete user schema
    """

    email = marshmallow.fields.Email(required=False, example="hello@tracim.fr", allow_none=True)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Date of creation of the user account"
    )
    is_active = marshmallow.fields.Bool(
        example=True,
        description="true if the user is active, "
        "false if the user has been deactivated"
        " by an admin. Default is true",
    )
    is_deleted = marshmallow.fields.Bool(
        example=False, description="true if the user account has been deleted. " "Default is false"
    )
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = StrippedString(
        description=FIELD_TIMEZONE_DESC, example="Europe/Paris", validate=user_timezone_validator
    )
    profile = StrippedString(
        attribute="profile",
        validate=user_profile_validator_with_nobody,
        example="trusted-users",
        description=FIELD_PROFILE_DESC,
    )
    lang = StrippedString(
        description=FIELD_LANG_DESC,
        example="en",
        required=False,
        validate=user_lang_validator,
        allow_none=True,
        default=None,
    )
    auth_type = marshmallow.fields.String(
        validate=OneOf([auth_type_en.value for auth_type_en in AuthType]),
        example=AuthType.INTERNAL.value,
        description="authentication system of the user",
    )
    allowed_space = marshmallow.fields.Integer(
        validate=positive_int_validator,
        allow_none=True,
        required=False,
        description="allowed space per user in bytes. this apply on sum of user owned workspace size."
        "if limit is reached, no file can be created/updated in any user owned workspaces. 0 mean no limit",
    )

    class Meta:
        description = "Representation of a tracim user account"


class LoggedInUserPasswordSchema(marshmallow.Schema):
    loggedin_user_password = String(required=True, validate=user_password_validator)


class SetConfigSchema(marshmallow.Schema):
    """
    Change the user config
    """

    parameters = marshmallow.fields.Dict(
        required=True,
        example={"param1": "value1"},
        validate=user_config_validator,
        description="A simple json dictionary. "
        'Valid keys only contain characters in "0-9a-zA-Z-_." and are not empty. '
        'You can use "." to create a hierarchy in the configuration parameters. '
        "Valid values only allow primitive types: numbers, bool, null, and do not accept "
        "complex types such dictionaries or lists.",
    )


class SetCustomPropertiesSchema(marshmallow.Schema):
    """
    Change the user config
    """

    parameters = marshmallow.fields.Dict(
        required=True, example={"param1": "value1"}, description="custom_properties schema",
    )


class SetEmailSchema(LoggedInUserPasswordSchema):
    email = marshmallow.fields.Email(
        required=True, example="hello@tracim.fr", validate=user_email_validator
    )

    @post_load
    def create_set_email_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return SetEmail(**data)


class SetUsernameSchema(LoggedInUserPasswordSchema):
    username = StrippedString(
        required=True, example="The-user_42", validate=user_username_validator
    )

    @post_load
    def create_set_username_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return SetUsername(**data)


class SetPasswordSchema(LoggedInUserPasswordSchema):
    new_password = String(example="8QLa$<w", required=True, validate=user_password_validator)
    new_password2 = String(example="8QLa$<w", required=True, validate=user_password_validator)

    @post_load
    def create_set_password_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return SetPassword(**data)


class SetUserInfoSchema(marshmallow.Schema):
    """
    Schema used for setting user information.
    This schema is for write access only
    """

    timezone = StrippedString(
        description=FIELD_TIMEZONE_DESC, example="Europe/Paris", required=True
    )
    public_name = StrippedString(
        example="John Doe", required=False, validate=user_public_name_validator, default=None
    )
    lang = StrippedString(
        description=FIELD_LANG_DESC,
        example="en",
        required=True,
        validate=user_lang_validator,
        allow_none=True,
        default=None,
    )

    @post_load
    def create_user_info_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserInfos(**data)


class SetUserProfileSchema(marshmallow.Schema):
    """
    Schema used for setting user profile. This schema is for write access only
    """

    profile = StrippedString(
        attribute="profile",
        validate=user_profile_validator,
        example="trusted-users",
        description=FIELD_PROFILE_DESC,
        required=True,
    )

    @post_load
    def create_user_profile(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserProfile(**data)


class SetUserAllowedSpaceSchema(marshmallow.Schema):
    """
    Schema used for setting user allowed space. This schema is for write access only
    """

    allowed_space = marshmallow.fields.Integer(
        validate=positive_int_validator,
        allow_none=True,
        required=False,
        description="allowed space per user in bytes. this apply on sum of user owned workspace size."
        "if limit is reached, no file can be created/updated in any user owned workspaces. 0 mean no limit.",
    )

    @post_load
    def create_user_allowed_space(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserAllowedSpace(**data)


class UserCreationSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=False, example="hello@tracim.fr", validate=user_email_validator, allow_none=True
    )
    username = String(
        required=False, example="My-Power_User99", validate=user_username_validator, allow_none=True
    )
    password = String(
        example="8QLa$<w",
        required=False,
        validate=user_password_validator,
        allow_none=True,
        default=None,
    )
    profile = StrippedString(
        attribute="profile",
        validate=user_profile_validator,
        example="trusted-users",
        required=False,
        allow_none=True,
        description=FIELD_PROFILE_DESC,
    )
    timezone = StrippedString(
        description=FIELD_TIMEZONE_DESC,
        example="Europe/Paris",
        required=False,
        default="",
        validate=user_timezone_validator,
    )
    public_name = StrippedString(
        example="John Doe",
        required=False,
        default=None,
        # validate=user_public_name_validator
    )
    lang = StrippedString(
        description=FIELD_LANG_DESC,
        example="en",
        required=False,
        validate=user_lang_validator,
        allow_none=True,
        default=None,
    )
    email_notification = marshmallow.fields.Bool(example=True, required=False, default=True)
    allowed_space = marshmallow.fields.Integer(
        validate=positive_int_validator,
        allow_none=True,
        required=False,
        description="allowed space per user in bytes. this apply on sum of user owned workspace size."
        "if limit is reached, no file can be created/updated in any user owned workspaces. 0 mean no limit",
    )

    @marshmallow.validates_schema(pass_original=True)
    def validate_email_and_username(self, data: dict, original_data: dict, **kwargs) -> None:
        if not original_data.get("email") and not original_data.get("username"):
            raise marshmallow.ValidationError("email or username required")

    @post_load
    def create_user(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserCreation(**data)


# Path Schemas
class RadicaleSubItemPathSchema(object):
    sub_item = marshmallow.fields.String()


class UserIdPathSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(
        example=3,
        required=True,
        description="id of a valid user",
        validate=strictly_positive_int_validator,
    )


class EventIdPathSchema(marshmallow.Schema):
    event_id = marshmallow.fields.Int(
        example=5,
        required=True,
        description="id of a valid event",
        validate=strictly_positive_int_validator,
    )


class MessageIdsPathSchema(UserIdPathSchema, EventIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return MessageIdsPath(**data)


class WorkspaceFilterQuery(object):
    def __init__(self, parent_ids: str = None):
        self.parent_ids = string_to_list(parent_ids, ",", int)


class UserWorkspaceFilterQuery(object):
    def __init__(
        self,
        show_owned_workspace: int = 1,
        show_workspace_with_role: int = 1,
        parent_ids: str = None,
    ):
        self.show_owned_workspace = bool(show_owned_workspace)
        self.show_workspace_with_role = bool(show_workspace_with_role)
        self.parent_ids = string_to_list(parent_ids, ",", int)


class MessageIdsPath(object):
    def __init__(self, event_id: int, user_id: int):
        self.event_id = event_id
        self.user_id = user_id


class WorkspaceFilterQuerySchema(marshmallow.Schema):
    parent_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="0,4,5",
        description="comma separated list of parent ids,"
        " parent_id allow to filter workspaces."
        " If not parent_ids at all, then return all workspaces."
        " If one parent_id to 0, then return root workspaces."
        " If set to another value, return all direct subworkspaces"
        " If multiple value of parent_ids separated by comma,"
        " return mix of all workspaces of all theses parent_ids",
        default="0",
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return WorkspaceFilterQuery(**data)


class UserWorkspaceFilterQuerySchema(WorkspaceFilterQuerySchema):
    show_owned_workspace = marshmallow.fields.Int(
        example=1,
        default=1,
        description="if set to 1, then show owned workspace in list"
        " Default is 1, else do no show them",
        validate=bool_as_int_validator,
    )
    show_workspace_with_role = marshmallow.fields.Int(
        example=1,
        default=1,
        description="if set to 1, then show workspace were user as a role in list"
        " Default is 1, else do no show them",
        validate=bool_as_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return UserWorkspaceFilterQuery(**data)


class WorkspaceMemberFilterQuery(object):
    def __init__(self, show_disabled_user: int = 0):
        self.show_disabled_user = bool(show_disabled_user)


class WorkspaceMemberFilterQuerySchema(marshmallow.Schema):
    show_disabled_user = marshmallow.fields.Int(
        exemple=0,
        default=0,
        description="if set to 1, then show also user which is disabled"
        " Default is 0, else show them",
        validate=bool_as_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return WorkspaceMemberFilterQuery(**data)


class WorkspaceIdSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(
        example=4,
        required=True,
        description="id of a valid workspace",
        validate=strictly_positive_int_validator,
    )


class WorkspaceIdPathSchema(WorkspaceIdSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return WorkspacePath(**data)


class RadicaleUserSubItemPathSchema(RadicaleSubItemPathSchema, UserIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return RadicaleUserSubitemsPath(**data)


class RadicaleWorkspaceSubItemPathSchema(RadicaleSubItemPathSchema, WorkspaceIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return RadicaleWorkspaceSubitemsPath(**data)


class ContentIdPathSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        example=6,
        required=True,
        description="id of a valid content",
        validate=strictly_positive_int_validator,
    )


class RevisionIdPathSchema(marshmallow.Schema):
    revision_id = marshmallow.fields.Int(example=6, required=True)


class WorkspaceAndUserIdPathSchema(UserIdPathSchema, WorkspaceIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndUserPath(**data)


class WorkspaceAndContentIdPathSchema(WorkspaceIdPathSchema, ContentIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndContentPath(**data)


class FilenamePathSchema(marshmallow.Schema):
    filename = StrippedString("filename.ext")


class WidthAndHeightPathSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(example=256)
    height = marshmallow.fields.Int(example=256)


class AllowedJpgPreviewSizesSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(example=256)
    height = marshmallow.fields.Int(example=256)


class AllowedJpgPreviewDimSchema(marshmallow.Schema):
    restricted = marshmallow.fields.Bool()
    dimensions = marshmallow.fields.Nested(AllowedJpgPreviewSizesSchema, many=True)


class WorkspaceAndContentRevisionIdPathSchema(
    WorkspaceIdPathSchema, ContentIdPathSchema, RevisionIdPathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndContentRevisionPath(**data)


class FilePathSchema(WorkspaceAndContentIdPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FilePath(**data)


class FileRevisionPathSchema(WorkspaceAndContentRevisionIdPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FileRevisionPath(**data)


class FilePreviewSizedPathSchema(
    WorkspaceAndContentIdPathSchema, WidthAndHeightPathSchema, FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return FilePreviewSizedPath(**data)


class FileRevisionPreviewSizedPathSchema(
    WorkspaceAndContentRevisionIdPathSchema, WidthAndHeightPathSchema, FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return RevisionPreviewSizedPath(**data)


class UserWorkspaceAndContentIdPathSchema(
    UserIdPathSchema, WorkspaceIdPathSchema, ContentIdPathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserWorkspaceAndContentPath(**data)


class UserWorkspaceIdPathSchema(UserIdPathSchema, WorkspaceIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceAndUserPath(**data)


class CommentsPathSchema(WorkspaceAndContentIdPathSchema):
    comment_id = marshmallow.fields.Int(
        example=6,
        description="id of a valid comment related to content content_id",
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return CommentPath(**data)


class KnownMembersQuerySchema(marshmallow.Schema):
    acp = StrippedString(example="test", description="search text to query", required=True)

    exclude_user_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="1,5",
        description="comma separated list of excluded users",
    )

    exclude_workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,4",
        description="comma separated list of excluded workspaces: members of this workspace are excluded from the result; cannot be used with include_workspace_ids",
    )

    include_workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,4",
        description="comma separated list of included workspaces: members of this workspace are excluded from the result; cannot be used with exclude_workspace_ids",
    )

    limit = marshmallow.fields.Int(
        example=15,
        default=0,
        description="limit the number of results to this value, if not 0",
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return KnownMembersQuery(**data)


class FileQuerySchema(marshmallow.Schema):
    force_download = marshmallow.fields.Int(
        example=1,
        default=0,
        description="force download of file or let browser decide if"
        "file can be read directly from browser",
        validate=bool_as_int_validator,
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any]) -> object:
        return FileQuery(**data)


class PageQuerySchema(FileQuerySchema):
    page = marshmallow.fields.Int(
        example=2,
        default=1,
        description="allow to show a specific page of a pdf file",
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any]) -> object:
        return PageQuery(**data)


class FilterContentQuerySchema(marshmallow.Schema):
    parent_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="0,4,5",
        description="comma separated list of parent ids,"
        " parent_id allow to filter items in a folder."
        " If not parent_ids at all, then return all contents."
        " If one parent_id to 0, then return root contents."
        " If set to another value, return all direct subcontents"
        " content of this folder"
        " If multiple value of parent_ids separated by comma,"
        " return mix of all content of all theses parent_ids",
        default="0",
    )
    namespaces_filter = StrippedString(
        validate=regex_string_as_list_of_string,
        example="content,upload",
        description="comma list of namespaces allowed",
        default=None,
        allow_none=True,
    )
    complete_path_to_id = marshmallow.fields.Int(
        example=6,
        validate=strictly_positive_int_validator,
        description="If setted with a correct content_id, this will"
        " add to parent_ids filter, all parent of given content_id,"
        " workspace root included. This param help to get "
        " content needed to show a complete folder tree "
        " from root to content.",
        default=None,
        allow_none=True,
    )
    show_archived = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show archived contents."
        " Default is 0 - hide archived content",
        validate=bool_as_int_validator,
    )
    show_deleted = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show deleted contents."
        " Default is 0 - hide deleted content",
        validate=bool_as_int_validator,
    )
    show_active = marshmallow.fields.Int(
        example=1,
        default=1,
        description="if set to 1, then show active contents. "
        "Default is 1 - show active content."
        " Note: active content are content "
        "that is neither archived nor deleted. "
        "The reason for this parameter to exist is for example "
        "to allow to show only archived documents",
        validate=bool_as_int_validator,
    )
    content_type = StrippedString(
        example=content_type_list.Any_SLUG,
        default=content_type_list.Any_SLUG,
        validate=all_content_types_validator,
    )
    label = StrippedString(
        example="myfilename", default=None, allow_none=True, description="Filter by content label"
    )

    @post_load
    def make_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentFilter(**data)


class ActiveContentFilterQuerySchema(marshmallow.Schema):
    limit = marshmallow.fields.Int(
        example=2,
        default=0,
        description="if 0 or not set, return all elements, else return only "
        "the first limit elem (according to offset)",
        validate=strictly_positive_int_validator,
    )
    before_content_id = marshmallow.fields.Int(
        example=41,
        default=None,
        allow_none=True,
        description="return only content updated before this content",
    )

    @post_load
    def make_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return ActiveContentFilter(**data)


class ContentIdsQuerySchema(marshmallow.Schema):
    content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="1,5",
        description="comma separated list of contents ids",
    )

    @post_load
    def make_content_ids(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentIdsQuery(**data)


###


class RoleUpdateSchema(marshmallow.Schema):
    role = StrippedString(required=True, example="contributor", validate=user_role_validator)

    @post_load
    def make_role(self, data: typing.Dict[str, typing.Any]) -> object:
        return RoleUpdate(**data)


class WorkspaceMemberInviteSchema(marshmallow.Schema):
    role = StrippedString(example="contributor", validate=user_role_validator, required=True)
    user_id = marshmallow.fields.Int(example=5, default=None, allow_none=True)
    user_email = marshmallow.fields.Email(
        example="suri@cate.fr", default=None, allow_none=True, validate=user_email_validator
    )
    user_username = StrippedString(
        example="The-John_Doe42", default=None, allow_none=True, validate=user_username_validator
    )

    @post_load
    def make_workspace_member_invite(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceMemberInvitation(**data)

    @marshmallow.validates_schema(pass_original=True)
    def has_user_id_email_or_username(self, data: dict, original_data: dict, **kwargs) -> None:
        if not (
            original_data.get("user_email")
            or original_data.get("user_username")
            or original_data.get("user_id")
        ):
            raise marshmallow.ValidationError("user_id, user_email or user_username required")


class ResetPasswordRequestSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        example="hello@tracim.fr", default=None, allow_none=True, validate=user_email_validator
    )

    username = StrippedString(
        example="The-John_Doe42", default=None, allow_none=True, validate=user_username_validator
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordRequest(**data)

    # TODO 2020-06-11 - RJ: duplicated code across this file
    @marshmallow.validates_schema(pass_original=True)
    def validate_email_and_username(self, data: dict, original_data: dict, **kwargs) -> None:
        if not original_data.get("email") and not original_data.get("username"):
            raise marshmallow.ValidationError("email or username required")


class ResetPasswordCheckTokenSchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=True, example="hello@tracim.fr", validate=user_email_validator
    )
    reset_password_token = String(
        description="token to reset password of given user", required=True
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordCheckToken(**data)


class ResetPasswordModifySchema(marshmallow.Schema):
    email = marshmallow.fields.Email(
        required=True, example="hello@tracim.fr", validate=user_email_validator
    )
    reset_password_token = String(
        description="token to reset password of given user", required=True
    )
    new_password = String(example="8QLa$<w", required=True, validate=user_password_validator)
    new_password2 = String(example="8QLa$<w", required=True, validate=user_password_validator)

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordModify(**data)


class BasicAuthSchema(marshmallow.Schema):

    email = marshmallow.fields.Email(
        example="hello@tracim.fr", required=False, validate=user_email_validator, allow_none=True
    )
    username = String(
        example="My-Power_User99", required=False, validate=user_username_validator, allow_none=True
    )
    password = String(
        example="8QLa$<w", required=True, load_only=True, validate=user_password_validator
    )

    class Meta:
        description = "Entry for HTTP Basic Auth"

    @marshmallow.validates_schema(pass_original=True)
    def validate_email_and_username(self, data: dict, original_data: dict, **kwargs) -> None:
        if not original_data.get("email") and not original_data.get("username"):
            raise marshmallow.ValidationError("email or username required")

    @post_load
    def make_login(self, data: typing.Dict[str, typing.Any]) -> object:
        return LoginCredentials(**data)


class LoginOutputHeaders(marshmallow.Schema):
    expire_after = StrippedString()


class WorkspaceModifySchema(marshmallow.Schema):
    label = StrippedString(
        required=False,
        example="My Workspace",
        validate=not_empty_string_validator,
        default=None,
        allow_none=True,
    )
    description = StrippedString(
        required=False,
        example="A super description of my workspace.",
        default=None,
        allow_none=True,
    )
    agenda_enabled = marshmallow.fields.Bool(
        required=False,
        default=None,
        description="has workspace has an associated agenda ?",
        allow_none=True,
    )
    public_upload_enabled = marshmallow.fields.Bool(
        required=False,
        description="is workspace allowing manager to give access external user"
        "to upload file into it ?",
        default=None,
        allow_none=True,
    )
    public_download_enabled = marshmallow.fields.Bool(
        required=False,
        description="is workspace allowing manager to give access external user"
        "to some file into it ?",
        default=None,
        allow_none=True,
    )
    default_user_role = StrippedString(
        example=WorkspaceRoles.READER.slug,
        description="default role for new users in this workspace",
        validate=user_role_validator,
        required=False,
        allow_none=True,
        default=None,
    )

    @post_load
    def make_workspace_modifications(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceUpdate(**data)


class WorkspaceCreationSchema(marshmallow.Schema):
    label = StrippedString(
        required=True, example="My Workspace", validate=not_empty_string_validator
    )
    description = StrippedString(required=True, example="A super description of my workspace.")
    agenda_enabled = marshmallow.fields.Bool(
        required=False, description="has workspace has an associated agenda ?", default=True
    )
    access_type = StrippedString(
        example=WorkspaceAccessType.CONFIDENTIAL.value,
        validate=workspace_access_type_validator,
        required=True,
    )
    default_user_role = StrippedString(
        description="default role for new users in this workspace",
        example=WorkspaceRoles.READER.slug,
        validate=user_role_validator,
        required=True,
    )
    public_upload_enabled = marshmallow.fields.Bool(
        required=False,
        description="is workspace allowing manager to give access external user"
        "to upload file into it ?",
        default=True,
    )
    public_download_enabled = marshmallow.fields.Bool(
        required=False,
        description="is workspace allowing manager to give access external user"
        "to some file into it ?",
        default=True,
    )
    parent_id = marshmallow.fields.Int(
        example=42,
        description="id of the parent workspace id.",
        allow_none=True,
        default=None,
        required=False,
        validate=positive_int_validator,
    )

    @post_load
    def make_workspace_modifications(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceCreate(**data)


class NoContentSchema(marshmallow.Schema):
    class Meta:
        description = "Empty Schema"

    pass


class WorkspaceMenuEntrySchema(marshmallow.Schema):
    slug = StrippedString(example="markdown-pages")
    label = StrippedString(example="Markdown Documents")
    route = StrippedString(
        example="/ui/workspaces/{workspace_id}/agenda",
        description="the route is the frontend route. "
        "It may include workspace_id "
        "which must be replaced on backend size "
        "(the route must be ready-to-use)",
    )
    fa_icon = StrippedString(
        example="file-text-o",
        description="CSS class of the icon. Example: file-o for using Fontawesome file-text-o icon",
    )
    hexcolor = StrippedString(example="#F0F9DC", description="Hexadecimal color of the entry.")

    class Meta:
        description = "Entry element of a workspace menu"


class WorkspaceDigestSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    slug = StrippedString(example="intranet")
    label = StrippedString(example="Intranet")


class WorkspaceSchema(WorkspaceDigestSchema):
    access_type = StrippedString(
        example=WorkspaceAccessType.CONFIDENTIAL.value,
        validate=workspace_access_type_validator,
        required=True,
    )
    default_user_role = StrippedString(
        example=WorkspaceRoles.READER.slug,
        validate=user_role_validator,
        required=True,
        description="default role for new users in this workspace",
    )
    description = StrippedString(example="All intranet data.")
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Workspace creation date"
    )
    owner = marshmallow.fields.Nested(UserDigestSchema(), allow_none=True)
    sidebar_entries = marshmallow.fields.Nested(WorkspaceMenuEntrySchema, many=True)
    is_deleted = marshmallow.fields.Bool(example=False, default=False)
    agenda_enabled = marshmallow.fields.Bool(example=True, default=True)
    public_upload_enabled = marshmallow.fields.Bool(
        description="is workspace allowing manager to give access external user"
        "to upload file into it ?",
        default=True,
    )
    public_download_enabled = marshmallow.fields.Bool(
        description="is workspace allowing manager to give access external user"
        "to some file into it ?",
        default=True,
    )
    parent_id = marshmallow.fields.Int(
        example=42,
        description="id of the parent workspace id.",
        allow_none=True,
        required=True,
        validate=positive_int_validator,
    )

    class Meta:
        description = "Full workspace information"


class UserConfigSchema(marshmallow.Schema):
    parameters = marshmallow.fields.Dict(
        description="parameters present in the user's configuration."
    )


class UserCustomPropertiesSchema(marshmallow.Schema):
    json_schema = marshmallow.fields.Dict(
        description="json schema used for user custom properties", required=True, allow_none=False
    )


class UserCustomPropertiesUiSchema(marshmallow.Schema):
    ui_schema = marshmallow.fields.Dict(
        description="ui schema used for user custom properties", required=True, allow_none=False,
    )


class WorkspaceDiskSpaceSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    used_space = marshmallow.fields.Int(
        description="used space in the workspace in bytes."
        "if owner allowed space limit or  workspace allowed_space limit is reach,"
        "no file can be created/updated in this workspace."
    )
    allowed_space = marshmallow.fields.Int(
        description="allowed space in workspace in bytes. "
        "if limit is reach, no file can be created/updated "
        "in any user owned workspaces. 0 mean no limit."
    )
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema(), attribute="workspace_in_context")


class WorkspaceMemberDigestSchema(marshmallow.Schema):
    role = StrippedString(example="contributor", validate=user_role_validator)
    do_notify = marshmallow.fields.Bool(
        description="has user enabled notification for this workspace", example=True
    )


class WorkspaceMemberSchema(WorkspaceMemberDigestSchema):
    user_id = marshmallow.fields.Int(example=3, validate=strictly_positive_int_validator)
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    is_active = marshmallow.fields.Bool()
    user = marshmallow.fields.Nested(UserDigestSchema())
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema(exclude=("sidebar_entries",)))

    class Meta:
        description = "Workspace Member information"


class WorkspaceMemberCreationSchema(WorkspaceMemberSchema):
    newly_created = marshmallow.fields.Bool(
        exemple=False,
        description="Is the user completely new " "(and account was just created) or not ?",
    )
    email_sent = marshmallow.fields.Bool(
        exemple=False,
        description="Has an email been sent to user to inform him about "
        "this new workspace registration and eventually his account"
        "creation",
    )


class TimezoneSchema(marshmallow.Schema):
    name = StrippedString(example="Europe/London")


class WorkspaceAccessTypeSchema(marshmallow.Schema):
    items = marshmallow.fields.List(String(example="confidential"), required=True)


class GetUsernameAvailability(marshmallow.Schema):
    username = StrippedString(example="The-powerUser_42", required=True)


class UsernameAvailability(marshmallow.Schema):
    username = StrippedString(example="The-powerUser_42", required=True)
    available = marshmallow.fields.Boolean(required=True)


class AboutSchema(marshmallow.Schema):
    name = StrippedString(example="Tracim", description="Software name")
    version = StrippedString(example="2.6", description="Version of Tracim")
    build_version = StrippedString(
        example="release_02.06.00", description="Build Version of Tracim"
    )
    datetime = marshmallow.fields.DateTime(format=DATETIME_FORMAT)
    website = marshmallow.fields.URL()


class ReservedUsernamesSchema(marshmallow.Schema):
    items = marshmallow.fields.List(String(example="all"), required=True)


class ErrorCodeSchema(marshmallow.Schema):
    name = marshmallow.fields.Str()
    code = marshmallow.fields.Int()


class ApplicationSchema(marshmallow.Schema):
    label = StrippedString(example="Agenda")
    slug = StrippedString(example="agenda")
    fa_icon = StrippedString(
        example="file-o",
        description="CSS class of the icon. Example: file-o for using Fontawesome file-o icon",
    )
    hexcolor = StrippedString(
        example="#FF0000",
        description="HTML encoded color associated to the application. Example:#FF0000 for red",
    )
    is_active = marshmallow.fields.Boolean(
        example=True, description="if true, the application is in use in the context"
    )
    config = marshmallow.fields.Dict()

    class Meta:
        description = "Tracim Application informations"


class StatusSchema(marshmallow.Schema):
    slug = StrippedString(
        example="open",
        description="the slug represents the type of status. "
        "Statuses are open, closed-validated, closed-invalidated, closed-deprecated",
    )
    global_status = StrippedString(
        example="open",
        description="global_status: open, closed",
        validate=content_global_status_validator,
    )
    label = StrippedString(example="Opened")
    fa_icon = StrippedString(example="fa-check")
    hexcolor = StrippedString(example="#0000FF")


class ContentTypeSchema(marshmallow.Schema):
    slug = StrippedString(example="pagehtml", validate=all_content_types_validator)
    fa_icon = StrippedString(
        example="fa-file-text-o",
        description="CSS class of the icon. Example: file-o for using Fontawesome file-o icon",
    )
    hexcolor = StrippedString(
        example="#FF0000",
        description="HTML encoded color associated to the application. Example:#FF0000 for red",
    )
    label = StrippedString(example="Notes")
    creation_label = StrippedString(example="Write a note")
    available_statuses = marshmallow.fields.Nested(StatusSchema, many=True)


class ContentMoveSchema(marshmallow.Schema):
    # TODO - G.M - 30-05-2018 - Read and apply this note
    # Note:
    # if the new workspace is different, then the backend
    # must check if the user is allowed to move to this workspace
    # (the user must be content manager of both workspaces)
    new_parent_id = marshmallow.fields.Int(
        example=42,
        description="id of the new parent content id.",
        allow_none=True,
        required=True,
        validate=positive_int_validator,
    )
    new_workspace_id = marshmallow.fields.Int(
        example=2,
        description="id of the new workspace id.",
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_move_params(self, data: typing.Dict[str, typing.Any]) -> object:
        return MoveParams(**data)


class ContentCreationSchema(marshmallow.Schema):
    label = StrippedString(
        required=True,
        example="contract for client XXX",
        description="Title of the content to create",
        validate=not_empty_string_validator,
    )
    content_type = StrippedString(
        required=True, example="html-document", validate=all_content_types_validator
    )
    parent_id = marshmallow.fields.Integer(
        example=35,
        description="content_id of parent content, if content should be placed "
        "in a folder, this should be folder content_id.",
        allow_none=True,
        default=None,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_content_creation(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentCreation(**data)


class ContentMinimalSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    label = StrippedString(example="Intervention Report 12")
    slug = StrippedString(example="intervention-report-12")
    content_type = StrippedString(example="html-document", validate=all_content_types_validator)


class ContentDigestSchema(marshmallow.Schema):
    content_namespace = marshmallow.fields.String(example="content")
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    current_revision_id = marshmallow.fields.Int(example=12)
    current_revision_type = StrippedString(
        example=ActionDescription.CREATION, validate=action_description_validator
    )
    slug = StrippedString(example="intervention-report-12")
    parent_id = marshmallow.fields.Int(
        example=34, allow_none=True, default=None, validate=positive_int_validator
    )
    workspace_id = marshmallow.fields.Int(example=19, validate=strictly_positive_int_validator)
    label = StrippedString(example="Intervention Report 12")
    content_type = StrippedString(example="html-document", validate=all_content_types_validator)
    sub_content_types = marshmallow.fields.List(
        StrippedString(example="html-content", validate=all_content_types_validator),
        description="list of content types allowed as sub contents. "
        "This field is required for folder contents, "
        "set it to empty list in other cases",
    )
    status = StrippedString(
        example="closed-deprecated",
        validate=content_status_validator,
        description="this slug is found in content_type available statuses",
        default=open_status,
    )
    is_archived = marshmallow.fields.Bool(example=False, default=False)
    is_deleted = marshmallow.fields.Bool(example=False, default=False)
    is_editable = marshmallow.fields.Bool(example=True, default=True)
    show_in_ui = marshmallow.fields.Bool(
        example=True,
        description="if false, then do not show content in the treeview. "
        "This may his maybe used for specific contents or "
        "for sub-contents. Default is True. "
        "In first version of the API, this field is always True",
    )
    file_extension = StrippedString(example=".txt")
    filename = StrippedString(example="nameofthefile.txt")
    modified = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description="date of last modification of content."
        " note: this does not include comments or any subcontents.",
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Content creation date"
    )
    actives_shares = marshmallow.fields.Int(
        description="number of active share on file", validate=positive_int_validator
    )


class ReadStatusSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    read_by_user = marshmallow.fields.Bool(example=False, default=False)


#####
# Content
#####


class ContentSchema(ContentDigestSchema):
    author = marshmallow.fields.Nested(UserDigestSchema)
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)


class TextBasedDataAbstractSchema(marshmallow.Schema):
    raw_content = StrippedString(
        required=True,
        description="Content of the object, may be raw text or <b>html</b> for example",
    )


class FileInfoAbstractSchema(marshmallow.Schema):
    raw_content = StrippedString(description="raw text or html description of the file")
    page_nb = marshmallow.fields.Int(
        description="number of pages, return null value if unaivalable", example=1, allow_none=True
    )
    mimetype = StrippedString(
        description="file content mimetype", example="image/jpeg", required=True
    )
    size = marshmallow.fields.Int(
        description="file size in byte, return null value if unaivalable",
        example=1024,
        allow_none=True,
    )
    has_pdf_preview = marshmallow.fields.Bool(
        description="true if a pdf preview is available or false", example=True
    )
    has_jpeg_preview = marshmallow.fields.Bool(
        description="true if a jpeg preview is available or false", example=True
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
        marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    )
    revision_id = marshmallow.fields.Int(example=12, validate=strictly_positive_int_validator)
    revision_type = StrippedString(
        example=ActionDescription.CREATION, validate=action_description_validator
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Content creation date"
    )
    author = marshmallow.fields.Nested(UserDigestSchema)


class TextBasedRevisionSchema(RevisionSchema, TextBasedDataAbstractSchema):
    pass


class FileRevisionSchema(RevisionSchema, FileInfoAbstractSchema):
    pass


class CollaborativeDocumentEditionConfigSchema(marshmallow.Schema):
    software = marshmallow.fields.String()
    supported_file_types = marshmallow.fields.List(
        marshmallow.fields.Nested(CollaborativeFileTypeSchema())
    )


class CommentSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    parent_id = marshmallow.fields.Int(example=34, validate=positive_int_validator)
    content_type = StrippedString(example="html-document", validate=all_content_types_validator)
    parent_content_type = String(example="html-document", validate=all_content_types_validator)
    parent_label = String(example="This is a label")
    raw_content = StrippedString(example="<p>This is just an html comment !</p>")
    author = marshmallow.fields.Nested(UserDigestSchema)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="comment creation date"
    )


class SetCommentSchema(marshmallow.Schema):
    raw_content = StrippedString(
        example="<p>This is just an html comment !</p>",
        validate=not_empty_string_validator,
        required=True,
    )

    @post_load()
    def create_comment(self, data: typing.Dict[str, typing.Any]) -> object:
        return CommentCreation(**data)


class ContentModifyAbstractSchema(marshmallow.Schema):
    label = StrippedString(
        required=True,
        example="contract for client XXX",
        description="New title of the content",
        validate=not_empty_string_validator,
    )


class TextBasedContentModifySchema(ContentModifyAbstractSchema, TextBasedDataAbstractSchema):
    @post_load
    def text_based_content_update(self, data: typing.Dict[str, typing.Any]) -> object:
        return TextBasedContentUpdate(**data)


class FolderContentModifySchema(ContentModifyAbstractSchema, TextBasedDataAbstractSchema):
    sub_content_types = marshmallow.fields.List(
        StrippedString(example="html-document", validate=all_content_types_validator),
        description="list of content types allowed as sub contents. "
        "This field is required for folder contents, "
        "set it to empty list in other cases",
        required=True,
    )

    @post_load
    def folder_content_update(self, data: typing.Dict[str, typing.Any]) -> object:
        return FolderContentUpdate(**data)


class FileContentModifySchema(TextBasedContentModifySchema):
    pass


class SetContentStatusSchema(marshmallow.Schema):
    status = StrippedString(
        example="closed-deprecated",
        validate=content_status_validator,
        description="this slug is found in content_type available statuses",
        default=open_status,
        required=True,
    )

    @post_load
    def set_status(self, data: typing.Dict[str, typing.Any]) -> object:
        return SetContentStatus(**data)


class ConfigSchema(marshmallow.Schema):
    email_notification_activated = marshmallow.fields.Bool()
    new_user_invitation_do_notify = marshmallow.fields.Bool()
    webdav_enabled = marshmallow.fields.Bool()
    webdav_url = marshmallow.fields.String()
    collaborative_document_edition = marshmallow.fields.Nested(
        CollaborativeDocumentEditionConfigSchema(), allow_none=True
    )
    content_length_file_size_limit = marshmallow.fields.Integer()
    workspace_size_limit = marshmallow.fields.Integer()
    workspaces_number_per_user_limit = marshmallow.fields.Integer()
    instance_name = marshmallow.fields.String()
    email_required = marshmallow.fields.Bool()


class EventSchema(marshmallow.Schema):
    """Event structure transmitted to workers."""

    fields = marshmallow.fields.Dict()
    event_id = marshmallow.fields.Int(example=42, validate=strictly_positive_int_validator)
    operation = marshmallow.fields.String(validator=OneOf(OperationType.values()))
    entity_type = marshmallow.fields.String(validator=OneOf(EntityType.values()))
    created = marshmallow.fields.DateTime()

    @marshmallow.post_load
    def strings_to_enums(self, item):
        item["operation"] = OperationType(item["operation"])
        item["entity_type"] = EntityType(item["entity_type"])
        return item


class LiveMessageSchema(marshmallow.Schema):
    """Message for the user."""

    fields = marshmallow.fields.Dict()
    event_id = marshmallow.fields.Int(example=42, validate=strictly_positive_int_validator)
    event_type = marshmallow.fields.String(example="content.modified")
    created = marshmallow.fields.DateTime(format=DATETIME_FORMAT, description="created date")
    read = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="read date", allow_none=True
    )


class BasePaginatedSchemaPage(marshmallow.Schema):
    previous_page_token = marshmallow.fields.String()
    next_page_token = marshmallow.fields.String()
    has_next = marshmallow.fields.Bool()
    has_previous = marshmallow.fields.Bool()
    per_page = marshmallow.fields.Int()


class LiveMessageSchemaPage(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(LiveMessageSchema, many=True)


class ContentPathInfoSchema(marshmallow.Schema):
    items = marshmallow.fields.Nested(ContentMinimalSchema, many=True)


class BasePaginatedQuerySchema(marshmallow.Schema):
    """Base query parameters for a paginated query"""

    count = marshmallow.fields.Int(
        example=10,
        validate=strictly_positive_int_validator,
        missing=DEFAULT_NB_ITEM_PAGINATION,
        default=DEFAULT_NB_ITEM_PAGINATION,
        allow_none=False,
    )
    page_token = marshmallow.fields.String(
        description="token of the page wanted, if not provided get first" "elements",
        validate=page_token_validator,
    )


class GetLiveMessageQuerySchema(BasePaginatedQuerySchema):
    """Possible query parameters for the GET messages endpoint."""

    read_status = StrippedString(missing=ReadStatus.ALL.value, validator=OneOf(ReadStatus.values()))
    include_event_types = EventTypeListField()
    exclude_event_types = EventTypeListField()
    exclude_author_ids = ExcludeAuthorIdsField
    include_not_sent = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show not sent message."
        " Default is 0 - hide not sent message content",
        validate=bool_as_int_validator,
    )
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,4",
        description="comma separated list of workspaces ids for event: events unrelated to theses workspaces are not included",
    )
    related_to_content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,4",
        description="comma separated list of content_ids for event: events unrelated to these content are not included."
        "event of content itself or of direct children will be provided.",
    )

    @post_load
    def live_message_query(self, data: typing.Dict[str, typing.Any]) -> LiveMessageQuery:
        return LiveMessageQuery(**data)


class TracimLiveEventHeaderSchema(marshmallow.Schema):
    # TODO - G.M - 2020-05-14 - Add Filtering for text/event-stream mimetype with accept header,
    #  see: https://github.com/tracim/tracim/issues/3042
    accept = marshmallow.fields.String(required=True, load_from="Accept", dump_to="Accept")


class TracimLiveEventQuerySchema(marshmallow.Schema):
    after_event_id = marshmallow.fields.Int(
        required=False, missing=0, example=42, validator=positive_int_validator
    )


# INFO - G.M - 2020-05-19 - This is only used for documentation
class PathSuffixSchema(marshmallow.Schema):
    path_suffix = marshmallow.fields.Str(
        required=False,
        description='any path, could include "/"',
        default="",
        example="/workspaces/1/notifications/activate",
    )


class UserMessagesSummaryQuerySchema(marshmallow.Schema):
    """Possible query parameters for the GET messages summary endpoint."""

    exclude_event_types = EventTypeListField()
    include_event_types = EventTypeListField()
    include_not_sent = marshmallow.fields.Int(
        example=0,
        default=0,
        description="if set to 1, then show not sent message."
        " Default is 0 - hide not sent message content",
        validate=bool_as_int_validator,
    )
    exclude_author_ids = ExcludeAuthorIdsField
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,4",
        description="comma separated list of workspaces ids for event: events unrelated to theses workspaces are not included",
    )
    related_to_content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,4",
        description="comma separated list of content_ids for event: events unrelated to these content are not included."
        "event of content itself or of direct children will be provided.",
    )

    @post_load
    def message_summary_query(self, data: typing.Dict[str, typing.Any]) -> UserMessagesSummaryQuery:
        return UserMessagesSummaryQuery(**data)


class UserMessagesSummarySchema(marshmallow.Schema):
    messages_count = marshmallow.fields.Int(example=42)
    read_messages_count = marshmallow.fields.Int(example=30)
    unread_messages_count = marshmallow.fields.Int(example=12)
    user_id = marshmallow.fields.Int(example=3, validate=strictly_positive_int_validator)
    user = marshmallow.fields.Nested(UserDigestSchema())


class WorkspaceSubscriptionSchema(marshmallow.Schema):
    state = StrippedString(
        example="pending", validate=workspace_subscription_state_validator, attribute="state_slug"
    )
    created_date = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="subscription creation date"
    )
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema())
    author = marshmallow.fields.Nested(UserDigestSchema())
    evaluation_date = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="evaluation date", allow_none=True
    )
    evaluator = marshmallow.fields.Nested(UserDigestSchema(), allow_none=True)


class UserIdSchema(marshmallow.Schema):
    """
    Simple user id schema
    """

    user_id = marshmallow.fields.Int(example=3, required=True)


class GetUserFollowQuerySchema(BasePaginatedQuerySchema):
    """Possible query parameters for the GET following and followers endpoint."""

    user_id = marshmallow.fields.Int(
        example=42, validate=strictly_positive_int_validator, allow_none=True, default=None
    )

    @post_load
    def user_follow_query(self, data: typing.Dict[str, typing.Any]) -> UserFollowQuery:
        return UserFollowQuery(**data)


class FollowedUsersSchemaPage(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(UserIdSchema, many=True)


class DeleteFollowedUserPathSchema(UserIdPathSchema):
    leader_id = marshmallow.fields.Int(
        example=4,
        required=True,
        description="id of a valid user",
        validate=strictly_positive_int_validator,
    )


class PublicUserProfileSchema(marshmallow.Schema):
    followers_count = marshmallow.fields.Int(
        example=42,
        required=True,
        description="count of users following this user",
        validate=positive_int_validator,
    )
    following_count = marshmallow.fields.Int(
        example=42,
        required=True,
        description="count of users followed by this user",
        validate=positive_int_validator,
    )
