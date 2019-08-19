# -*- coding: utf-8 -*-
import datetime
import email
import os
from os.path import normpath as base_normpath
import random
import string
import typing
from urllib.parse import urlencode
from urllib.parse import urljoin

from colour import Color
import pytz
from redis import Redis
from rq import Queue

from tracim_backend.exceptions import NotAFileError
from tracim_backend.exceptions import NotReadableDirectory
from tracim_backend.exceptions import NotReadableFile
from tracim_backend.exceptions import NotWritableDirectory

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG

DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
DEFAULT_TRACIM_CONFIG_FILE = "development.ini"
CONTENT_FRONTEND_URL_SCHEMA = "workspaces/{workspace_id}/contents/{content_type}/{content_id}"
WORKSPACE_FRONTEND_URL_SCHEMA = "workspaces/{workspace_id}"
FRONTEND_UI_SUBPATH = "ui"
LOGIN_SUBPATH = "login"
RESET_PASSWORD_SUBPATH = "reset-password"


def generate_documentation_swagger_tag(*sections: str) -> str:
    """
    Generate documentation swagger tag according to section in order
    """
    return " > ".join(sections)


def preview_manager_page_format(page_number: int) -> int:
    """
    Convert page real number of page(begin at 1) to preview_manager page
    format(begin at 0)
    """
    return page_number - 1


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


def get_redis_connection(config: "CFG") -> Redis:
    """
    :param config: current app_config
    :return: redis connection
    """
    return Redis(
        host=config.EMAIL__ASYNC__REDIS__HOST,
        port=config.EMAIL__ASYNC__REDIS__PORT,
        db=config.EMAIL__ASYNC__REDIS__DB,
    )


def get_rq_queue(redis_connection: Redis, queue_name: str = "default") -> Queue:
    """
    :param queue_name: name of queue
    :return: wanted queue
    """

    return Queue(name=queue_name, connection=redis_connection)


def cmp_to_key(mycmp):
    """
    List sort related function

    Convert a cmp= function into a key= function
    """

    class K(object):
        def __init__(self, obj, *args):
            self.obj = obj

        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0

        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0

        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0

        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0

        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0

        def __ne__(self, other):
            return mycmp(self.obj, other.obj) != 0

    return K


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


def get_timezones_list() -> typing.List[Timezone]:
    tz_list = []
    for tz_name in pytz.common_timezones:
        tz_list.append(Timezone(tz_name))
    return tz_list


# INFO - G.M - 2018-08-02 - Simple password generator, inspired by
# https://gist.github.com/23maverick23/4131896


ALLOWED_AUTOGEN_PASSWORD_CHAR = string.ascii_letters + string.digits + """!#$%&()*+,-./:;=?@[]_{}"""

DEFAULT_PASSWORD_GEN_CHAR_LENGTH = 12


def password_generator(
    length: int = DEFAULT_PASSWORD_GEN_CHAR_LENGTH, chars: str = ALLOWED_AUTOGEN_PASSWORD_CHAR
) -> str:
    """
    :param length: length of the new password
    :param chars: characters allowed
    :return: password as string
    """
    return "".join(random.choice(chars) for char_number in range(length))


COLOR_DARKEN_SCALE_FACTOR = 0.85
COLOR_LIGHTEN_SCALE_FACTOR = 1.15


def clamp(val: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    """ Fix value between min an max"""
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
    base_string: str,
    separator: str,
    cast_func: typing.Callable[[str], typing.Any],
    do_strip: bool = False,
) -> typing.List[typing.Any]:
    """
    Convert a string to a list of separated item of one type according
    to a string separator and to a cast_func
    >>> string_to_list('1,2,3', ',', int)
    [1, 2, 3]
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


def deprecated(func: typing.Callable):
    """ Dummy deprecated function"""
    # TODO - G.M - 2018-12-04 - Replace this with a true deprecated function ?
    return func


def core_convert_file_name_to_display(string: str) -> str:
    """
    """
    REPLACE_CHARS = {"/": "⧸", "\\": "⧹"}

    for key, value in REPLACE_CHARS.items():
        string = string.replace(key, value)

    return string


def wopi_convert_file_name_to_display(string: str) -> str:
    """
    Hack to support all file_name name for collaborative edition
    """
    REPLACE_CHARS = {"/": "⧸", "?": "ʔ"}

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
    REPLACE_CHARS = {":": "∶", "*": "∗", "?": "ʔ", '"': "ʺ", "<": "❮", ">": "❯", "|": "∣"}

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
        "∶": ":",
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


def sliced_dict(data: typing.Dict[str, any], beginning_key_string: str) -> typing.Dict[str, any]:
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
        path=path, mode=os.W_OK | os.X_OK, dir_fd=None, effective_ids=os.supports_effective_ids
    ):
        raise NotWritableDirectory("{} is not a writable directory".format(path))
    return True


def is_dir_readable(path: str) -> bool:
    """
    Check if path given is a writable dir for current user(the one which run
    the process)
    """
    if not os.access(
        path=path, mode=os.R_OK | os.X_OK, dir_fd=None, effective_ids=os.supports_effective_ids
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

    def __init__(self, user_email: str, username: typing.Optional[str] = None) -> None:
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
