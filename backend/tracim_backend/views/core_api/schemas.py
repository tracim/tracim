# coding=utf-8
from enum import Enum
import marshmallow
from marshmallow import post_load
from marshmallow.fields import Email
from marshmallow.fields import Field
from marshmallow.fields import String
from marshmallow.fields import ValidatedField
from marshmallow.validate import OneOf
import typing

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.app_models.contents import open_status
from tracim_backend.app_models.email_validators import RFCEmailValidator
from tracim_backend.app_models.email_validators import TracimEmailValidator
from tracim_backend.app_models.validator import action_description_validator
from tracim_backend.app_models.validator import all_content_types_validator
from tracim_backend.app_models.validator import bool_as_int_validator
from tracim_backend.app_models.validator import content_global_status_validator
from tracim_backend.app_models.validator import content_label_length_validator
from tracim_backend.app_models.validator import content_status_validator
from tracim_backend.app_models.validator import not_empty_string_validator
from tracim_backend.app_models.validator import page_token_validator
from tracim_backend.app_models.validator import positive_int_validator
from tracim_backend.app_models.validator import reaction_value_length_validator
from tracim_backend.app_models.validator import regex_string_as_list_of_int
from tracim_backend.app_models.validator import regex_string_as_list_of_string
from tracim_backend.app_models.validator import strictly_positive_int_validator
from tracim_backend.app_models.validator import tag_length_validator
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
from tracim_backend.app_models.validator import workspace_label_length_validator
from tracim_backend.app_models.validator import workspace_subscription_state_validator
from tracim_backend.lib.translate.translator import AUTODETECT_LANG
from tracim_backend.lib.utils.utils import DATETIME_FORMAT
from tracim_backend.lib.utils.utils import DEFAULT_NB_ITEM_PAGINATION
from tracim_backend.lib.utils.utils import string_to_list
from tracim_backend.models.auth import AuthType
from tracim_backend.models.call import UserCallState
from tracim_backend.models.context_models import CommentCreation
from tracim_backend.models.context_models import CommentPath
from tracim_backend.models.context_models import CommentPathFilename
from tracim_backend.models.context_models import ContentAndUserPath
from tracim_backend.models.context_models import ContentCreation
from tracim_backend.models.context_models import ContentFilter
from tracim_backend.models.context_models import ContentIdsQuery
from tracim_backend.models.context_models import ContentNamespaceUpdate
from tracim_backend.models.context_models import ContentUpdate
from tracim_backend.models.context_models import FileCreation
from tracim_backend.models.context_models import FilePath
from tracim_backend.models.context_models import FilePreviewSizedPath
from tracim_backend.models.context_models import FileQuery
from tracim_backend.models.context_models import FileRevisionPath
from tracim_backend.models.context_models import FolderContentUpdate
from tracim_backend.models.context_models import KnownContentsQuery
from tracim_backend.models.context_models import KnownMembersQuery
from tracim_backend.models.context_models import LiveMessageQuery
from tracim_backend.models.context_models import LoginCredentials
from tracim_backend.models.context_models import MoveParams
from tracim_backend.models.context_models import PageQuery
from tracim_backend.models.context_models import RadicaleUserResourceUserSubitemsPath
from tracim_backend.models.context_models import RadicaleUserResourceWorkspaceSubitemsPath
from tracim_backend.models.context_models import RadicaleUserSubitemsPath
from tracim_backend.models.context_models import RadicaleWorkspaceSubitemsPath
from tracim_backend.models.context_models import ReactionCreation
from tracim_backend.models.context_models import ReactionPath
from tracim_backend.models.context_models import ResetPasswordCheckToken
from tracim_backend.models.context_models import ResetPasswordModify
from tracim_backend.models.context_models import ResetPasswordRequest
from tracim_backend.models.context_models import RevisionPreviewSizedPath
from tracim_backend.models.context_models import RoleUpdate
from tracim_backend.models.context_models import SetContentIsTemplate
from tracim_backend.models.context_models import SetContentStatus
from tracim_backend.models.context_models import SetEmail
from tracim_backend.models.context_models import SetPassword
from tracim_backend.models.context_models import SetUsername
from tracim_backend.models.context_models import SimpleFile
from tracim_backend.models.context_models import TagCreation
from tracim_backend.models.context_models import TagPath
from tracim_backend.models.context_models import TranslationQuery
from tracim_backend.models.context_models import UserAllowedSpace
from tracim_backend.models.context_models import UserCreation
from tracim_backend.models.context_models import UserFollowQuery
from tracim_backend.models.context_models import UserInfos
from tracim_backend.models.context_models import UserMessagesMarkAsReadQuery
from tracim_backend.models.context_models import UserMessagesSummaryQuery
from tracim_backend.models.context_models import UserPicturePath
from tracim_backend.models.context_models import UserPreviewPicturePath
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
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import ContentSortOrder
from tracim_backend.models.data import EmailNotificationType
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import EventTypeDatabaseParameters
from tracim_backend.models.event import OperationType
from tracim_backend.models.event import ReadStatus
from tracim_backend.models.roles import WorkspaceRoles

FIELD_LANG_DESC = "User langage in ISO 639 format. " "See https://fr.wikipedia.org/wiki/ISO_639"
FIELD_PROFILE_DESC = "Profile of the user. The profile is Tracim wide."
FIELD_TIMEZONE_DESC = "Timezone as in tz database format"
DEFAULT_KNOWN_CONTENT_NB_LIMIT = 15


class StrippedString(String):
    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        return value.strip()


class StringList(marshmallow.fields.List):
    """
    This Field validates a list of elements the given field validates.
    The Field is deserialized into a Python list.
    The Field is serialized into a string with the Field's separated with the given separator.
    """

    def __init__(self, cls: typing.Type[Field], separator: str = ",", **kwargs: dict) -> None:
        super().__init__(cls, **kwargs)
        self._separator = separator

    def _deserialize(self, value: str, *args: typing.Any, **kwargs: typing.Any):
        value = value.strip()
        if value:
            return super()._deserialize(value.split(self._separator), *args, **kwargs)

        return super()._deserialize([], *args, **kwargs)

    def _serialize(self, *args: typing.Any, **kwargs: typing.Any) -> str:
        return self._separator.join(super()._serialize(*args, **kwargs))


class EnumField(marshmallow.fields.Field):
    """
    This Field validates elements found in an Enum.
    The serialized value of this Field is the value of an enum field of the given Enum.
    The deserialized value of this Field an enum field.
    """

    def __init__(self, enum_cls: typing.Type[Enum], **kwargs):
        super().__init__(**kwargs)
        self._enum = enum_cls

    def _deserialize(self, value: typing.Any, *arg: typing.Any, **kwargs: typing.Any) -> Enum:
        try:
            return self._enum(value)
        except ValueError:
            raise marshmallow.ValidationError(
                "'{}' is not a valid value for this field. Allowed values: {}".format(
                    value, [val.value for val in self._enum.__members__.values()]
                )
            )

    def _serialize(
        self, value: typing.Union[Enum, str], *arg: typing.Any, **kwargs: typing.Any
    ) -> typing.Any:
        # INFO - G.M - 2021-07-08 -
        # EnumField support both Enum and valid string corresponding to enum
        # Both are serialized enum value.
        if isinstance(value, Enum):
            if value not in (elem for elem in self._enum):
                raise marshmallow.ValidationError(
                    "'{}' is not a valid value for this field".format(value)
                )
            return value.value
        elif isinstance(value, str):
            try:
                return self._enum(value).value
            except Exception:
                raise marshmallow.ValidationError(
                    "'{}' is not a valid value for this field".format(value)
                )
        else:
            raise marshmallow.ValidationError(
                "'{}' is not a valid type for this field".format(value)
            )


class RestrictedStringField(marshmallow.fields.String):
    """
    This Field validates elements found in a Python list.
    The serialized value and the deserialized value are elements of this list.
    Serialization and deserialization fail for values that do not belong to this list.
    """

    def __init__(self, allowed_strings: typing.Container[str], **kwargs):
        super().__init__(**kwargs)
        self._allowed_strings = allowed_strings

    def _deserialize(self, value: str, *arg: typing.Any, **kwargs: typing.Any) -> str:
        if value in self._allowed_strings:
            return value

        self.error(value)

    def _serialize(self, value: str, *arg: typing.Any, **kwargs: typing.Any) -> str:
        if value not in self._allowed_strings:
            self.error(value)

        return value

    def error(self, value: str) -> "typing.NoReturn":
        raise marshmallow.ValidationError(
            "'{}' is not a valid value for this field. Allowed values: {}".format(
                value, self._allowed_strings
            )
        )


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


class TracimEmail(Email):
    def __init__(self, *args, **kwargs):
        String.__init__(self, *args, **kwargs)
        # Insert validation into self.validators so that multiple errors can be stored.
        self.validators = [TracimEmailValidator(error=self.error_messages["invalid"])] + list(
            self.validators
        )

    def _validated(self, value):
        if value is None:
            return None
        return TracimEmailValidator(error=self.error_messages["invalid"])(value)

    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        return value.strip()


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

    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        return value.strip()


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
        missing=None,
    )


class BaseOptionalPaginatedQuerySchema(marshmallow.Schema):
    """Base query parameter for an API which allows pagination
    but returns all the results by default."""

    count = marshmallow.fields.Int(
        example=10,
        validate=positive_int_validator,
        missing=0,
        default=0,
        allow_none=False,
        description="Allows to paginate the results in combination with page_token, by default all results are returned",
    )
    page_token = marshmallow.fields.String(
        description="token of the page wanted, if not provided get first elements",
        validate=page_token_validator,
        missing=None,
        default=None,
    )


class BasePaginatedSchemaPage(marshmallow.Schema):
    previous_page_token = marshmallow.fields.String()
    next_page_token = marshmallow.fields.String()
    has_next = marshmallow.fields.Bool()
    has_previous = marshmallow.fields.Bool()
    per_page = marshmallow.fields.Int()


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
    content_namespace = EnumField(
        ContentNamespaces, missing=ContentNamespaces.CONTENT, example="content"
    )
    content_type = marshmallow.fields.String(
        missing=ContentTypeSlug.FILE.value, example=ContentTypeSlug.FILE.value
    )
    template_id = marshmallow.fields.Int(
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
    has_avatar = marshmallow.fields.Bool(
        description="Does the user have an avatar? avatar need to be obtain with /avatar endpoint"
    )
    has_cover = marshmallow.fields.Bool(
        description="Does the user have a cover? cover need to be obtain with /cover endpoint"
    )
    public_name = StrippedString(example="John Doe")
    username = StrippedString(
        example="My-Power_User99", required=False, default=None, allow_none=True
    )
    workspace_ids = marshmallow.fields.List(marshmallow.fields.Int(example=3))
    is_active = marshmallow.fields.Bool()


class AppCustomActionsSchema(marshmallow.Schema):
    icon_text = marshmallow.fields.String(
        required=True,
        description="Icon of the custom action. If set, icon_image must be set to empty string.",
        example="fas fa-pencil-alt",
    )
    icon_image = marshmallow.fields.String(
        required=True,
        description="Image of the custom action. If set, icon_text must be set to empty string.",
        example="https://www.tracim.fr/static/images/new_tracim/LOGO_TRACIM_RVB_1.png",
    )
    label = marshmallow.fields.Dict(
        required=True,
        description="The visible text displayed in the custom action. Set each labels related to its language key",
        example='{"fr": "My string"}',
    )
    link = marshmallow.fields.String(
        required=True,
        description="The action associated with the button",
        example="https://www.tracim.fr/static/images/new_tracim/LOGO_TRACIM_RVB_1.png",
    )
    content_type_filter = marshmallow.fields.String(
        required=False,
        description="A list comma separated of content types on which the custom action will apply",
        example="file,thread,kanban",
    )
    content_extension_filter = marshmallow.fields.String(
        required=False,
        description="A list comma separated of content extensions on which the custom action will apply",
        example=".jpg,.png,.gif",
    )
    content_label_regex_filter = marshmallow.fields.String(
        required=False,
        description="A regex string for content label pattern matching on which the custom action will apply",
        example="my_pattern",
    )
    user_role_filter = marshmallow.fields.String(
        required=False,
        description="A list comma separated of user's role for whom the custom action will apply",
        example="workspace-manager,content-manager,contributor",
    )
    user_profile_filter = marshmallow.fields.String(
        required=False,
        description="A list comma separated of user's profiles for whom the custom action will apply",
        example="administrators,trusted-users,users",
    )
    workspace_id_filter = marshmallow.fields.String(
        required=False,
        description="A list comma separated of workspace id on which the custom action will apply",
        example="1,10,222",
    )


class AppCustomActionLocationSchema(marshmallow.Schema):
    user_sidebar_dropdown = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema), description="NYI"
    )
    user_sidebar_shortcuts = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema), description="NYI"
    )
    content_in_list_dropdown = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema),
        description="Custom action placed in the dropdown on content in the workspace content list",
    )
    content_app_dropdown = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema),
        description="Custom action placed in the header dropdown of content apps",
    )
    space_dashboard_action_list = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema), description="NYI"
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

    email = TracimEmail(required=False, example="hello@tracim.fr", allow_none=True)
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
        example=False,
        description="true if the user account has been deleted. " "Default is false",
    )
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = StrippedString(
        description=FIELD_TIMEZONE_DESC,
        example="Europe/Paris",
        validate=user_timezone_validator,
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
        required=True,
        example={"param1": "value1"},
        description="custom_properties schema",
    )


class SetEmailSchema(LoggedInUserPasswordSchema):
    email = TracimEmail(required=True, example="hello@tracim.fr", validate=user_email_validator)

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
        example="John Doe",
        required=False,
        validate=user_public_name_validator,
        default=None,
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


class UserRegistrationSchema(marshmallow.Schema):
    email = TracimEmail(
        required=True,
        example="hello@tracim.fr",
        validate=user_email_validator,
        allow_none=True,
    )
    username = String(
        required=False,
        example="My-Power_User99",
        validate=user_username_validator,
        allow_none=True,
    )
    password = String(
        example="8QLa$<w",
        required=True,
        validate=user_password_validator,
        allow_none=True,
        default=None,
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
        required=True,
        default=None,
        validate=user_public_name_validator,
    )
    lang = StrippedString(
        description=FIELD_LANG_DESC,
        example="en",
        required=False,
        validate=user_lang_validator,
        allow_none=True,
        default=None,
    )

    @post_load
    def register_user(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserCreation(**data)


class UserCreationSchema(marshmallow.Schema):
    email = RFCEmail(
        required=False,
        example="hello@tracim.fr",
        validate=user_email_validator,
        allow_none=True,
    )
    username = String(
        required=False,
        example="My-Power_User99",
        validate=user_username_validator,
        allow_none=True,
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
        validate=user_public_name_validator,
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
        description="if set to 1, then show workspace were user has a role in list"
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


class RadicaleUserResourceUserSubItemPathSchema(UserIdPathSchema):
    dest_user_id = marshmallow.fields.Int(
        example=3,
        required=True,
        description="id of a valid user",
        validate=strictly_positive_int_validator,
    )
    type = marshmallow.fields.Str(
        required=True,
    )
    sub_item = marshmallow.fields.String(default="", allow_none=True)
    trailing_slash = marshmallow.fields.String()

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return RadicaleUserResourceUserSubitemsPath(**data)


class RadicaleUserResourceWorkspaceSubItemPathSchema(UserIdPathSchema, WorkspaceIdPathSchema):
    type = marshmallow.fields.Str(
        required=True,
    )
    sub_item = marshmallow.fields.String()
    trailing_slash = marshmallow.fields.String()

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]):
        return RadicaleUserResourceWorkspaceSubitemsPath(**data)


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


class ContentIdBodySchema(marshmallow.Schema):
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


class UserPicturePathSchema(UserIdPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserPicturePath(**data)


class WidthAndHeightPathSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(example=256)
    height = marshmallow.fields.Int(example=256)


class UserPreviewPicturePathSchema(UserPicturePathSchema, WidthAndHeightPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return UserPreviewPicturePath(**data)


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
    WorkspaceAndContentRevisionIdPathSchema,
    WidthAndHeightPathSchema,
    FilenamePathSchema,
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


class UserContentIdPathSchema(UserIdPathSchema, ContentIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentAndUserPath(**data)


class ReactionPathSchema(WorkspaceAndContentIdPathSchema):
    reaction_id = marshmallow.fields.Int(
        example=6,
        description="id of a valid reaction related to content content_id",
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ReactionPath(**data)


class TagPathSchema(WorkspaceIdPathSchema):
    tag_id = marshmallow.fields.Int(
        example=6,
        description="id of a valid tag related to content content_id",
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return TagPath(**data)


class ContentTagPathSchema(ContentIdPathSchema, TagPathSchema):
    pass


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


class CommentsPathFilenameSchema(CommentsPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return CommentPathFilename(**data)


class KnownMembersQuerySchema(marshmallow.Schema):
    acp = StrippedString(example="test", description="search text to query", required=False)

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


class KnownContentsQuerySchema(marshmallow.Schema):
    acp = StrippedString(example="test", description="search text to query", required=True)

    limit = marshmallow.fields.Int(
        example=15,
        default=DEFAULT_KNOWN_CONTENT_NB_LIMIT,
        description="limit the number of results to this value, if not 0",
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return KnownContentsQuery(**data)


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


class FilterContentQuerySchema(BaseOptionalPaginatedQuerySchema):
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
        example=ContentTypeSlug.ANY.value,
        default=ContentTypeSlug.ANY.value,
        validate=all_content_types_validator,
    )
    label = StrippedString(
        example="myfilename",
        default=None,
        allow_none=True,
        description="Filter by content label",
    )
    sort = EnumField(
        ContentSortOrder,
        missing=ContentSortOrder.LABEL_ASC,
        description="Order of the returned contents, default is to sort by labels",
    )

    @post_load
    def make_content_filter(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentFilter(**data)


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
    user_email = RFCEmail(
        example="suri@cate.fr",
        default=None,
        allow_none=True,
        validate=user_email_validator,
    )
    user_username = StrippedString(
        example="The-John_Doe42",
        default=None,
        allow_none=True,
        validate=user_username_validator,
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
    email = TracimEmail(
        example="hello@tracim.fr",
        default=None,
        allow_none=True,
        validate=user_email_validator,
    )

    username = StrippedString(
        example="The-John_Doe42",
        default=None,
        allow_none=True,
        validate=user_username_validator,
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
    email = TracimEmail(required=True, example="hello@tracim.fr", validate=user_email_validator)
    reset_password_token = String(
        description="token to reset password of given user", required=True
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordCheckToken(**data)


class ResetPasswordModifySchema(marshmallow.Schema):
    email = TracimEmail(required=True, example="hello@tracim.fr", validate=user_email_validator)
    reset_password_token = String(
        description="token to reset password of given user", required=True
    )
    new_password = String(example="8QLa$<w", required=True, validate=user_password_validator)
    new_password2 = String(example="8QLa$<w", required=True, validate=user_password_validator)

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any]) -> object:
        return ResetPasswordModify(**data)


class BasicAuthSchema(marshmallow.Schema):
    email = TracimEmail(
        example="hello@tracim.fr",
        required=False,
        validate=user_email_validator,
        allow_none=True,
    )
    username = String(
        example="My-Power_User99",
        required=False,
        validate=user_username_validator,
        allow_none=True,
    )
    password = String(
        example="8QLa$<w",
        required=True,
        load_only=True,
        validate=user_password_validator,
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
        validate=workspace_label_length_validator,
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
    publication_enabled = marshmallow.fields.Bool(
        required=False,
        description="define whether a user can create and view publications in this workspace",
        default=None,
        allow_none=True,
    )

    @post_load
    def make_workspace_modifications(self, data: typing.Dict[str, typing.Any]) -> object:
        return WorkspaceUpdate(**data)


class WorkspaceCreationSchema(marshmallow.Schema):
    label = StrippedString(
        required=True, example="My Workspace", validate=workspace_label_length_validator
    )
    description = StrippedString(required=True, example="A super description of my workspace.")
    agenda_enabled = marshmallow.fields.Bool(
        required=False,
        description="has workspace has an associated agenda ?",
        default=True,
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
    publication_enabled = marshmallow.fields.Bool(
        required=False,
        description="define whether a user can create and view publications in this workspace",
        default=None,
        allow_none=True,
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
        example="far fa-file-alt",
        description="CSS class of the icon. Example: far fa-file-alt for using Fontawesome far fa-file-alt icon",
    )
    hexcolor = StrippedString(example="#F0F9DC", description="Hexadecimal color of the entry.")

    class Meta:
        description = "Entry element of a workspace menu"


class WorkspaceDigestSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)
    slug = StrippedString(example="intranet")
    label = StrippedString(example="Intranet")


# NOTE - SG - 2021-04-29 - Used to avoid transmitting description in all TLMs
class WorkspaceWithoutDescriptionSchema(WorkspaceDigestSchema):
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
    publication_enabled = marshmallow.fields.Bool(
        default=True,
        description="define whether a user can create and view publications in this workspace",
    )
    number_of_members = marshmallow.fields.Int(
        example=42,
        description="number of members of a space",
        allow_none=False,
        required=True,
        validate=positive_int_validator,
    )


class WorkspaceSchema(WorkspaceWithoutDescriptionSchema):
    description = StrippedString(example="All intranet data.")

    class Meta:
        description = "Full workspace information"


class EmailNotificationTypeSchema(marshmallow.Schema):
    email_notification_type = StrippedString(
        example=EmailNotificationType.default().name,
        description="Type of email notification for a specific space",
    )


class WorkspaceMemberDigestSchema(EmailNotificationTypeSchema):
    role = StrippedString(example="contributor", validate=user_role_validator)


class UserWorkspaceConfigSchema(WorkspaceMemberDigestSchema):
    user_id = marshmallow.fields.Int(example=3, validate=strictly_positive_int_validator)
    is_active = marshmallow.fields.Bool()
    user = marshmallow.fields.Nested(UserDigestSchema())
    workspace = marshmallow.fields.Nested(
        WorkspaceWithoutDescriptionSchema(exclude=("number_of_members",))
    )
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)

    class Meta:
        description = "Workspace Member information"


class WorkspaceRoleDigestSchema(marshmallow.Schema):
    role = StrippedString(example="contributor", validate=user_role_validator)


class UserWorkspaceRoleSchema(WorkspaceRoleDigestSchema):
    user_id = marshmallow.fields.Int(example=3, validate=strictly_positive_int_validator)
    is_active = marshmallow.fields.Bool()
    user = marshmallow.fields.Nested(UserDigestSchema())
    workspace_id = marshmallow.fields.Int(example=4, validate=strictly_positive_int_validator)


class WorkspaceWithUserMemberSchema(WorkspaceSchema):
    members = marshmallow.fields.Nested(UserWorkspaceConfigSchema(many=True))


class UserConfigSchema(marshmallow.Schema):
    parameters = marshmallow.fields.Dict(
        description="parameters present in the user's configuration."
    )


class UserCustomPropertiesSchema(marshmallow.Schema):
    json_schema = marshmallow.fields.Dict(
        description="json schema used for user custom properties",
        required=True,
        allow_none=False,
    )


class UserCustomPropertiesUiSchema(marshmallow.Schema):
    ui_schema = marshmallow.fields.Dict(
        description="ui schema used for user custom properties",
        required=True,
        allow_none=False,
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


class WorkspaceMemberCreationSchema(UserWorkspaceConfigSchema):
    newly_created = marshmallow.fields.Bool(
        exemple=False,
        description="Is the user completely new " "(and account was just created) or not ?",
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
    database_schema_version = StrippedString(
        example="8382e5a19f0d", description="Database schema version", allow_none=True
    )


class ReservedUsernamesSchema(marshmallow.Schema):
    items = marshmallow.fields.List(String(example="all"), required=True)


class ErrorCodeSchema(marshmallow.Schema):
    name = marshmallow.fields.Str()
    code = marshmallow.fields.Int()


class ApplicationSchema(marshmallow.Schema):
    label = StrippedString(example="Agenda")
    slug = StrippedString(example="agenda")
    fa_icon = StrippedString(
        example="far fa-file",
        description="CSS class of the icon. Example: far fa-file for using Fontawesome far fa-file icon",
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
        example="far fa-file-alt",
        description="CSS class of the icon. Example: far fa-file for using Fontawesome far fa-file icon",
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
        validate=content_label_length_validator,
    )
    content_type = StrippedString(
        required=True, example="html-document", validate=all_content_types_validator
    )
    content_namespace = EnumField(
        ContentNamespaces, missing=ContentNamespaces.CONTENT, example="content"
    )
    parent_id = marshmallow.fields.Integer(
        example=35,
        description="content_id of parent content, if content should be placed "
        "in a folder, this should be folder content_id.",
        allow_none=True,
        default=None,
        validate=strictly_positive_int_validator,
    )
    template_id = marshmallow.fields.Integer(
        example=42,
        description="content_id of template content, if content should be created "
        "from a template, this should be template content_id.",
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


class UserInfoContentAbstractSchema(marshmallow.Schema):
    author = marshmallow.fields.Nested(UserDigestSchema)
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)


class ContentDigestSchema(UserInfoContentAbstractSchema):
    assignee_id = marshmallow.fields.Int(
        example=42,
        allow_none=True,
        default=None,
        validate=strictly_positive_int_validator,
    )
    content_namespace = EnumField(ContentNamespaces, example="content")
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
    is_template = marshmallow.fields.Bool(example=False, default=False)
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


class PaginatedContentDigestSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(ContentDigestSchema, many=True)


class FavoriteContentSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(example=3, validate=strictly_positive_int_validator)
    user = marshmallow.fields.Nested(UserDigestSchema())
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    content = marshmallow.fields.Nested(ContentDigestSchema, allow_none=True)
    original_label = StrippedString(example="Intervention Report 12")
    original_type = StrippedString(example="html-document", validate=all_content_types_validator)


class PaginatedFavoriteContentSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(FavoriteContentSchema, many=True)


class ReadStatusSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    read_by_user = marshmallow.fields.Bool(example=False, default=False)


#####
# Content
#####
class MessageContentSchema(ContentDigestSchema):
    description = StrippedString(
        required=True, description="raw text or html description of the content"
    )
    version_number = marshmallow.fields.Int(
        description="Version number of the content, starting at 1 and incremented by 1 for each revision",
        validate=strictly_positive_int_validator,
    )


class ContentSchema(MessageContentSchema):
    raw_content = StrippedString(
        required=True,
        description="Content of the object, may be raw text or <b>html</b> for example",
    )


class ToDoSchema(marshmallow.Schema):
    author = marshmallow.fields.Nested(UserDigestSchema())
    assignee = marshmallow.fields.Nested(UserDigestSchema())
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Content creation date"
    )
    parent = marshmallow.fields.Nested(ContentMinimalSchema())
    raw_content = StrippedString(
        required=True,
        description="Content of the object, may be raw text or <b>html</b> for example",
    )
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema())
    status = StrippedString(
        example="closed-deprecated",
        validate=content_status_validator,
        description="this slug is found in content_type available statuses",
        default=open_status,
    )


class PreviewInfoSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    revision_id = marshmallow.fields.Int(example=12, validate=strictly_positive_int_validator)
    page_nb = marshmallow.fields.Int(
        description="number of pages, return null value if unaivalable",
        example=1,
        allow_none=True,
    )
    has_pdf_preview = marshmallow.fields.Bool(
        description="true if a pdf preview is available or false", example=True
    )
    has_jpeg_preview = marshmallow.fields.Bool(
        description="true if a jpeg preview is available or false", example=True
    )


class MessageFileContentSchema(ContentSchema):
    mimetype = StrippedString(
        description="file content mimetype", example="image/jpeg", required=True
    )
    size = marshmallow.fields.Int(
        description="file size in byte, return null value if unavailable",
        example=1024,
        allow_none=True,
    )


class FileContentSchema(MessageFileContentSchema):
    raw_content = StrippedString(
        required=True,
        description="Content of the object, may be raw text or <b>html</b> for example",
    )


#####
# Revision
#####


class RevisionSchema(ContentDigestSchema):
    revision_id = marshmallow.fields.Int(example=12, validate=strictly_positive_int_validator)
    revision_type = StrippedString(
        example=ActionDescription.CREATION, validate=action_description_validator
    )
    description = StrippedString(
        required=True, description="raw text or html description of the content"
    )
    raw_content = StrippedString(
        required=True,
        description="Content of the object, may be raw text or <b>html</b> for example",
    )
    version_number = marshmallow.fields.Int(
        example=123,
        validate=strictly_positive_int_validator,
        description="version of the revision, starting at 1 and incremented by 1 for each revision",
        allow_none=True,
    )


class RevisionPageSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(RevisionSchema(many=True))


class FileRevisionSchema(RevisionSchema):
    mimetype = StrippedString(
        description="file content mimetype", example="image/jpeg", required=True
    )
    size = marshmallow.fields.Int(
        description="file size in byte, return null value if unaivalable",
        example=1024,
        allow_none=True,
    )


class FileRevisionPageSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(FileRevisionSchema(many=True))


class CollaborativeDocumentEditionConfigSchema(marshmallow.Schema):
    software = marshmallow.fields.String()
    supported_file_types = marshmallow.fields.List(
        marshmallow.fields.Nested(CollaborativeFileTypeSchema())
    )


class ReactionSchema(marshmallow.Schema):
    reaction_id = marshmallow.fields.Int(example=12, validate=strictly_positive_int_validator)
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    author = marshmallow.fields.Nested(UserDigestSchema)
    value = StrippedString(example="😀")
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="reaction creation date"
    )


class TagSchema(marshmallow.Schema):
    tag_id = marshmallow.fields.Int(example=12, validate=strictly_positive_int_validator)
    workspace_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    tag_name = StrippedString(example="todo")


class MessageCommentSchema(marshmallow.Schema):
    """
    Schema for comments without raw_content
    """

    author = marshmallow.fields.Nested(UserDigestSchema)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="comment creation date"
    )
    modified = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Comment last edition date"
    )
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)
    content_id = marshmallow.fields.Int(example=6, validate=strictly_positive_int_validator)
    content_type = StrippedString(example="html-document", validate=all_content_types_validator)
    description = StrippedString(example="This is a description")
    parent_content_namespace = EnumField(
        ContentNamespaces, missing=ContentNamespaces.CONTENT, example="content"
    )
    parent_content_type = String(example="html-document", validate=all_content_types_validator)
    parent_id = marshmallow.fields.Int(example=34, validate=positive_int_validator)
    parent_label = String(example="This is a label")


class CommentSchema(MessageCommentSchema):
    """
    Schema for comments with raw_content
    """

    raw_content = StrippedString(example="<p>This is just an html comment!</p>")


class SetCommentSchema(marshmallow.Schema):
    raw_content = StrippedString(
        example="<p>This is just an html comment !</p>",
        validate=not_empty_string_validator,
        required=True,
    )

    @post_load()
    def create_comment(self, data: typing.Dict[str, typing.Any]) -> object:
        return CommentCreation(**data)


class SetReactionSchema(marshmallow.Schema):
    value = StrippedString(
        example="😀",
        validate=reaction_value_length_validator,
        required=True,
    )

    @post_load()
    def create_reaction(self, data: typing.Dict[str, typing.Any]) -> object:
        return ReactionCreation(**data)


class SetTagByNameSchema(marshmallow.Schema):
    tag_name = StrippedString(example="todo", validate=tag_length_validator, required=True)

    @post_load()
    def create_tag(self, data: typing.Dict[str, typing.Any]) -> object:
        return TagCreation(**data)


class ContentModifyAbstractSchema(marshmallow.Schema):
    label = StrippedString(
        required=False,
        example="contract for client XXX",
        description="New title of the content",
        validate=content_label_length_validator,
    )
    description = StrippedString(
        required=False, description="raw text or html description of the content"
    )
    raw_content = StrippedString(
        required=False,
        description="Content of the object, may be raw text or <b>html</b> for example",
    )


class ContentModifyNamespaceAbstractSchema(marshmallow.Schema):
    content_namespace = StrippedString(
        required=True,
        description="Content_namespace of the object, raw text",
    )


class ContentModifySchema(ContentModifyAbstractSchema):
    @post_load
    def text_based_content_update(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentUpdate(**data)


class ContentModifyNamespaceSchema(ContentModifyNamespaceAbstractSchema):
    @post_load
    def content_namespace_update(self, data: typing.Dict[str, typing.Any]) -> object:
        return ContentNamespaceUpdate(**data)


class FolderContentModifySchema(ContentModifyAbstractSchema):
    sub_content_types = marshmallow.fields.List(
        StrippedString(example="html-document", validate=all_content_types_validator),
        description="list of content types allowed as sub contents.",
        required=False,
    )

    @post_load
    def folder_content_update(self, data: typing.Dict[str, typing.Any]) -> object:
        return FolderContentUpdate(**data)


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


class SetContentIsTemplateSchema(marshmallow.Schema):
    is_template = marshmallow.fields.Boolean(description="set content as a template", default=False)

    @post_load
    def set_marked_as_template(self, data: typing.Dict[str, typing.Any]) -> object:
        return SetContentIsTemplate(**data)


class TemplateQuerySchema(marshmallow.Schema):
    type = StrippedString(
        example="html-document", validate=all_content_types_validator, required=True
    )


class TargetLanguageSchema(marshmallow.Schema):
    code = marshmallow.fields.String(required=True, example="fr")
    display = marshmallow.fields.String(required=True, example="Français")


class CodeSampleLanguageSchema(marshmallow.Schema):
    value = marshmallow.fields.String(required=True, example="markup")
    text = marshmallow.fields.String(required=True, example="Markup")


class RoleSchema(marshmallow.Schema):
    level = marshmallow.fields.String(required=True, example="1")
    label = marshmallow.fields.String(required=True, example="Reader")


class SamLIdPConfigSchema(marshmallow.Schema):
    logo_url = marshmallow.fields.String(required=True)
    displayed_name = marshmallow.fields.String(required=True)
    identifier = marshmallow.fields.String(required=True)


class ConfigSchema(marshmallow.Schema):
    email_notification_activated = marshmallow.fields.Bool()
    new_user_invitation_do_notify = marshmallow.fields.Bool()
    webdav_enabled = marshmallow.fields.Bool()
    translation_service__enabled = marshmallow.fields.Bool()
    webdav_url = marshmallow.fields.String()
    collaborative_document_edition = marshmallow.fields.Nested(
        CollaborativeDocumentEditionConfigSchema(), allow_none=True
    )
    content_length_file_size_limit = marshmallow.fields.Integer()
    workspace_size_limit = marshmallow.fields.Integer()
    workspaces_number_per_user_limit = marshmallow.fields.Integer()
    instance_name = marshmallow.fields.String()
    email_required = marshmallow.fields.Bool()
    search_engine = marshmallow.fields.String()
    translation_service__target_languages = marshmallow.fields.Nested(
        TargetLanguageSchema, many=True
    )
    user__self_registration__enabled = marshmallow.fields.Bool()
    ui__spaces__creation__parent_space_choice__visible = marshmallow.fields.Bool()
    # NOTE - MP - 2022-11-29 - The line under is probably wrong and do not require
    # `marshmallow.fields.items`
    ui__notes__code_sample_languages = marshmallow.fields.items = marshmallow.fields.Nested(
        CodeSampleLanguageSchema, many=True
    )
    limitation__maximum_online_users_message = marshmallow.fields.String()
    call__enabled = marshmallow.fields.Bool()
    call__unanswered_timeout = marshmallow.fields.Int()
    auth_types = marshmallow.fields.List(marshmallow.fields.String())
    user__read_only_fields = marshmallow.fields.Dict(
        keys=marshmallow.fields.String(),
        values=marshmallow.fields.List(marshmallow.fields.String()),
    )
    saml_idp_list = marshmallow.fields.Nested(SamLIdPConfigSchema, many=True)
    app_custom_actions = marshmallow.fields.Nested(AppCustomActionLocationSchema())
    iframe_whitelist = marshmallow.fields.List(marshmallow.fields.String())


class ConditionFileSchema(marshmallow.Schema):
    title = marshmallow.fields.String()
    url = marshmallow.fields.URL()


class UsageConditionsSchema(marshmallow.Schema):
    items = marshmallow.fields.Nested(ConditionFileSchema, many=True)


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


class LiveMessageSchemaPage(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(LiveMessageSchema, many=True)


class ContentPathInfoSchema(marshmallow.Schema):
    items = marshmallow.fields.Nested(ContentMinimalSchema, many=True)


class UrlQuerySchema(marshmallow.Schema):
    url = marshmallow.fields.URL()


class UrlPreviewSchema(marshmallow.Schema):
    title = StrippedString(allow_none=True)
    description = StrippedString(allow_none=True)
    image = marshmallow.fields.URL(allow_none=True)


class TranslationQuerySchema(FileQuerySchema):
    source_language_code = marshmallow.fields.String(
        description="source language of translation, by default set to auto",
        example="fr",
        missing=AUTODETECT_LANG,
        default=AUTODETECT_LANG,
        allow_none=False,
    )
    target_language_code = marshmallow.fields.String(
        description="destination language of translation",
        example="en",
        required=True,
        allow_none=False,
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any]) -> TranslationQuery:
        return TranslationQuery(**data)


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
        example="/workspaces/1/email_notification_type",
    )


class UserMessagesMarkAsReadQuerySchema(marshmallow.Schema):
    content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="1,4",
        description="Comma separated list of content ids. Every event related to these contents\
            will be marked as read.",
    )
    event_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="3,5",
        description="Comma separated list of event ids. Every event ids will be marked as read.",
    )
    parent_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="2,6",
        description="Comma separated list of parent content ids. Every event related to theses\
            parents will be marked as read.",
    )
    space_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        example="7",
        description="Comma separated list of space ids. Every event related to theses space\
            will be marked as read.",
    )

    @post_load
    def user_message_mark_as_read_query(
        self, data: typing.Dict[str, typing.Any]
    ) -> UserMessagesMarkAsReadQuery:
        return UserMessagesMarkAsReadQuery(**data)


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
        example="pending",
        validate=workspace_subscription_state_validator,
        attribute="state_slug",
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
        example=42,
        validate=strictly_positive_int_validator,
        allow_none=True,
        default=None,
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


class AboutUserSchema(UserDigestSchema):
    followers_count = marshmallow.fields.Int(
        example=42,
        required=True,
        description="count of users following this user",
        validate=positive_int_validator,
    )
    leaders_count = marshmallow.fields.Int(
        example=42,
        required=True,
        description="count of users followed by this user",
        validate=positive_int_validator,
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="User registration date"
    )
    authored_content_revisions_count = marshmallow.fields.Int(
        example=23,
        required=True,
        description="count of revisions whose author is this user",
        validate=positive_int_validator,
    )
    authored_content_revisions_space_count = marshmallow.fields.Int(
        example=12,
        required=True,
        description="count of spaces where this user authored at least one content revision",
        validate=positive_int_validator,
    )


class CommentsPageQuerySchema(BaseOptionalPaginatedQuerySchema):
    sort = EnumField(
        ContentSortOrder,
        missing=ContentSortOrder.CREATED_ASC,
        description="Order of the returned contents, default is to sort by creation date, older first",
    )


class CommentsPageSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(CommentSchema, many=True)


class ContentRevisionsPageQuerySchema(BaseOptionalPaginatedQuerySchema):
    sort = EnumField(
        ContentSortOrder,
        missing=ContentSortOrder.MODIFIED_ASC,
        description="Order of the returned revisions, default is to sort by modification (e.g. creation of the revision) date, older first",
    )


###
# UserCall
###


class CreateUserCallSchema(marshmallow.Schema):
    callee_id = marshmallow.fields.Integer(description="Id of the user to call", example=42)


class UserCallSchema(marshmallow.Schema):
    call_id = marshmallow.fields.Integer(example=32, description="Id of the call")
    caller = marshmallow.fields.Nested(UserDigestSchema, description="User who initiated the call")
    callee = marshmallow.fields.Nested(UserDigestSchema, description="User who has been called")
    state = EnumField(UserCallState)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, description="Date of creation of the call"
    )
    updated = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        description="date of last modification of the call.",
        dump_to="modified",
    )
    url = marshmallow.fields.URL()


class UserIdCallIdPathSchema(UserIdPathSchema):
    call_id = marshmallow.fields.Integer(example=42, description="Id of the call to update")


class GetUserCallsQuerySchema(marshmallow.Schema):
    state = EnumField(
        UserCallState,
        missing=None,
        default=None,
        required=False,
        description="If given, only return calls with the given state",
    )


class UserCallsSchema(marshmallow.Schema):
    items = marshmallow.fields.Nested(UserCallSchema(many=True))


class UpdateUserCallStateSchema(marshmallow.Schema):
    state = EnumField(UserCallState, description="New call state")
