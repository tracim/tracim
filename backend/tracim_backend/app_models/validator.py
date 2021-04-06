import re
import typing

from marshmallow import ValidationError
from marshmallow.validate import Length
from marshmallow.validate import OneOf
from marshmallow.validate import Range
from marshmallow.validate import Regexp

# TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var
# of tracim_backend, Be careful all_content_types_validator is a global_var !
from tracim_backend.app_models.contents import GlobalStatus
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.applications.agenda.models import AgendaType
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.lib.utils.dict_parsing import validate_simple_dict
from tracim_backend.lib.utils.utils import validate_page_token
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.data import WorkspaceSubscriptionState


class TracimValidator(object):
    """
    Validate many fields with value and validator Callable.
    """

    def __init__(self) -> None:
        self.validators = {}  # type: typing.Dict[str, typing.Callable[[typing.Any], None]]
        self.values = {}  # type: typing.Dict[str, str]

    def add_validator(
        self,
        field: str,
        value: typing.Optional[str],
        validator: typing.Callable[[typing.Any], None],
    ) -> bool:
        """
        Add validator, doesn't accept None as field value
        :param field: name of the field
        :param value: value of the field, to check with validator
        :param validator: validator for the field
        :return: True if validator correctly added, false if validator can not
        be added.
        """
        if value is None:
            return False

        self.validators[field] = validator
        self.values[field] = value
        return True

    def validate_all(self) -> bool:
        """
        Validate all validators given
        :return: true if success, TracimValidationFailed exception if validation
        failed.
        """
        errors = []
        for field, value in self.values.items():

            try:
                self.validators[field](value)
            except ValidationError as e:
                errors.append(
                    "Validation of {field} failed : {msg}".format(field=field, msg=str(e))
                )
        if errors:
            raise TracimValidationFailed(str(errors))
        return True


# TODO - G.M - 2018-11-29 - Refactor validator system

# Static Validators #

# Int
bool_as_int_validator = Range(min=0, max=1, error="Value must be 0 or 1")
strictly_positive_int_validator = Range(min=1, error="Value must be positive")
positive_int_validator = Range(min=0, error="Value must be positive or 0")

# String
# string matching list of int separated by ','
regex_string_as_list_of_int = Regexp(regex=(re.compile("^(\d+(,\d+)*)?$")))  # noqa: W605
# string matching list of string (without',') separated by ','
regex_string_as_list_of_string = Regexp(regex=(re.compile("^([^,]+(,[^,]+)*)?$")))  # noqa: W605

not_empty_string_validator = Length(min=1)
action_description_validator = OneOf(ActionDescription.allowed_values())
workspace_access_type_validator = OneOf([access_type.value for access_type in WorkspaceAccessType])
workspace_subscription_state_validator = OneOf(
    [subscription_state.value for subscription_state in WorkspaceSubscriptionState]
)
content_global_status_validator = OneOf([status.value for status in GlobalStatus])
content_status_validator = OneOf(content_status_list.get_all_slugs_values())
user_profile_validator = OneOf(Profile.get_all_valid_slugs())
user_profile_validator_with_nobody = OneOf(Profile.get_all_valid_slugs(include_nobody=True))
agenda_type_validator = OneOf([agenda_type.value for agenda_type in AgendaType])
user_timezone_validator = Length(max=User.MAX_TIMEZONE_LENGTH)
user_email_validator = Length(min=User.MIN_EMAIL_LENGTH, max=User.MAX_EMAIL_LENGTH)
user_username_validator = Length(min=User.MIN_USERNAME_LENGTH, max=User.MAX_USERNAME_LENGTH)
user_password_validator = Length(min=User.MIN_PASSWORD_LENGTH, max=User.MAX_PASSWORD_LENGTH)
user_public_name_validator = Length(
    min=User.MIN_PUBLIC_NAME_LENGTH, max=User.MAX_PUBLIC_NAME_LENGTH
)
user_lang_validator = Length(min=User.MIN_LANG_LENGTH, max=User.MAX_LANG_LENGTH)
user_role_validator = OneOf(UserRoleInWorkspace.get_all_role_slug())
page_token_validator = validate_page_token
user_config_validator = validate_simple_dict
all_content_namespaces_validator = OneOf(choices=list(ContentNamespaces))

# Dynamic validator #
all_content_types_validator = OneOf(choices=[])


def update_validators() -> None:
    all_content_types_validator.choices = content_type_list.endpoint_allowed_types_slug()
