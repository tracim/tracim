# -*- coding: utf-8 -*-
from urllib.parse import urlencode
from urllib.parse import urljoin

from babel import UnknownLocaleError
from babel.dates import format_date
from collections import OrderedDict
from colour import Color
import datetime
import email
import importlib
import json
import jsonschema
from jsonschema import SchemaError
from jsonschema import ValidationError as JsonSchemaValidationError
from jsonschema.validators import validator_for
from marshmallow import ValidationError as MarshmallowValidationError
import os
from os.path import normpath as base_normpath
import pkgutil
import pytz
import random
from sqlakeyset import unserialize_bookmark
import string
import sys
import types
import typing
from typing import Any
from typing import Callable
from typing import Dict
from typing import List
from typing import Optional
from typing import TYPE_CHECKING
import uuid

from tracim_backend.exceptions import NotAFileError
from tracim_backend.exceptions import NotReadableDirectory
from tracim_backend.exceptions import NotReadableFile
from tracim_backend.exceptions import NotWritableDirectory
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.exceptions import UnvalidCustomPropertiesSchema
from tracim_backend.exceptions import UnvalidJsonFile

if TYPE_CHECKING:
    from tracim_backend.config import CFG

DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
# NOTE - M.L - 2024-03-27 - Not using CFG since this variable used before the config is loaded
#  This variable is still parsed by CFG to be consistent with other config variables
DEFAULT_TRACIM_CONFIG_FILE = os.environ.get("TRACIM_CONFIG__FILEPATH", "development.ini")
CONTENT_FRONTEND_URL_SCHEMA = "workspaces/{workspace_id}/contents/{content_type}/{content_id}"
WORKSPACE_FRONTEND_URL_SCHEMA = "workspaces/{workspace_id}"
FRONTEND_UI_SUBPATH = "ui"
LOGIN_SUBPATH = "login"
RESET_PASSWORD_SUBPATH = "reset-password"
UNKNOWN_BUILD_VERSION = "unknown"
DEFAULT_NB_ITEM_PAGINATION = 10


def generate_documentation_swagger_tag(*sections: str) -> str:
    """
    Generate documentation swagger tag according to section in order
    """
    return " > ".join(sections)


def get_root_frontend_url(config: "CFG") -> str:
    """
    Return website base url with always '/' at the end
    """
    return as_url_folder(config.WEBSITE__BASE_URL)


def get_frontend_ui_base_url(config: "CFG") -> str:
    """
    Return ui base url
    """
    return as_url_folder(urljoin(get_root_frontend_url(config), FRONTEND_UI_SUBPATH))


def get_login_frontend_url(config: "CFG"):
    """
    Return login page url
    """
    return urljoin(get_frontend_ui_base_url(config), LOGIN_SUBPATH)


def get_reset_password_frontend_url(config: "CFG", token: str, email: str) -> str:
    """
    Return reset password url
    """
    path = urljoin(get_frontend_ui_base_url(config), RESET_PASSWORD_SUBPATH)
    params = {"token": token, "email": email}

    return "{path}?{params}".format(path=path, params=urlencode(params))


def as_url_folder(url: str) -> str:
    if url[-1] != "/":
        url = "{}/".format(url)
    return url


def get_email_logo_frontend_url(config: "CFG"):
    # TODO - G.M - 11-06-2018 - [emailTemplateURL] correct value for email_logo_frontend_url
    return "data:image/png;base64,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"


def current_date_for_filename() -> str:
    """
    ISO8601 current date, adapted to be used in filename (for
    webdav feature for example), with trouble-free characters.
    :return: current date as string like "2018-03-19T15.49.27.246592"
    """
    # INFO - G.M - 19-03-2018 - As ':' is in transform_to_bdd method in
    # webdav utils, it may cause trouble. So, it should be replaced to
    # a character which will not change in bdd.
    return datetime.datetime.now().isoformat().replace(":", ".")


class Timezone(object):
    def __init__(self, name):
        self.name = name


def get_timezones_list() -> List[Timezone]:
    tz_list = []
    for tz_name in pytz.common_timezones:
        tz_list.append(Timezone(tz_name))
    return tz_list


def generate_autogen_password_char() -> str:
    """Return the list of allowed characters for autogenerated passwords"""
    alphanumeric_chars = string.ascii_letters + string.digits
    allowed_special_characters = "!#%@+=?"
    confusing_characters = "0Oo" + "1lI"
    return str(
        "".join(
            char
            for char in alphanumeric_chars + allowed_special_characters
            if char not in confusing_characters
        )
    )


ALLOWED_AUTOGEN_PASSWORD_CHAR = generate_autogen_password_char()
DEFAULT_PASSWORD_GEN_CHAR_LENGTH = 12

# INFO - G.M - 2018-08-02 - Simple password generator, inspired by
# https://gist.github.com/23maverick23/4131896


def password_generator(
    length: int = DEFAULT_PASSWORD_GEN_CHAR_LENGTH,
    chars: str = ALLOWED_AUTOGEN_PASSWORD_CHAR,
) -> str:
    """
    :param length: length of the new password
    :param chars: characters allowed
    :return: password as string
    """
    return "".join(random.choice(chars) for char_number in range(length))


COLOR_DARKEN_SCALE_FACTOR = 0.9
COLOR_LIGHTEN_SCALE_FACTOR = 1.15


def clamp(val: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    """Fix value between min an max"""
    if val < minimum:
        return minimum
    if val > maximum:
        return maximum
    return val


class ExtendedColor(Color):
    @property
    def darken(self):
        new_color = ExtendedColor(self)
        new_color.luminance = clamp(COLOR_DARKEN_SCALE_FACTOR * self.luminance)
        return new_color

    @property
    def lighten(self):
        new_color = ExtendedColor(self)
        new_color.luminance = clamp(COLOR_LIGHTEN_SCALE_FACTOR * self.luminance)
        return new_color


def string_to_list(
    base_string: Optional[str],
    separator: str,
    cast_func: Callable[[str], Any],
    do_strip: bool = False,
) -> List[Any]:
    """
    Convert a string to a list of separated item of one type according
    to a string separator and to a cast_func

    >>> string_to_list('1,2,3', ',', int)
    [1, 2, 3]
    >>> string_to_list('1,2,3,2', ',', int)
    [1, 2, 3, 2]

    :param base_string: entry string which should be converted.
    :param separator: string separator,
    :param cast_func: all item should be casted to this function, this help
    :param do_strip: if true strip string (remove beginning and ending whitespace)
    of separated element before casting.
    if false, do not strip string before casting
    to convert to type like int, str ...
    :return: list of content of type returned by the cast_func.
    """
    if not base_string:
        return []
    string_list = base_string.split(separator)
    if do_strip:
        string_list = [item.strip() for item in string_list]
    return [cast_func(item) for item in string_list]


def string_to_unique_item_list(
    base_string: str,
    separator: str,
    cast_func: Callable[[str], Any],
    do_strip: bool = False,
) -> List[Any]:
    """
    Convert a string to a list of separated item of one type according
    to a string separator and to a cast_func, but with storing only unique value.

    >>> string_to_unique_item_list('1,2,3', ',', int)
    [1, 2, 3]
    >>> string_to_unique_item_list('1,2,3,2', ',', int)
    [1, 2, 3]

    :param base_string: entry string which should be converted.
    :param separator: string separator,
    :param cast_func: all item should be casted to this function, this help
    :param do_strip: if true strip string (remove beginning and ending whitespace)
    of separated element before casting.
    if false, do not strip string before casting
    to convert to type like int, str ...
    :return: list of unique content of type returned by the cast_func.
    """
    item_list = string_to_list(base_string, separator, cast_func, do_strip)
    return list(OrderedDict.fromkeys(item_list))


def deprecated(func: Callable):
    """Dummy deprecated function"""
    # TODO - G.M - 2018-12-04 - Replace this with a true deprecated function ?
    return func


def core_convert_file_name_to_display(string: str) -> str:
    """ """
    REPLACE_CHARS = {"/": "⧸", "\\": "⧹"}

    for key, value in REPLACE_CHARS.items():
        string = string.replace(key, value)

    return string


def webdav_convert_file_name_to_display(string: str) -> str:
    """
    As characters that Windows does not support may have been inserted
    through Tracim in names, before displaying information we update path
    so that all these forbidden characters are replaced with similar
    shape character that are allowed so that the user isn't trouble and
    isn't limited in his naming choice
    """
    string = core_convert_file_name_to_display(string)
    REPLACE_CHARS = {
        # FIXME - D.A - 2025-02-19 - Windows is sometimes already using this fake char ...
        # So we can't use it anymore otherwise some files are not found
        # ":": "∶",
        "*": "∗",
        "?": "ʔ",
        '"': "ʺ",
        "<": "❮",
        ">": "❯",
        "|": "∣",
    }

    for key, value in REPLACE_CHARS.items():
        string = string.replace(key, value)

    return string


def webdav_convert_file_name_to_bdd(string: str) -> str:
    """
    Called before sending request to the database to recover the right names
    """
    REPLACE_CHARS = {
        "⧸": "/",
        "⧹": "\\",
        # FIXME - D.A - 2025-02-19 - Windows is sometimes already using this fake char ...
        # So we can't use it anymore otherwise some files are not found
        # "∶": ":",
        "∗": "*",
        "ʔ": "?",
        "ʺ": '"',
        "❮": "<",
        "❯": ">",
        "∣": "|",
    }

    for key, value in REPLACE_CHARS.items():
        string = string.replace(key, value)

    return string


def add_trailing_slash(path: str) -> str:
    return (path + "/").replace("//", "/")


def normpath(path: str) -> str:
    if path == b"":
        path = b"/"
    elif path == "":
        path = "/"
    return base_normpath(path)


def sliced_dict(data: Dict[str, any], beginning_key_string: str) -> Dict[str, any]:
    """
    Get dict of all item beginning with beginning_key_string
    :param data:
    :param beginning_key_string:
    :return:
    """
    sliced_dict = {}
    for key, value in data.items():
        if key.startswith(beginning_key_string):
            sliced_dict[key] = value
    return sliced_dict


def is_dir_exist(path: str) -> bool:
    if not os.path.isdir(path):
        raise NotADirectoryError("{} is not a directory".format(path))
    return True


def is_dir_writable(path: str) -> bool:
    """
    Check if path given is a writable dir for current user(the one which run
    the process)
    """
    if not os.access(
        path=path,
        mode=os.W_OK | os.X_OK,
        dir_fd=None,
        effective_ids=os.supports_effective_ids,
    ):
        raise NotWritableDirectory("{} is not a writable directory".format(path))
    return True


def is_dir_readable(path: str) -> bool:
    """
    Check if path given is a writable dir for current user(the one which run
    the process)
    """
    if not os.access(
        path=path,
        mode=os.R_OK | os.X_OK,
        dir_fd=None,
        effective_ids=os.supports_effective_ids,
    ):
        raise NotReadableDirectory("{} is not a readable directory".format(path))
    return True


def is_file_exist(path: str) -> bool:
    if not os.path.isfile(path):
        raise NotAFileError("{} is not a file".format(path))
    return True


def is_file_readable(path: str) -> bool:
    """
    Check if path given is a writable dir for current user(the one which run
    the process)
    """
    if not os.access(path=path, mode=os.R_OK, effective_ids=os.supports_effective_ids):
        raise NotReadableFile("{} is not a readable file".format(path))
    return True


class EmailUser(object):
    """
    Useful object to handle more easily different way to deal with email address and username
    """

    def __init__(self, user_email: str, username: Optional[str] = None) -> None:
        assert user_email
        email_username, email_address = email.utils.parseaddr(user_email)
        self.username = username or email_username or ""
        self.email_address = email_address

    @property
    def full_email_address(self) -> str:
        return email.utils.formataddr((self.username, self.email_address))

    @property
    def email_link(self) -> str:
        return "mailto:{email_address}".format(email_address=self.email_address)


def find_direct_submodule_path(module: types.ModuleType) -> List[str]:
    """
    Get path of submodules of given module
    :param module: module to check
    :return: list of path of direct submodule
    """
    module_path_list = []
    for importer, submodule_relative_path, is_package in pkgutil.iter_modules(module.__path__):
        submodule_path = "{module_name}.{submodule_relative_path}".format(
            module_name=module.__name__, submodule_relative_path=submodule_relative_path
        )
        module_path_list.append(submodule_path)
    return sorted(module_path_list)


def find_all_submodule_path(module: types.ModuleType) -> List[str]:
    """
    get all submodules path of a module
    like "tracim_backend.lib.core.plugin"
    see https://stackoverflow.com/a/49023460
    :param module: module to check
    :return: list of absolute path of module name
    """
    module_path_list = []
    module_spec_list = []
    for importer, submodule_relative_path, is_package in pkgutil.walk_packages(module.__path__):
        submodule_path = "{module_name}.{submodule_relative_path}".format(
            module_name=module.__name__, submodule_relative_path=submodule_relative_path
        )
        if is_package:
            spec = pkgutil._get_spec(importer, submodule_relative_path)
            importlib._bootstrap._load(spec)
            module_spec_list.append(spec)
        else:
            module_path_list.append(submodule_path)
    for spec in module_spec_list:
        # INFO - G.M - 2019-11-29 - remove submodule from loaded modules
        del sys.modules[spec.name]
    return module_path_list


def get_cache_token() -> str:
    """
    Get cache token, if git repository work use last commit hash, else use autogenerated id
    :return: commit hash or autogenerated uuid
    """
    cache_token = get_current_git_hash()
    if cache_token == "":
        cache_token = str(uuid.uuid4().hex)
    return cache_token


def get_current_git_hash() -> Optional[str]:
    """
    Get git hash of current code if available else return ""
    :return: commit short hash or ""
    """
    token = os.popen("git rev-parse HEAD 2> /dev/null").read()
    return token[:7]


def get_build_version() -> str:
    """
    Get either tag or commit hash linked to current commit
    :return: tag or commit hash
    """
    last_commit = os.popen("git rev-parse HEAD 2> /dev/null").read()
    return_value = os.system(f"git describe --exact-match {last_commit} 2> /dev/null")

    if return_value:
        hash = get_current_git_hash()
        if hash == "":
            return UNKNOWN_BUILD_VERSION
        return hash
    return os.popen(f"git describe --exact-match {last_commit} 2> /dev/null").read()


def validate_page_token(page_token: str) -> None:
    # INFO - G.M - 2020-07-23 - Because they lack an explicit message, we catch exceptions from
    # the unserialize_bookmark method of sqlakeyset and re-raise them with an explicit message.
    # See https://github.com/djrobstep/sqlakeyset/issues/34
    try:
        unserialize_bookmark(page_token)
    except Exception as e:
        raise MarshmallowValidationError(
            'Page token "{}" is not a valid page token'.format(page_token)
        ) from e


def validate_json(json_file_path: str) -> Dict[str, Any]:
    with open(json_file_path) as json_file:
        return json.load(json_file)


class CustomPropertiesValidator:
    def validate_valid_json_file(self, file_path: str) -> Dict[str, Any]:
        is_file_exist(file_path)
        is_file_readable(file_path)
        try:
            return validate_json(file_path)
        except json.JSONDecodeError as exc:
            raise UnvalidJsonFile("{} is not a valid json file".format(file_path)) from exc

    def validate_json_schema(self, json_schema: Dict[str, Any]):
        # INFO - G.M - 2021-01-13 Check here schema with jsonschema meta-schema to:
        # - prevent an invalid json-schema
        # - ensure that validation of content will not failed due to invalid schema.
        # - ensure the json-schema will be correctly processed by the frontend (specific tracim constraints)
        try:
            cls = validator_for(json_schema)
            cls.check_schema(json_schema)
        except SchemaError as exc:
            raise UnvalidCustomPropertiesSchema("Unvalid json-schema.") from exc

        properties = json_schema.get("properties")
        if not properties:
            raise UnvalidCustomPropertiesSchema('Missing "properties" key at json root.')

        missing_or_empty_title_properties = []
        for property_name, value in properties.items():
            if "title" not in value or not value.get("title"):
                missing_or_empty_title_properties.append(property_name)

        if missing_or_empty_title_properties:
            raise UnvalidCustomPropertiesSchema(
                'Missing or empty "title" key in these properties : {}.'.format(
                    ",".join(missing_or_empty_title_properties)
                )
            )

    def validate_data(self, params: Dict[str, Any], json_schema: Dict[str, Any]):
        try:
            jsonschema.validate(params, schema=json_schema)
        except JsonSchemaValidationError as exc:
            raise TracimValidationFailed(
                'JSONSchema Validation Failed: {}: "{}"'.format(
                    "> ".join([str(item) for item in exc.absolute_path]), exc.message
                )
            ) from exc


def date_as_lang(
    datetime_obj: datetime,
    locale: typing.Optional[str] = None,
    default_locale: typing.Optional[str] = None,
) -> str:
    """Helper to ensure the date conversion to language format does not fail"""
    if locale:
        try:
            return format_date(datetime_obj, locale=locale)
        except UnknownLocaleError:
            pass
    if default_locale:
        try:
            return format_date(datetime_obj, locale=default_locale)
        except UnknownLocaleError:
            pass
    return format_date(datetime_obj)
