# coding=utf-8
from enum import Enum
import marshmallow
from marshmallow import post_load
from marshmallow.fields import Email
from marshmallow.fields import Field
from marshmallow.fields import String
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
from tracim_backend.models.context_models import FilePatchQuery
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
    dump_default=None,
    allow_none=True,
    validate=regex_string_as_list_of_int,
    metadata={"example": "1,5", "description": "comma separated list of excluded authors"},
)


class TracimEmail(Email):
    def __init__(self, *args, **kwargs):
        String.__init__(self, *args, **kwargs)
        # Insert validation into self.validators so that multiple errors can be stored.
        self.validators = [TracimEmailValidator(error=self.error_messages["invalid"])] + list(
            self.validators
        )

    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        return value.strip()


class RFCEmail(String):
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

    def _deserialize(self, value, attr, data, **kwargs):
        value = super()._deserialize(value, attr, data, **kwargs)
        return value.strip()


class BasePaginatedQuerySchema(marshmallow.Schema):
    """Base query parameters for a paginated query"""

    count = marshmallow.fields.Int(
        metadata={"example": 10},
        validate=strictly_positive_int_validator,
        load_default=DEFAULT_NB_ITEM_PAGINATION,
        dump_default=DEFAULT_NB_ITEM_PAGINATION,
        allow_none=False,
    )
    page_token = marshmallow.fields.String(
        metadata={"description": "token of the page wanted, if not provided get first" "elements"},
        validate=page_token_validator,
        load_default=None,
    )


class BaseOptionalPaginatedQuerySchema(marshmallow.Schema):
    """Base query parameter for an API which allows pagination
    but returns all the results by default."""

    count = marshmallow.fields.Int(
        validate=positive_int_validator,
        load_default=0,
        dump_default=0,
        allow_none=False,
        metadata={
            "example": 10,
            "description": "Allows to paginate the results in combination with page_token, by default all results are returned",
        },
    )
    page_token = marshmallow.fields.String(
        metadata={"description": "token of the page wanted, if not provided get first elements"},
        validate=page_token_validator,
        load_default=None,
        dump_default=None,
    )


class BasePaginatedSchemaPage(marshmallow.Schema):
    previous_page_token = marshmallow.fields.String()
    next_page_token = marshmallow.fields.String()
    has_next = marshmallow.fields.Bool()
    has_previous = marshmallow.fields.Bool()
    per_page = marshmallow.fields.Int()


class CollaborativeFileTypeSchema(marshmallow.Schema):
    mimetype = marshmallow.fields.String(
        required=True,
        metadata={
            "example": "application/vnd.oasis.opendocument.text",
            "description": "Collabora Online file mimetype",
        },
    )
    extension = marshmallow.fields.String(
        required=True,
        metadata={"example": "odt", "description": "Collabora Online file extensions"},
    )
    associated_action = marshmallow.fields.String(
        required=True,
        metadata={"example": "edit", "description": "Collabora Online action allowed"},
    )
    url_source = marshmallow.fields.URL(
        required=True,
        metadata={
            "example": "http://localhost:9980/loleaflet/305832f/loleaflet.html",
            "description": "URL of the collabora online editor for this type of file",
        },
    )


class SimpleFileSchema(marshmallow.Schema):
    """
    Just a simple schema for file
    """

    # TODO - G.M - 2018-10-09 - Set required to True, actually disable because
    # activating it make it failed due to "is not iterable issue.
    # see https://github.com/tracim/tracim/issues/2350
    files = marshmallow.fields.Raw(required=False, metadata={"description": "a file"})

    @post_load
    def create_file(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return SimpleFile(**data)


class FileCreationFormSchema(marshmallow.Schema):
    parent_id = marshmallow.fields.Int(
        metadata={"example": 2}, dump_default=0, validate=positive_int_validator, allow_none=True
    )
    content_namespace = EnumField(
        ContentNamespaces, load_default=ContentNamespaces.CONTENT, metadata={"example": "content"}
    )
    content_type = marshmallow.fields.String(
        load_default=ContentTypeSlug.FILE.value, metadata={"example": ContentTypeSlug.FILE.value}
    )
    template_id = marshmallow.fields.Int(
        metadata={"example": 2}, dump_default=0, validate=positive_int_validator, allow_none=True
    )

    @post_load
    def file_creation_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FileCreation(**data)


class UserDigestSchema(marshmallow.Schema):
    """
    Simple user schema
    """

    user_id = marshmallow.fields.Int(dump_only=True, metadata={"example": 3})
    has_avatar = marshmallow.fields.Bool(
        metadata={
            "description": "Does the user have an avatar? avatar need to be obtain with /avatar endpoint"
        }
    )
    has_cover = marshmallow.fields.Bool(
        metadata={
            "description": "Does the user have a cover? cover need to be obtain with /cover endpoint"
        }
    )
    public_name = StrippedString(metadata={"example": "John Doe"})
    username = StrippedString(
        metadata={"example": "My-Power_User99"}, required=False, dump_default=None, allow_none=True
    )
    workspace_ids = marshmallow.fields.List(marshmallow.fields.Int(metadata={"example": 3}))
    is_active = marshmallow.fields.Bool()


class AppCustomActionsSchema(marshmallow.Schema):
    icon_text = marshmallow.fields.String(
        required=True,
        metadata={
            "example": "fas fa-pencil-alt",
            "description": "Icon of the custom action. If set, icon_image must be set to empty string.",
        },
    )
    icon_image = marshmallow.fields.String(
        required=True,
        metadata={
            "example": "https://www.tracim.fr/static/images/new_tracim/LOGO_TRACIM_RVB_1.png",
            "description": "Image of the custom action. If set, icon_text must be set to empty string.",
        },
    )
    label = marshmallow.fields.Dict(
        required=True,
        metadata={
            "example": '{"fr": "My string"}',
            "description": "The visible text displayed in the custom action. Set each labels related to its language key",
        },
    )
    link = marshmallow.fields.String(
        required=True,
        metadata={
            "example": "https://www.tracim.fr/static/images/new_tracim/LOGO_TRACIM_RVB_1.png",
            "description": "The action associated with the button",
        },
    )
    content_type_filter = marshmallow.fields.String(
        required=False,
        metadata={
            "example": "file,thread,kanban",
            "description": "A list comma separated of content types on which the custom action will apply",
        },
    )
    content_extension_filter = marshmallow.fields.String(
        required=False,
        metadata={
            "example": ".jpg,.png,.gif",
            "description": "A list comma separated of content extensions on which the custom action will apply",
        },
    )
    content_label_regex_filter = marshmallow.fields.String(
        required=False,
        metadata={
            "example": "my_pattern",
            "description": "A regex string for content label pattern matching on which the custom action will apply",
        },
    )
    user_role_filter = marshmallow.fields.String(
        required=False,
        metadata={
            "example": "workspace-manager,content-manager,contributor",
            "description": "A list comma separated of user's role for whom the custom action will apply",
        },
    )
    user_profile_filter = marshmallow.fields.String(
        required=False,
        metadata={
            "example": "administrators,trusted-users,users",
            "description": "A list comma separated of user's profiles for whom the custom action will apply",
        },
    )
    workspace_id_filter = marshmallow.fields.String(
        required=False,
        metadata={
            "example": "1,10,222",
            "description": "A list comma separated of workspace id on which the custom action will apply",
        },
    )


class AppCustomActionLocationSchema(marshmallow.Schema):
    user_sidebar_dropdown = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema), metadata={"description": "NYI"}
    )
    user_sidebar_shortcuts = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema), metadata={"description": "NYI"}
    )
    content_in_list_dropdown = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema),
        metadata={
            "description": "Custom action placed in the dropdown on content in the workspace content list"
        },
    )
    content_app_dropdown = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema),
        metadata={"description": "Custom action placed in the header dropdown of content apps"},
    )
    space_dashboard_action_list = marshmallow.fields.List(
        marshmallow.fields.Nested(AppCustomActionsSchema), metadata={"description": "NYI"}
    )


class UserDiskSpaceSchema(UserDigestSchema):
    user_id = marshmallow.fields.Int(dump_only=True, metadata={"example": 3})
    allowed_space = marshmallow.fields.Integer(
        metadata={
            "description": "allowed space per user in bytes. this apply on sum of user owned workspace size."
            "if user_space > allowed_space, no file can be created/updated in any user owned workspaces. 0 mean no limit"
        }
    )
    used_space = marshmallow.fields.Integer(
        metadata={
            "description": "used space per user in bytes. this apply on sum of user owned workspace size."
            "if user_space > allowed_space, no file can be created/updated in any user owned workspaces."
        }
    )
    user = marshmallow.fields.Nested(UserDigestSchema(), attribute="user_in_context")


class UserSchema(UserDigestSchema):
    """
    Complete user schema
    """

    email = TracimEmail(required=False, metadata={"example": "hello@tracim.fr"}, allow_none=True)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "Date of creation of the user account"}
    )
    is_active = marshmallow.fields.Bool(
        metadata={
            "example": True,
            "description": "true if the user is active, "
            "false if the user has been deactivated"
            " by an admin. Default is true",
        },
    )
    is_deleted = marshmallow.fields.Bool(
        metadata={
            "example": False,
            "description": "true if the user account has been deleted. " "Default is false",
        },
    )
    # TODO - G.M - 17-04-2018 - Restrict timezone values
    timezone = StrippedString(
        metadata={"example": "Europe/Paris", "description": FIELD_TIMEZONE_DESC},
        validate=user_timezone_validator,
    )
    profile = StrippedString(
        attribute="profile",
        validate=user_profile_validator_with_nobody,
        metadata={"example": "trusted-users", "description": FIELD_PROFILE_DESC},
    )
    lang = StrippedString(
        metadata={"example": "en", "description": FIELD_LANG_DESC},
        required=False,
        validate=user_lang_validator,
        allow_none=True,
        dump_default=None,
    )
    auth_type = marshmallow.fields.String(
        validate=OneOf([auth_type_en.value for auth_type_en in AuthType]),
        metadata={
            "example": AuthType.INTERNAL.value,
            "description": "authentication system of the user",
        },
    )
    allowed_space = marshmallow.fields.Integer(
        validate=positive_int_validator,
        allow_none=True,
        required=False,
        metadata={
            "description": "allowed space per user in bytes. this apply on sum of user owned workspace size."
            "if limit is reached, no file can be created/updated in any user owned workspaces. 0 mean no limit"
        },
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
        validate=user_config_validator,
        metadata={
            "example": {"param1": "value1"},
            "description": "A simple json dictionary. "
            'Valid keys only contain characters in "0-9a-zA-Z-_." and are not empty. '
            'You can use "." to create a hierarchy in the configuration parameters. '
            "Valid values only allow primitive types: numbers, bool, null, and do not accept "
            "complex types such dictionaries or lists.",
        },
    )


class SetCustomPropertiesSchema(marshmallow.Schema):
    """
    Change the user config
    """

    parameters = marshmallow.fields.Dict(
        required=True,
        metadata={"example": {"param1": "value1"}, "description": "custom_properties schema"},
    )


class SetEmailSchema(LoggedInUserPasswordSchema):
    email = TracimEmail(
        required=True, metadata={"example": "hello@tracim.fr"}, validate=user_email_validator
    )

    @post_load
    def create_set_email_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return SetEmail(**data)


class SetUsernameSchema(LoggedInUserPasswordSchema):
    username = StrippedString(
        required=True, metadata={"example": "The-user_42"}, validate=user_username_validator
    )

    @post_load
    def create_set_username_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return SetUsername(**data)


class SetPasswordSchema(LoggedInUserPasswordSchema):
    new_password = String(
        metadata={"example": "8QLa$<w"}, required=True, validate=user_password_validator
    )
    new_password2 = String(
        metadata={"example": "8QLa$<w"}, required=True, validate=user_password_validator
    )

    @post_load
    def create_set_password_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return SetPassword(**data)


class SetUserInfoSchema(marshmallow.Schema):
    """
    Schema used for setting user information.
    This schema is for write access only
    """

    timezone = StrippedString(
        metadata={"example": "Europe/Paris", "description": FIELD_TIMEZONE_DESC}, required=True
    )
    public_name = StrippedString(
        metadata={"example": "John Doe"},
        required=False,
        validate=user_public_name_validator,
        dump_default=None,
    )
    lang = StrippedString(
        metadata={"example": "en", "description": FIELD_LANG_DESC},
        required=True,
        validate=user_lang_validator,
        allow_none=True,
        dump_default=None,
    )

    @post_load
    def create_user_info_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserInfos(**data)


class SetUserProfileSchema(marshmallow.Schema):
    """
    Schema used for setting user profile. This schema is for write access only
    """

    profile = StrippedString(
        attribute="profile",
        validate=user_profile_validator,
        metadata={"example": "trusted-users", "description": FIELD_PROFILE_DESC},
        required=True,
    )

    @post_load
    def create_user_profile(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserProfile(**data)


class SetUserAllowedSpaceSchema(marshmallow.Schema):
    """
    Schema used for setting user allowed space. This schema is for write access only
    """

    allowed_space = marshmallow.fields.Integer(
        validate=positive_int_validator,
        allow_none=True,
        required=False,
        metadata={
            "description": "allowed space per user in bytes. this apply on sum of user owned workspace size."
            "if limit is reached, no file can be created/updated in any user owned workspaces. 0 mean no limit."
        },
    )

    @post_load
    def create_user_allowed_space(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserAllowedSpace(**data)


class UserRegistrationSchema(marshmallow.Schema):
    email = TracimEmail(
        required=True,
        metadata={"example": "hello@tracim.fr"},
        validate=user_email_validator,
        allow_none=True,
    )
    username = String(
        required=False,
        metadata={"example": "My-Power_User99"},
        validate=user_username_validator,
        allow_none=True,
    )
    password = String(
        metadata={"example": "8QLa$<w"},
        required=True,
        validate=user_password_validator,
        allow_none=True,
        dump_default=None,
    )
    timezone = StrippedString(
        metadata={"example": "Europe/Paris", "description": FIELD_TIMEZONE_DESC},
        required=False,
        dump_default="",
        validate=user_timezone_validator,
    )
    public_name = StrippedString(
        metadata={"example": "John Doe"},
        required=True,
        dump_default=None,
        validate=user_public_name_validator,
    )
    lang = StrippedString(
        metadata={"example": "en", "description": FIELD_LANG_DESC},
        required=False,
        validate=user_lang_validator,
        allow_none=True,
        dump_default=None,
    )

    @post_load
    def register_user(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserCreation(**data)


class UserCreationSchema(marshmallow.Schema):
    email = RFCEmail(
        required=False,
        metadata={"example": "hello@tracim.fr"},
        validate=user_email_validator,
        allow_none=True,
    )
    username = String(
        required=False,
        metadata={"example": "My-Power_User99"},
        validate=user_username_validator,
        allow_none=True,
    )
    password = String(
        metadata={"example": "8QLa$<w"},
        required=False,
        validate=user_password_validator,
        allow_none=True,
        dump_default=None,
    )
    profile = StrippedString(
        attribute="profile",
        validate=user_profile_validator,
        required=False,
        allow_none=True,
        metadata={"example": "trusted-users", "description": FIELD_PROFILE_DESC},
    )
    timezone = StrippedString(
        metadata={"example": "Europe/Paris", "description": FIELD_TIMEZONE_DESC},
        required=False,
        dump_default="",
        validate=user_timezone_validator,
    )
    public_name = StrippedString(
        metadata={"example": "John Doe"},
        required=False,
        dump_default=None,
        validate=user_public_name_validator,
    )
    lang = StrippedString(
        metadata={"example": "en", "description": FIELD_LANG_DESC},
        required=False,
        validate=user_lang_validator,
        allow_none=True,
        dump_default=None,
    )
    email_notification = marshmallow.fields.Bool(
        metadata={"example": True}, required=False, dump_default=True
    )
    allowed_space = marshmallow.fields.Integer(
        validate=positive_int_validator,
        allow_none=True,
        required=False,
        metadata={
            "description": "allowed space per user in bytes. this apply on sum of user owned workspace size."
            "if limit is reached, no file can be created/updated in any user owned workspaces. 0 mean no limit"
        },
    )

    @marshmallow.validates_schema(pass_original=True)
    def validate_email_and_username(self, data: dict, original_data: dict, **kwargs) -> None:
        if not original_data.get("email") and not original_data.get("username"):
            raise marshmallow.ValidationError("email or username required")

    @post_load
    def create_user(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserCreation(**data)


# Path Schemas
class RadicaleSubItemPathSchema(object):
    sub_item = marshmallow.fields.String()


class UserIdPathSchema(marshmallow.Schema):
    user_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 3, "description": "id of a valid user"},
        validate=strictly_positive_int_validator,
    )


class EventIdPathSchema(marshmallow.Schema):
    event_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 5, "description": "id of a valid event"},
        validate=strictly_positive_int_validator,
    )


class MessageIdsPathSchema(UserIdPathSchema, EventIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
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
        metadata={
            "example": "0,4,5",
            "description": "comma separated list of parent ids,"
            " parent_id allow to filter workspaces."
            " If not parent_ids at all, then return all workspaces."
            " If one parent_id to 0, then return root workspaces."
            " If set to another value, return all direct subworkspaces"
            " If multiple value of parent_ids separated by comma,"
            " return mix of all workspaces of all theses parent_ids",
        },
        dump_default="0",
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return WorkspaceFilterQuery(**data)


class UserWorkspaceFilterQuerySchema(WorkspaceFilterQuerySchema):
    show_owned_workspace = marshmallow.fields.Int(
        dump_default=1,
        metadata={
            "example": 1,
            "description": "if set to 1, then show owned workspace in list"
            " Default is 1, else do no show them",
        },
        validate=bool_as_int_validator,
    )
    show_workspace_with_role = marshmallow.fields.Int(
        dump_default=1,
        metadata={
            "example": 1,
            "description": "if set to 1, then show workspace were user has a role in list"
            " Default is 1, else do no show them",
        },
        validate=bool_as_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return UserWorkspaceFilterQuery(**data)


class WorkspaceMemberFilterQuery(object):
    def __init__(self, show_disabled_user: int = 0):
        self.show_disabled_user = bool(show_disabled_user)


class WorkspaceMemberFilterQuerySchema(marshmallow.Schema):
    show_disabled_user = marshmallow.fields.Int(
        exemple=0,
        dump_default=0,
        metadata={
            "description": "if set to 1, then show also user which is disabled"
            " Default is 0, else show them"
        },
        validate=bool_as_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return WorkspaceMemberFilterQuery(**data)


class WorkspaceIdSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 4, "description": "id of a valid workspace"},
        validate=strictly_positive_int_validator,
    )


class WorkspaceIdPathSchema(WorkspaceIdSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return WorkspacePath(**data)


class RadicaleUserResourceUserSubItemPathSchema(UserIdPathSchema):
    dest_user_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 3, "description": "id of a valid user"},
        validate=strictly_positive_int_validator,
    )
    type = marshmallow.fields.Str(
        required=True,
    )
    sub_item = marshmallow.fields.String(dump_default="", allow_none=True)
    trailing_slash = marshmallow.fields.String()

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return RadicaleUserResourceUserSubitemsPath(**data)


class RadicaleUserResourceWorkspaceSubItemPathSchema(UserIdPathSchema, WorkspaceIdPathSchema):
    type = marshmallow.fields.Str(
        required=True,
    )
    sub_item = marshmallow.fields.String()
    trailing_slash = marshmallow.fields.String()

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return RadicaleUserResourceWorkspaceSubitemsPath(**data)


class RadicaleUserSubItemPathSchema(RadicaleSubItemPathSchema, UserIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return RadicaleUserSubitemsPath(**data)


class RadicaleWorkspaceSubItemPathSchema(RadicaleSubItemPathSchema, WorkspaceIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs):
        return RadicaleWorkspaceSubitemsPath(**data)


class ContentIdPathSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 6, "description": "id of a valid content"},
        validate=strictly_positive_int_validator,
    )


class ContentIdBodySchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 6, "description": "id of a valid content"},
        validate=strictly_positive_int_validator,
    )


class RevisionIdPathSchema(marshmallow.Schema):
    revision_id = marshmallow.fields.Int(metadata={"example": 6}, required=True)


class WorkspaceAndUserIdPathSchema(UserIdPathSchema, WorkspaceIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WorkspaceAndUserPath(**data)


class WorkspaceAndContentIdPathSchema(WorkspaceIdPathSchema, ContentIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WorkspaceAndContentPath(**data)


class FilenamePathSchema(marshmallow.Schema):
    filename = StrippedString(dump_default="filename.ext")


class UserPicturePathSchema(UserIdPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserPicturePath(**data)


class WidthAndHeightPathSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(metadata={"example": 256})
    height = marshmallow.fields.Int(metadata={"example": 256})


class UserPreviewPicturePathSchema(UserPicturePathSchema, WidthAndHeightPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserPreviewPicturePath(**data)


class AllowedJpgPreviewSizesSchema(marshmallow.Schema):
    width = marshmallow.fields.Int(metadata={"example": 256})
    height = marshmallow.fields.Int(metadata={"example": 256})


class AllowedJpgPreviewDimSchema(marshmallow.Schema):
    restricted = marshmallow.fields.Bool()
    dimensions = marshmallow.fields.Nested(AllowedJpgPreviewSizesSchema, many=True)


class WorkspaceAndContentRevisionIdPathSchema(
    WorkspaceIdPathSchema, ContentIdPathSchema, RevisionIdPathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WorkspaceAndContentRevisionPath(**data)


class FilePathSchema(WorkspaceAndContentIdPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FilePath(**data)


class FileRevisionPathSchema(WorkspaceAndContentRevisionIdPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FileRevisionPath(**data)


class FilePreviewSizedPathSchema(
    WorkspaceAndContentIdPathSchema, WidthAndHeightPathSchema, FilenamePathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FilePreviewSizedPath(**data)


class FileRevisionPreviewSizedPathSchema(
    WorkspaceAndContentRevisionIdPathSchema,
    WidthAndHeightPathSchema,
    FilenamePathSchema,
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return RevisionPreviewSizedPath(**data)


class UserWorkspaceAndContentIdPathSchema(
    UserIdPathSchema, WorkspaceIdPathSchema, ContentIdPathSchema
):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return UserWorkspaceAndContentPath(**data)


class UserWorkspaceIdPathSchema(UserIdPathSchema, WorkspaceIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WorkspaceAndUserPath(**data)


class UserContentIdPathSchema(UserIdPathSchema, ContentIdPathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ContentAndUserPath(**data)


class ReactionPathSchema(WorkspaceAndContentIdPathSchema):
    reaction_id = marshmallow.fields.Int(
        metadata={
            "example": 6,
            "description": "id of a valid reaction related to content content_id",
        },
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ReactionPath(**data)


class TagPathSchema(WorkspaceIdPathSchema):
    tag_id = marshmallow.fields.Int(
        metadata={"example": 6, "description": "id of a valid tag related to content content_id"},
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return TagPath(**data)


class ContentTagPathSchema(ContentIdPathSchema, TagPathSchema):
    pass


class CommentsPathSchema(WorkspaceAndContentIdPathSchema):
    comment_id = marshmallow.fields.Int(
        metadata={
            "example": 6,
            "description": "id of a valid comment related to content content_id",
        },
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return CommentPath(**data)


class CommentsPathFilenameSchema(CommentsPathSchema, FilenamePathSchema):
    @post_load
    def make_path_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return CommentPathFilename(**data)


class KnownMembersQuerySchema(marshmallow.Schema):
    acp = StrippedString(
        metadata={"example": "test", "description": "search text to query"}, required=False
    )

    exclude_user_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={"example": "1,5", "description": "comma separated list of excluded users"},
    )

    exclude_workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,4",
            "description": "comma separated list of excluded workspaces: members of this workspace are excluded from the result; cannot be used with include_workspace_ids",
        },
    )

    include_workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,4",
            "description": "comma separated list of included workspaces: members of this workspace are excluded from the result; cannot be used with exclude_workspace_ids",
        },
    )

    limit = marshmallow.fields.Int(
        dump_default=0,
        metadata={
            "example": 15,
            "description": "limit the number of results to this value, if not 0",
        },
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return KnownMembersQuery(**data)


class KnownContentsQuerySchema(marshmallow.Schema):
    acp = StrippedString(
        metadata={"example": "test", "description": "search text to query"}, required=True
    )

    limit = marshmallow.fields.Int(
        dump_default=DEFAULT_KNOWN_CONTENT_NB_LIMIT,
        metadata={
            "example": 15,
            "description": "limit the number of results to this value, if not 0",
        },
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return KnownContentsQuery(**data)


class FileQuerySchema(marshmallow.Schema):
    force_download = marshmallow.fields.Int(
        dump_default=0,
        metadata={
            "example": 1,
            "description": "force download of file or let browser decide if"
            "file can be read directly from browser",
        },
        validate=bool_as_int_validator,
    )
    revision_id = marshmallow.fields.Int(
        dump_default=None,
        metadata={
            "example": 42,
            "description": "Ignored by the server. Clients may set it to the current "
            "revision id so the URL changes whenever the revision does, preventing the "
            "browser from serving a stale cached response.",
        },
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FileQuery(**data)


class PageQuerySchema(FileQuerySchema):
    page = marshmallow.fields.Int(
        dump_default=1,
        metadata={"example": 2, "description": "allow to show a specific page of a pdf file"},
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return PageQuery(**data)


class FilterContentQuerySchema(BaseOptionalPaginatedQuerySchema):
    parent_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "0,4,5",
            "description": "comma separated list of parent ids,"
            " parent_id allow to filter items in a folder."
            " If not parent_ids at all, then return all contents."
            " If one parent_id to 0, then return root contents."
            " If set to another value, return all direct subcontents"
            " content of this folder"
            " If multiple value of parent_ids separated by comma,"
            " return mix of all content of all theses parent_ids",
        },
        dump_default="0",
    )
    namespaces_filter = StrippedString(
        validate=regex_string_as_list_of_string,
        metadata={"example": "content,upload", "description": "comma list of namespaces allowed"},
        dump_default=None,
        allow_none=True,
    )
    complete_path_to_id = marshmallow.fields.Int(
        validate=strictly_positive_int_validator,
        metadata={
            "example": 6,
            "description": "If setted with a correct content_id, this will"
            " add to parent_ids filter, all parent of given content_id,"
            " workspace root included. This param help to get "
            " content needed to show a complete folder tree "
            " from root to content.",
        },
        dump_default=None,
        allow_none=True,
    )
    show_archived = marshmallow.fields.Int(
        dump_default=0,
        metadata={
            "example": 0,
            "description": "if set to 1, then show archived contents."
            " Default is 0 - hide archived content",
        },
        validate=bool_as_int_validator,
    )
    show_deleted = marshmallow.fields.Int(
        dump_default=0,
        metadata={
            "example": 0,
            "description": "if set to 1, then show deleted contents."
            " Default is 0 - hide deleted content",
        },
        validate=bool_as_int_validator,
    )
    show_active = marshmallow.fields.Int(
        dump_default=1,
        metadata={
            "example": 1,
            "description": "if set to 1, then show active contents. "
            "Default is 1 - show active content."
            " Note: active content are content "
            "that is neither archived nor deleted. "
            "The reason for this parameter to exist is for example "
            "to allow to show only archived documents",
        },
        validate=bool_as_int_validator,
    )
    content_type = StrippedString(
        metadata={"example": ContentTypeSlug.ANY.value},
        dump_default=ContentTypeSlug.ANY.value,
        validate=all_content_types_validator,
    )
    label = StrippedString(
        dump_default=None,
        allow_none=True,
        metadata={"example": "myfilename", "description": "Filter by content label"},
    )
    sort = EnumField(
        ContentSortOrder,
        load_default=ContentSortOrder.LABEL_ASC,
        metadata={
            "description": "Sort order of the returned contents. Default is to sort by labels. "
            f"Possible values are: {', '.join(so.value for so in ContentSortOrder)}"
        },
    )

    @post_load
    def make_content_filter(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ContentFilter(**data)


class ContentIdsQuerySchema(marshmallow.Schema):
    content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={"example": "1,5", "description": "comma separated list of contents ids"},
    )

    @post_load
    def make_content_ids(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ContentIdsQuery(**data)


###


class RoleUpdateSchema(marshmallow.Schema):
    role = StrippedString(
        required=True, metadata={"example": "contributor"}, validate=user_role_validator
    )

    @post_load
    def make_role(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return RoleUpdate(**data)


class WorkspaceMemberInviteSchema(marshmallow.Schema):
    role = StrippedString(
        metadata={"example": "contributor"}, validate=user_role_validator, required=True
    )
    user_id = marshmallow.fields.Int(metadata={"example": 5}, dump_default=None, allow_none=True)
    user_email = RFCEmail(
        metadata={"example": "suri@cate.fr"},
        dump_default=None,
        allow_none=True,
        validate=user_email_validator,
    )
    user_username = StrippedString(
        metadata={"example": "The-John_Doe42"},
        dump_default=None,
        allow_none=True,
        validate=user_username_validator,
    )

    @post_load
    def make_workspace_member_invite(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
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
        metadata={"example": "hello@tracim.fr"},
        dump_default=None,
        allow_none=True,
        validate=user_email_validator,
    )

    username = StrippedString(
        metadata={"example": "The-John_Doe42"},
        dump_default=None,
        allow_none=True,
        validate=user_username_validator,
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ResetPasswordRequest(**data)

    # TODO 2020-06-11 - RJ: duplicated code across this file
    @marshmallow.validates_schema(pass_original=True)
    def validate_email_and_username(self, data: dict, original_data: dict, **kwargs) -> None:
        if not original_data.get("email") and not original_data.get("username"):
            raise marshmallow.ValidationError("email or username required")


class ResetPasswordCheckTokenSchema(marshmallow.Schema):
    email = TracimEmail(
        required=True, metadata={"example": "hello@tracim.fr"}, validate=user_email_validator
    )
    reset_password_token = String(
        metadata={"description": "token to reset password of given user"}, required=True
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ResetPasswordCheckToken(**data)


class ResetPasswordModifySchema(marshmallow.Schema):
    email = TracimEmail(
        required=True, metadata={"example": "hello@tracim.fr"}, validate=user_email_validator
    )
    reset_password_token = String(
        metadata={"description": "token to reset password of given user"}, required=True
    )
    new_password = String(
        metadata={"example": "8QLa$<w"}, required=True, validate=user_password_validator
    )
    new_password2 = String(
        metadata={"example": "8QLa$<w"}, required=True, validate=user_password_validator
    )

    @post_load
    def make_object(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ResetPasswordModify(**data)


class BasicAuthSchema(marshmallow.Schema):
    email = TracimEmail(
        metadata={"example": "hello@tracim.fr"},
        required=False,
        validate=user_email_validator,
        allow_none=True,
    )
    username = String(
        metadata={"example": "My-Power_User99"},
        required=False,
        validate=user_username_validator,
        allow_none=True,
    )
    password = String(
        metadata={"example": "8QLa$<w"},
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
    def make_login(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return LoginCredentials(**data)


class LoginOutputHeaders(marshmallow.Schema):
    class Meta:
        unknown = marshmallow.EXCLUDE

    expire_after = StrippedString()


class WorkspaceModifySchema(marshmallow.Schema):
    label = StrippedString(
        required=False,
        metadata={"example": "My Workspace"},
        validate=workspace_label_length_validator,
        dump_default=None,
        allow_none=True,
    )
    description = StrippedString(
        required=False,
        metadata={"example": "A super description of my workspace."},
        dump_default=None,
        allow_none=True,
    )
    agenda_enabled = marshmallow.fields.Bool(
        required=False,
        dump_default=None,
        metadata={"description": "has workspace has an associated agenda ?"},
        allow_none=True,
    )
    public_upload_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={
            "description": "is workspace allowing manager to give access external user"
            "to upload file into it ?"
        },
        dump_default=None,
        allow_none=True,
    )
    public_download_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={
            "description": "is workspace allowing manager to give access external user"
            "to some file into it ?"
        },
        dump_default=None,
        allow_none=True,
    )
    default_user_role = StrippedString(
        metadata={
            "example": WorkspaceRoles.READER.slug,
            "description": "default role for new users in this workspace",
        },
        validate=user_role_validator,
        required=False,
        allow_none=True,
        dump_default=None,
    )
    publication_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={
            "description": "define whether a user can create and view publications in this workspace"
        },
        dump_default=None,
        allow_none=True,
    )

    @post_load
    def make_workspace_modifications(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WorkspaceUpdate(**data)


class WorkspaceCreationSchema(marshmallow.Schema):
    label = StrippedString(
        required=True,
        metadata={"example": "My Workspace"},
        validate=workspace_label_length_validator,
    )
    description = StrippedString(
        required=True, metadata={"example": "A super description of my workspace."}
    )
    agenda_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={"description": "has workspace has an associated agenda ?"},
        dump_default=True,
    )
    access_type = StrippedString(
        metadata={"example": WorkspaceAccessType.CONFIDENTIAL.value},
        validate=workspace_access_type_validator,
        required=True,
    )
    default_user_role = StrippedString(
        metadata={
            "example": WorkspaceRoles.READER.slug,
            "description": "default role for new users in this workspace",
        },
        validate=user_role_validator,
        required=True,
    )
    public_upload_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={
            "description": "is workspace allowing manager to give access external user"
            "to upload file into it ?"
        },
        dump_default=True,
    )
    public_download_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={
            "description": "is workspace allowing manager to give access external user"
            "to some file into it ?"
        },
        dump_default=True,
    )
    parent_id = marshmallow.fields.Int(
        metadata={"example": 42, "description": "id of the parent workspace id."},
        allow_none=True,
        dump_default=None,
        required=False,
        validate=positive_int_validator,
    )
    publication_enabled = marshmallow.fields.Bool(
        required=False,
        metadata={
            "description": "define whether a user can create and view publications in this workspace"
        },
        dump_default=None,
        allow_none=True,
    )

    @post_load
    def make_workspace_modifications(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return WorkspaceCreate(**data)


class NoContentSchema(marshmallow.Schema):
    class Meta:
        description = "Empty Schema"

    pass


class WorkspaceMenuEntrySchema(marshmallow.Schema):
    slug = StrippedString(metadata={"example": "markdown-pages"})
    label = StrippedString(metadata={"example": "Markdown Documents"})
    route = StrippedString(
        metadata={
            "example": "/ui/workspaces/{workspace_id}/agenda",
            "description": "the route is the frontend route. "
            "It may include workspace_id "
            "which must be replaced on backend size "
            "(the route must be ready-to-use)",
        },
    )
    fa_icon = StrippedString(
        metadata={
            "example": "far fa-file-alt",
            "description": "CSS class of the icon. Example: far fa-file-alt for using Fontawesome far fa-file-alt icon",
        },
    )
    hexcolor = StrippedString(
        metadata={"example": "#F0F9DC", "description": "Hexadecimal color of the entry."}
    )

    class Meta:
        description = "Entry element of a workspace menu"


class WorkspaceDigestSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(
        metadata={"example": 4}, validate=strictly_positive_int_validator
    )
    slug = StrippedString(metadata={"example": "intranet"})
    label = StrippedString(metadata={"example": "Intranet"})


# NOTE - SG - 2021-04-29 - Used to avoid transmitting description in all TLMs
class WorkspaceWithoutDescriptionSchema(WorkspaceDigestSchema):
    access_type = StrippedString(
        metadata={"example": WorkspaceAccessType.CONFIDENTIAL.value},
        validate=workspace_access_type_validator,
        required=True,
    )
    default_user_role = StrippedString(
        validate=user_role_validator,
        required=True,
        metadata={
            "example": WorkspaceRoles.READER.slug,
            "description": "default role for new users in this workspace",
        },
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "Workspace creation date"}
    )
    owner = marshmallow.fields.Nested(UserDigestSchema(), allow_none=True)
    sidebar_entries = marshmallow.fields.Nested(WorkspaceMenuEntrySchema, many=True)
    is_deleted = marshmallow.fields.Bool(metadata={"example": False}, dump_default=False)
    agenda_enabled = marshmallow.fields.Bool(metadata={"example": True}, dump_default=True)
    public_upload_enabled = marshmallow.fields.Bool(
        metadata={
            "description": "is workspace allowing manager to give access external user"
            "to upload file into it ?"
        },
        dump_default=True,
    )
    public_download_enabled = marshmallow.fields.Bool(
        metadata={
            "description": "is workspace allowing manager to give access external user"
            "to some file into it ?"
        },
        dump_default=True,
    )
    parent_id = marshmallow.fields.Int(
        metadata={"example": 42, "description": "id of the parent workspace id."},
        allow_none=True,
        required=True,
        validate=positive_int_validator,
    )
    publication_enabled = marshmallow.fields.Bool(
        dump_default=True,
        metadata={
            "description": "define whether a user can create and view publications in this workspace"
        },
    )
    number_of_members = marshmallow.fields.Int(
        metadata={"example": 42, "description": "number of members of a space"},
        allow_none=False,
        required=True,
        validate=positive_int_validator,
    )


class WorkspaceSchema(WorkspaceWithoutDescriptionSchema):
    description = StrippedString(metadata={"example": "All intranet data."})

    class Meta:
        description = "Full workspace information"


class EmailNotificationTypeSchema(marshmallow.Schema):
    email_notification_type = StrippedString(
        metadata={
            "example": EmailNotificationType.default().name,
            "description": "Type of email notification for a specific space."
            " Possible values are: {', '.join(v.name for v in EmailNotificationType)}",
        },
    )


class WorkspaceMemberDigestSchema(EmailNotificationTypeSchema):
    role = StrippedString(metadata={"example": "contributor"}, validate=user_role_validator)


class UserWorkspaceConfigSchema(WorkspaceMemberDigestSchema):
    user_id = marshmallow.fields.Int(
        metadata={"example": 3}, validate=strictly_positive_int_validator
    )
    is_active = marshmallow.fields.Bool()
    user = marshmallow.fields.Nested(UserDigestSchema())
    workspace = marshmallow.fields.Nested(
        WorkspaceWithoutDescriptionSchema(exclude=("number_of_members",))
    )
    workspace_id = marshmallow.fields.Int(
        metadata={"example": 4}, validate=strictly_positive_int_validator
    )

    class Meta:
        description = "Workspace Member information"


class WorkspaceRoleDigestSchema(marshmallow.Schema):
    role = StrippedString(metadata={"example": "contributor"}, validate=user_role_validator)


class UserWorkspaceRoleSchema(WorkspaceRoleDigestSchema):
    user_id = marshmallow.fields.Int(
        metadata={"example": 3}, validate=strictly_positive_int_validator
    )
    is_active = marshmallow.fields.Bool()
    user = marshmallow.fields.Nested(UserDigestSchema())
    workspace_id = marshmallow.fields.Int(
        metadata={"example": 4}, validate=strictly_positive_int_validator
    )


class WorkspaceWithUserMemberSchema(WorkspaceSchema):
    members = marshmallow.fields.Nested(UserWorkspaceConfigSchema(many=True))


class UserConfigSchema(marshmallow.Schema):
    parameters = marshmallow.fields.Dict(
        metadata={"description": "parameters present in the user's configuration."}
    )


class UserCustomPropertiesSchema(marshmallow.Schema):
    json_schema = marshmallow.fields.Dict(
        metadata={"description": "json schema used for user custom properties"},
        required=True,
        allow_none=False,
    )


class UserCustomPropertiesUiSchema(marshmallow.Schema):
    ui_schema = marshmallow.fields.Dict(
        metadata={"description": "ui schema used for user custom properties"},
        required=True,
        allow_none=False,
    )


class WorkspaceDiskSpaceSchema(marshmallow.Schema):
    workspace_id = marshmallow.fields.Int(
        metadata={"example": 4}, validate=strictly_positive_int_validator
    )
    used_space = marshmallow.fields.Int(
        metadata={
            "description": "used space in the workspace in bytes."
            " if owner allowed space limit or  workspace allowed_space limit is reach,"
            " no file can be created/updated in this workspace."
        }
    )
    allowed_space = marshmallow.fields.Int(
        metadata={
            "description": "allowed space in workspace in bytes. "
            " if limit is reach, no file can be created/updated "
            " in any user owned workspaces. 0 mean no limit."
        }
    )
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema(), attribute="workspace_in_context")


class WorkspaceMemberCreationSchema(UserWorkspaceConfigSchema):
    newly_created = marshmallow.fields.Bool(
        exemple=False,
        metadata={
            "description": "Is the user completely new " "(and account was just created) or not ?"
        },
    )


class TimezoneSchema(marshmallow.Schema):
    name = StrippedString(metadata={"example": "Europe/London"})


class WorkspaceAccessTypeSchema(marshmallow.Schema):
    items = marshmallow.fields.List(String(metadata={"example": "confidential"}), required=True)


class GetUsernameAvailability(marshmallow.Schema):
    username = StrippedString(metadata={"example": "The-powerUser_42"}, required=True)


class UsernameAvailability(marshmallow.Schema):
    username = StrippedString(metadata={"example": "The-powerUser_42"}, required=True)
    available = marshmallow.fields.Boolean(required=True)


class AboutSchema(marshmallow.Schema):
    name = StrippedString(metadata={"example": "Tracim", "description": "Software name"})
    version = StrippedString(metadata={"example": "2.6", "description": "Version of Tracim"})
    build_version = StrippedString(
        metadata={"example": "release_02.06.00", "description": "Build Version of Tracim"}
    )
    datetime = marshmallow.fields.DateTime(format=DATETIME_FORMAT)
    website = marshmallow.fields.URL()
    database_schema_version = StrippedString(
        metadata={"example": "8382e5a19f0d", "description": "Database schema version"},
        allow_none=True,
    )


class ReservedUsernamesSchema(marshmallow.Schema):
    items = marshmallow.fields.List(String(metadata={"example": "all"}), required=True)


class ErrorCodeSchema(marshmallow.Schema):
    name = marshmallow.fields.Str()
    code = marshmallow.fields.Int()


class ApplicationSchema(marshmallow.Schema):
    label = StrippedString(metadata={"example": "Agenda"})
    slug = StrippedString(metadata={"example": "agenda"})
    fa_icon = StrippedString(
        metadata={
            "example": "far fa-file",
            "description": "CSS class of the icon. Example: far fa-file for using Fontawesome far fa-file icon",
        },
    )
    hexcolor = StrippedString(
        metadata={
            "example": "#FF0000",
            "description": "HTML encoded color associated to the application. Example:#FF0000 for red",
        },
    )
    is_active = marshmallow.fields.Boolean(
        metadata={
            "example": True,
            "description": "if true, the application is in use in the context",
        }
    )
    config = marshmallow.fields.Dict()

    class Meta:
        description = "Tracim Application informations"


class StatusSchema(marshmallow.Schema):
    slug = StrippedString(
        metadata={
            "example": "open",
            "description": "the slug represents the type of status. "
            "Statuses are open, closed-validated, closed-invalidated, closed-deprecated",
        },
    )
    global_status = StrippedString(
        metadata={"example": "open", "description": "global_status: open, closed"},
        validate=content_global_status_validator,
    )
    label = StrippedString(metadata={"example": "Opened"})
    fa_icon = StrippedString(metadata={"example": "fa-check"})
    hexcolor = StrippedString(metadata={"example": "#0000FF"})


class ContentTypeSchema(marshmallow.Schema):
    slug = StrippedString(metadata={"example": "pagehtml"}, validate=all_content_types_validator)
    fa_icon = StrippedString(
        metadata={
            "example": "far fa-file-alt",
            "description": "CSS class of the icon. Example: far fa-file for using Fontawesome far fa-file icon",
        },
    )
    hexcolor = StrippedString(
        metadata={
            "example": "#FF0000",
            "description": "HTML encoded color associated to the application. Example:#FF0000 for red",
        },
    )
    label = StrippedString(metadata={"example": "Notes"})
    creation_label = StrippedString(metadata={"example": "Write a note"})
    available_statuses = marshmallow.fields.Nested(StatusSchema, many=True)


class ContentMoveSchema(marshmallow.Schema):
    # TODO - G.M - 30-05-2018 - Read and apply this note
    # Note:
    # if the new workspace is different, then the backend
    # must check if the user is allowed to move to this workspace
    # (the user must be content manager of both workspaces)
    new_parent_id = marshmallow.fields.Int(
        metadata={"example": 42, "description": "id of the new parent content id."},
        allow_none=True,
        required=True,
        validate=positive_int_validator,
    )
    new_workspace_id = marshmallow.fields.Int(
        metadata={"example": 2, "description": "id of the new workspace id."},
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_move_params(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return MoveParams(**data)


class ContentCreationSchema(marshmallow.Schema):
    label = StrippedString(
        required=True,
        metadata={
            "example": "contract for client XXX",
            "description": "Title of the content to create",
        },
        validate=content_label_length_validator,
    )
    content_type = StrippedString(
        required=True, metadata={"example": "html-document"}, validate=all_content_types_validator
    )
    content_namespace = EnumField(
        ContentNamespaces, load_default=ContentNamespaces.CONTENT, metadata={"example": "content"}
    )
    parent_id = marshmallow.fields.Integer(
        metadata={
            "example": 35,
            "description": "content_id of parent content, if content should be placed "
            "in a folder, this should be folder content_id.",
        },
        allow_none=True,
        dump_default=None,
        validate=strictly_positive_int_validator,
    )
    template_id = marshmallow.fields.Integer(
        metadata={
            "example": 42,
            "description": "content_id of template content, if content should be created "
            "from a template, this should be template content_id.",
        },
        allow_none=True,
        dump_default=None,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_content_creation(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ContentCreation(**data)


class ContentMinimalSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    label = StrippedString(metadata={"example": "Intervention Report 12"})
    slug = StrippedString(metadata={"example": "intervention-report-12"})
    content_type = StrippedString(
        metadata={"example": "html-document"}, validate=all_content_types_validator
    )


class UserInfoContentAbstractSchema(marshmallow.Schema):
    author = marshmallow.fields.Nested(UserDigestSchema)
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)


class ContentDigestSchema(UserInfoContentAbstractSchema):
    assignee_id = marshmallow.fields.Int(
        metadata={"example": 42},
        allow_none=True,
        dump_default=None,
        validate=strictly_positive_int_validator,
    )
    content_namespace = EnumField(ContentNamespaces, metadata={"example": "content"})
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    current_revision_id = marshmallow.fields.Int(metadata={"example": 12})
    current_revision_type = StrippedString(
        metadata={"example": ActionDescription.CREATION}, validate=action_description_validator
    )
    slug = StrippedString(metadata={"example": "intervention-report-12"})
    parent_id = marshmallow.fields.Int(
        metadata={"example": 34},
        allow_none=True,
        dump_default=None,
        validate=positive_int_validator,
    )
    workspace_id = marshmallow.fields.Int(
        metadata={"example": 19}, validate=strictly_positive_int_validator
    )
    label = StrippedString(metadata={"example": "Intervention Report 12"})
    content_type = StrippedString(
        metadata={"example": "html-document"}, validate=all_content_types_validator
    )
    sub_content_types = marshmallow.fields.List(
        StrippedString(metadata={"example": "html-content"}, validate=all_content_types_validator),
        metadata={
            "description": "list of content types allowed as sub contents. "
            "This field is required for folder contents, "
            "set it to empty list in other cases"
        },
    )
    status = StrippedString(
        validate=content_status_validator,
        metadata={
            "example": "closed-deprecated",
            "description": "this slug is found in content_type available statuses",
        },
        dump_default=open_status,
    )
    is_archived = marshmallow.fields.Bool(metadata={"example": False}, dump_default=False)
    is_deleted = marshmallow.fields.Bool(metadata={"example": False}, dump_default=False)
    is_editable = marshmallow.fields.Bool(metadata={"example": True}, dump_default=True)
    is_template = marshmallow.fields.Bool(metadata={"example": False}, dump_default=False)
    show_in_ui = marshmallow.fields.Bool(
        metadata={
            "example": True,
            "description": "if false, then do not show content in the treeview. "
            "This may his maybe used for specific contents or "
            "for sub-contents. Default is True. "
            "In first version of the API, this field is always True",
        },
    )
    file_extension = StrippedString(metadata={"example": ".txt"})
    filename = StrippedString(metadata={"example": "nameofthefile.txt"})
    modified = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        metadata={
            "description": "date of last modification of content."
            " note: this does not include comments or any subcontents."
        },
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "Content creation date"}
    )
    actives_shares = marshmallow.fields.Int(
        metadata={"description": "number of active share on file"}, validate=positive_int_validator
    )


class PaginatedContentDigestSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(ContentDigestSchema, many=True)


class FavoriteContentSchema(marshmallow.Schema):
    """Schema for the API endpoint, containing both user and content"""

    user_id = marshmallow.fields.Int(
        metadata={"example": 3}, validate=strictly_positive_int_validator
    )
    user = marshmallow.fields.Nested(UserDigestSchema())
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    content = marshmallow.fields.Nested(ContentDigestSchema, allow_none=True)
    original_label = StrippedString(metadata={"example": "Intervention Report 12"})
    original_type = StrippedString(
        metadata={"example": "html-document"}, validate=all_content_types_validator
    )


class PaginatedFavoriteContentSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(FavoriteContentSchema, many=True)


class ReadStatusSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    read_by_user = marshmallow.fields.Bool(metadata={"example": False}, dump_default=False)


#####
# Content
#####
class MessageContentSchema(ContentDigestSchema):
    description = StrippedString(
        required=True, metadata={"description": "raw text or html description of the content"}
    )
    version_number = marshmallow.fields.Int(
        metadata={
            "description": "Version number of the content, starting at 1 and incremented by 1 for each revision"
        },
        validate=strictly_positive_int_validator,
    )


class ContentSchema(MessageContentSchema):
    raw_content = StrippedString(
        required=True,
        metadata={
            "description": "Content of the object, may be raw text or <b>html</b> for example"
        },
    )


class ToDoSchema(marshmallow.Schema):
    author = marshmallow.fields.Nested(UserDigestSchema())
    assignee = marshmallow.fields.Nested(UserDigestSchema())
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "Content creation date"}
    )
    parent = marshmallow.fields.Nested(ContentMinimalSchema())
    raw_content = StrippedString(
        required=True,
        metadata={
            "description": "Content of the object, may be raw text or <b>html</b> for example"
        },
    )
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema())
    status = StrippedString(
        validate=content_status_validator,
        metadata={
            "example": "closed-deprecated",
            "description": "this slug is found in content_type available statuses",
        },
        dump_default=open_status,
    )


class PreviewInfoSchema(marshmallow.Schema):
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    revision_id = marshmallow.fields.Int(
        metadata={"example": 12}, validate=strictly_positive_int_validator
    )
    page_nb = marshmallow.fields.Int(
        metadata={"example": 1, "description": "number of pages, return null value if unaivalable"},
        allow_none=True,
    )
    has_pdf_preview = marshmallow.fields.Bool(
        metadata={"example": True, "description": "true if a pdf preview is available or false"}
    )
    has_jpeg_preview = marshmallow.fields.Bool(
        metadata={"example": True, "description": "true if a jpeg preview is available or false"}
    )


class MessageFileContentSchema(ContentSchema):
    mimetype = StrippedString(
        metadata={"example": "image/jpeg", "description": "file content mimetype"}, required=True
    )
    size = marshmallow.fields.Int(
        metadata={
            "example": 1024,
            "description": "file size in byte, return null value if unavailable",
        },
        allow_none=True,
    )


class FileContentSchema(MessageFileContentSchema):
    raw_content = StrippedString(
        required=True,
        metadata={
            "description": "Content of the object, may be raw text or <b>html</b> for example"
        },
    )


#####
# Revision
#####


class RevisionSchema(ContentDigestSchema):
    revision_id = marshmallow.fields.Int(
        metadata={"example": 12}, validate=strictly_positive_int_validator
    )
    revision_type = StrippedString(
        metadata={"example": ActionDescription.CREATION}, validate=action_description_validator
    )
    description = StrippedString(
        required=True, metadata={"description": "raw text or html description of the content"}
    )
    raw_content = StrippedString(
        required=True,
        metadata={
            "description": "Content of the object, may be raw text or <b>html</b> for example"
        },
    )
    version_number = marshmallow.fields.Int(
        validate=strictly_positive_int_validator,
        metadata={
            "example": 123,
            "description": "version of the revision, starting at 1 and incremented by 1 for each revision",
        },
        allow_none=True,
    )


class RevisionPageSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(RevisionSchema(many=True))


class FileRevisionSchema(RevisionSchema):
    mimetype = StrippedString(
        metadata={"example": "image/jpeg", "description": "file content mimetype"}, required=True
    )
    size = marshmallow.fields.Int(
        metadata={
            "example": 1024,
            "description": "file size in byte, return null value if unaivalable",
        },
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
    reaction_id = marshmallow.fields.Int(
        metadata={"example": 12}, validate=strictly_positive_int_validator
    )
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    author = marshmallow.fields.Nested(UserDigestSchema)
    value = StrippedString(metadata={"example": "😀"})
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "reaction creation date"}
    )


class TagSchema(marshmallow.Schema):
    tag_id = marshmallow.fields.Int(
        metadata={"example": 12}, validate=strictly_positive_int_validator
    )
    workspace_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    tag_name = StrippedString(metadata={"example": "todo"})


class MessageCommentSchema(marshmallow.Schema):
    """
    Schema for comments without raw_content
    """

    author = marshmallow.fields.Nested(UserDigestSchema)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "comment creation date"}
    )
    modified = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "Comment last edition date"}
    )
    last_modifier = marshmallow.fields.Nested(UserDigestSchema)
    content_id = marshmallow.fields.Int(
        metadata={"example": 6}, validate=strictly_positive_int_validator
    )
    content_type = StrippedString(
        metadata={"example": "html-document"}, validate=all_content_types_validator
    )
    description = StrippedString(metadata={"example": "This is a description"})
    parent_content_namespace = EnumField(
        ContentNamespaces, load_default=ContentNamespaces.CONTENT, metadata={"example": "content"}
    )
    parent_content_type = String(
        metadata={"example": "html-document"}, validate=all_content_types_validator
    )
    parent_id = marshmallow.fields.Int(metadata={"example": 34}, validate=positive_int_validator)
    parent_label = String(metadata={"example": "This is a label"})


class CommentSchema(MessageCommentSchema):
    """
    Schema for comments with raw_content
    """

    raw_content = StrippedString(metadata={"example": "<p>This is just an html comment!</p>"})


class SetCommentSchema(marshmallow.Schema):
    raw_content = StrippedString(
        metadata={"example": "<p>This is just an html comment !</p>"},
        validate=not_empty_string_validator,
        required=True,
    )

    @post_load()
    def create_comment(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return CommentCreation(**data)


class SetReactionSchema(marshmallow.Schema):
    value = StrippedString(
        metadata={"example": "😀"},
        validate=reaction_value_length_validator,
        required=True,
    )

    @post_load()
    def create_reaction(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ReactionCreation(**data)


class SetTagByNameSchema(marshmallow.Schema):
    tag_name = StrippedString(
        metadata={"example": "todo"}, validate=tag_length_validator, required=True
    )

    @post_load()
    def create_tag(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return TagCreation(**data)


class ContentModifyAbstractSchema(marshmallow.Schema):
    label = StrippedString(
        required=False,
        metadata={"example": "contract for client XXX", "description": "New title of the content"},
        validate=content_label_length_validator,
    )
    description = StrippedString(
        required=False, metadata={"description": "raw text or html description of the content"}
    )
    raw_content = StrippedString(
        required=False,
        metadata={
            "description": "Content of the object, may be raw text or <b>html</b> for example"
        },
    )


class ContentModifyNamespaceAbstractSchema(marshmallow.Schema):
    content_namespace = StrippedString(
        required=True,
        metadata={"description": "Content_namespace of the object, raw text"},
    )


class ContentModifySchema(ContentModifyAbstractSchema):
    @post_load
    def text_based_content_update(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ContentUpdate(**data)


class ContentModifyNamespaceSchema(ContentModifyNamespaceAbstractSchema):
    @post_load
    def content_namespace_update(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return ContentNamespaceUpdate(**data)


class FolderContentModifySchema(ContentModifyAbstractSchema):
    sub_content_types = marshmallow.fields.List(
        StrippedString(metadata={"example": "html-document"}, validate=all_content_types_validator),
        metadata={"description": "list of content types allowed as sub contents."},
        required=False,
    )

    @post_load
    def folder_content_update(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FolderContentUpdate(**data)


class SetContentStatusSchema(marshmallow.Schema):
    status = StrippedString(
        validate=content_status_validator,
        metadata={
            "example": "closed-deprecated",
            "description": "this slug is found in content_type available statuses",
        },
        dump_default=open_status,
        required=True,
    )

    @post_load
    def set_status(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return SetContentStatus(**data)


class SetContentIsTemplateSchema(marshmallow.Schema):
    is_template = marshmallow.fields.Boolean(
        metadata={"description": "set content as a template"}, dump_default=False
    )

    @post_load
    def set_marked_as_template(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return SetContentIsTemplate(**data)


class TemplateQuerySchema(marshmallow.Schema):
    type = StrippedString(
        metadata={"example": "html-document"}, validate=all_content_types_validator, required=True
    )


class TargetLanguageSchema(marshmallow.Schema):
    code = marshmallow.fields.String(required=True, metadata={"example": "fr"})
    display = marshmallow.fields.String(required=True, metadata={"example": "Français"})


class CodeSampleLanguageSchema(marshmallow.Schema):
    value = marshmallow.fields.String(required=True, metadata={"example": "markup"})
    text = marshmallow.fields.String(required=True, metadata={"example": "Markup"})


class RoleSchema(marshmallow.Schema):
    level = marshmallow.fields.String(required=True, metadata={"example": "1"})
    label = marshmallow.fields.String(required=True, metadata={"example": "Reader"})


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
    limitation__max_non_guest_users = marshmallow.fields.Int()
    limitation__max_guest_users = marshmallow.fields.Int()
    limitation__max_guest_user_space_nb = marshmallow.fields.Int()
    gantt_view__enabled = marshmallow.fields.Bool()


class ConditionFileSchema(marshmallow.Schema):
    title = marshmallow.fields.String()
    url = marshmallow.fields.URL()


class UsageConditionsSchema(marshmallow.Schema):
    items = marshmallow.fields.Nested(ConditionFileSchema, many=True)


class EventSchema(marshmallow.Schema):
    """Event structure transmitted to workers."""

    fields = marshmallow.fields.Dict()
    event_id = marshmallow.fields.Int(
        metadata={"example": 42}, validate=strictly_positive_int_validator
    )
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
    event_id = marshmallow.fields.Int(
        metadata={"example": 42}, validate=strictly_positive_int_validator
    )
    event_type = marshmallow.fields.String(metadata={"example": "content.modified"})
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "created date"}
    )
    read = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "read date"}, allow_none=True
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
        metadata={
            "example": "fr",
            "description": "source language of translation, by default set to auto",
        },
        load_default=AUTODETECT_LANG,
        dump_default=AUTODETECT_LANG,
        allow_none=False,
    )
    target_language_code = marshmallow.fields.String(
        metadata={"example": "en", "description": "destination language of translation"},
        required=True,
        allow_none=False,
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any], **kwargs) -> TranslationQuery:
        return TranslationQuery(**data)


class GetLiveMessageQuerySchema(BasePaginatedQuerySchema):
    """Possible query parameters for the GET messages endpoint."""

    read_status = StrippedString(
        load_default=ReadStatus.ALL.value, validator=OneOf(ReadStatus.values())
    )
    include_event_types = EventTypeListField()
    exclude_event_types = EventTypeListField()
    exclude_author_ids = ExcludeAuthorIdsField
    include_not_sent = marshmallow.fields.Int(
        dump_default=0,
        metadata={
            "example": 0,
            "description": "if set to 1, then show not sent message."
            " Default is 0 - hide not sent message content",
        },
        validate=bool_as_int_validator,
    )
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,4",
            "description": "comma separated list of workspaces ids for event: events unrelated to theses workspaces are not included",
        },
    )
    related_to_content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,4",
            "description": "comma separated list of content_ids for event: events unrelated to these content are not included."
            "event of content itself or of direct children will be provided.",
        },
    )

    @post_load
    def live_message_query(self, data: typing.Dict[str, typing.Any], **kwargs) -> LiveMessageQuery:
        return LiveMessageQuery(**data)


class TracimLiveEventHeaderSchema(marshmallow.Schema):
    class Meta:
        unknown = marshmallow.EXCLUDE

    # TODO - G.M - 2020-05-14 - Add Filtering for text/event-stream mimetype with accept header,
    #  see: https://github.com/tracim/tracim/issues/3042
    accept = marshmallow.fields.String(required=True, data_key="Accept")


class TracimLiveEventQuerySchema(marshmallow.Schema):
    after_event_id = marshmallow.fields.Int(
        required=False, load_default=0, metadata={"example": 42}, validator=positive_int_validator
    )


# INFO - G.M - 2020-05-19 - This is only used for documentation
class PathSuffixSchema(marshmallow.Schema):
    path_suffix = marshmallow.fields.Str(
        required=False,
        dump_default="",
        metadata={
            "example": "/workspaces/1/email_notification_type",
            "description": 'any path, could include "/"',
        },
    )


class UserMessagesMarkAsReadQuerySchema(marshmallow.Schema):
    content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "1,4",
            "description": "Comma separated list of content ids. Every event related to these contents\
            will be marked as read.",
        },
    )
    event_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,5",
            "description": "Comma separated list of event ids. Every event ids will be marked as read.",
        },
    )
    parent_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "2,6",
            "description": "Comma separated list of parent content ids. Every event related to theses\
            parents will be marked as read.",
        },
    )
    space_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "7",
            "description": "Comma separated list of space ids. Every event related to theses space\
            will be marked as read.",
        },
    )

    @post_load
    def user_message_mark_as_read_query(
        self, data: typing.Dict[str, typing.Any], **kwargs
    ) -> UserMessagesMarkAsReadQuery:
        return UserMessagesMarkAsReadQuery(**data)


class UserMessagesSummaryQuerySchema(marshmallow.Schema):
    """Possible query parameters for the GET messages summary endpoint."""

    exclude_event_types = EventTypeListField()
    include_event_types = EventTypeListField()
    include_not_sent = marshmallow.fields.Int(
        dump_default=0,
        metadata={
            "example": 0,
            "description": "if set to 1, then show not sent message."
            " Default is 0 - hide not sent message content",
        },
        validate=bool_as_int_validator,
    )
    exclude_author_ids = ExcludeAuthorIdsField
    workspace_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,4",
            "description": "comma separated list of workspaces ids for event: events unrelated to theses workspaces are not included",
        },
    )
    related_to_content_ids = StrippedString(
        validate=regex_string_as_list_of_int,
        metadata={
            "example": "3,4",
            "description": "comma separated list of content_ids for event: events unrelated to these content are not included."
            "event of content itself or of direct children will be provided.",
        },
    )

    @post_load
    def message_summary_query(
        self, data: typing.Dict[str, typing.Any], **kwargs
    ) -> UserMessagesSummaryQuery:
        return UserMessagesSummaryQuery(**data)


class UserMessagesSummarySchema(marshmallow.Schema):
    messages_count = marshmallow.fields.Int(metadata={"example": 42})
    read_messages_count = marshmallow.fields.Int(metadata={"example": 30})
    unread_messages_count = marshmallow.fields.Int(metadata={"example": 12})
    user_id = marshmallow.fields.Int(
        metadata={"example": 3}, validate=strictly_positive_int_validator
    )
    user = marshmallow.fields.Nested(UserDigestSchema())


class WorkspaceSubscriptionSchema(marshmallow.Schema):
    state = StrippedString(
        metadata={"example": "pending"},
        validate=workspace_subscription_state_validator,
        attribute="state_slug",
    )
    created_date = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "subscription creation date"}
    )
    workspace = marshmallow.fields.Nested(WorkspaceDigestSchema())
    author = marshmallow.fields.Nested(UserDigestSchema())
    evaluation_date = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "evaluation date"}, allow_none=True
    )
    evaluator = marshmallow.fields.Nested(UserDigestSchema(), allow_none=True)


class UserIdSchema(marshmallow.Schema):
    """
    Simple user id schema
    """

    user_id = marshmallow.fields.Int(metadata={"example": 3}, required=True)


class GetUserFollowQuerySchema(BasePaginatedQuerySchema):
    """Possible query parameters for the GET following and followers endpoint."""

    user_id = marshmallow.fields.Int(
        metadata={"example": 42},
        validate=strictly_positive_int_validator,
        allow_none=True,
        dump_default=None,
    )

    @post_load
    def user_follow_query(self, data: typing.Dict[str, typing.Any], **kwargs) -> UserFollowQuery:
        return UserFollowQuery(**data)


class FollowedUsersSchemaPage(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(UserIdSchema, many=True)


class DeleteFollowedUserPathSchema(UserIdPathSchema):
    leader_id = marshmallow.fields.Int(
        required=True,
        metadata={"example": 4, "description": "id of a valid user"},
        validate=strictly_positive_int_validator,
    )


class AboutUserSchema(UserDigestSchema):
    followers_count = marshmallow.fields.Int(
        required=True,
        metadata={"example": 42, "description": "count of users following this user"},
        validate=positive_int_validator,
    )
    leaders_count = marshmallow.fields.Int(
        required=True,
        metadata={"example": 42, "description": "count of users followed by this user"},
        validate=positive_int_validator,
    )
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "User registration date"}
    )
    authored_content_revisions_count = marshmallow.fields.Int(
        required=True,
        metadata={"example": 23, "description": "count of revisions whose author is this user"},
        validate=positive_int_validator,
    )
    authored_content_revisions_space_count = marshmallow.fields.Int(
        required=True,
        metadata={
            "example": 12,
            "description": "count of spaces where this user authored at least one content revision",
        },
        validate=positive_int_validator,
    )


class CommentsPageQuerySchema(BaseOptionalPaginatedQuerySchema):
    sort = EnumField(
        ContentSortOrder,
        load_default=ContentSortOrder.CREATED_ASC,
        metadata={
            "description": "Order of the returned contents, default is to sort by creation date, older first"
        },
    )


class CommentsPageSchema(BasePaginatedSchemaPage):
    items = marshmallow.fields.Nested(CommentSchema, many=True)


class ContentRevisionsPageQuerySchema(BaseOptionalPaginatedQuerySchema):
    sort = EnumField(
        ContentSortOrder,
        load_default=ContentSortOrder.MODIFIED_ASC,
        metadata={
            "description": "Order of the returned revisions, default is to sort by modification (e.g. creation of the revision) date, older first"
        },
    )


###
# UserCall
###


class CreateUserCallSchema(marshmallow.Schema):
    callee_id = marshmallow.fields.Integer(
        metadata={"example": 42, "description": "Id of the user to call"}
    )


class UserCallSchema(marshmallow.Schema):
    call_id = marshmallow.fields.Integer(metadata={"example": 32, "description": "Id of the call"})
    caller = marshmallow.fields.Nested(
        UserDigestSchema, metadata={"description": "User who initiated the call"}
    )
    callee = marshmallow.fields.Nested(
        UserDigestSchema, metadata={"description": "User who has been called"}
    )
    state = EnumField(UserCallState)
    created = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT, metadata={"description": "Date of creation of the call"}
    )
    updated = marshmallow.fields.DateTime(
        format=DATETIME_FORMAT,
        metadata={"description": "date of last modification of the call."},
        data_key="modified",
    )
    url = marshmallow.fields.URL()


class UserIdCallIdPathSchema(UserIdPathSchema):
    call_id = marshmallow.fields.Integer(
        metadata={"example": 42, "description": "Id of the call to update"}
    )


class GetUserCallsQuerySchema(marshmallow.Schema):
    state = EnumField(
        UserCallState,
        load_default=None,
        dump_default=None,
        required=False,
        metadata={"description": "If given, only return calls with the given state"},
    )


class UserCallsSchema(marshmallow.Schema):
    items = marshmallow.fields.Nested(UserCallSchema(many=True))


class UpdateUserCallStateSchema(marshmallow.Schema):
    state = EnumField(UserCallState, metadata={"description": "New call state"})


###
# Patch
###


class FilePatchSchema(marshmallow.Schema):
    from_revision = marshmallow.fields.Int(
        metadata={
            "example": 42,
            "description": "The revision use to retrieve the original file.",
        },
        required=True,
    )
    to_revision = marshmallow.fields.Int(
        metadata={
            "example": 43,
            "description": "The revision use to retrieve the final file.",
        },
        required=True,
    )
    patch_content = marshmallow.fields.List(
        marshmallow.fields.Dict(),  # FIXME: this type will be different with non-JSON content
        metadata={
            "example": {},
            "description": "The content of the patch.",
        },
        required=True,
    )


class FilePatchQuerySchema(marshmallow.Schema):
    from_revision_id = marshmallow.fields.Int(
        metadata={
            "example": 42,
            "description": "This revision will be used to retrieve the file used "
            "as the origin of the patch. It will be compared with the file defined "
            "by the to_revision_id parameter.",
        },
        required=True,
        validate=strictly_positive_int_validator,
    )
    to_revision_id = marshmallow.fields.Int(
        metadata={
            "example": 43,
            "description": "This revision will be used to compare with the file "
            "defined as the origin by the from_revision_id parameter. This revision "
            "must be greater than the original revision.",
        },
        required=True,
        validate=strictly_positive_int_validator,
    )

    @post_load
    def make_query(self, data: typing.Dict[str, typing.Any], **kwargs) -> object:
        return FilePatchQuery(**data)
