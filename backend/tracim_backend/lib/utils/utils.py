# -*- coding: utf-8 -*-
import datetime
import random
import string
from urllib.parse import urljoin
from urllib.parse import urlencode

from colour import Color
import pytz
from redis import Redis
from rq import Queue
import typing

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG

DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%SZ'
DEFAULT_WEBDAV_CONFIG_FILE = "wsgidav.conf"
DEFAULT_TRACIM_CONFIG_FILE = "development.ini"
CONTENT_FRONTEND_URL_SCHEMA = 'workspaces/{workspace_id}/contents/{content_type}/{content_id}'  # nopep8
WORKSPACE_FRONTEND_URL_SCHEMA = 'workspaces/{workspace_id}'  # nopep8
FRONTEND_UI_SUBPATH = 'ui'
LOGIN_SUBPATH = 'login'
RESET_PASSWORD_SUBPATH = 'reset-password'

def generate_documentation_swagger_tag(*sections: str) -> str:
    """
    Generate documentation swagger tag according to section in order
    """
    return ' > '.join(sections)


def preview_manager_page_format(page_number: int) -> int:
    """
    Convert page real number of page(begin at 1) to preview_manager page
    format(begin at 0)
    """
    return page_number-1


def get_root_frontend_url(config: 'CFG') -> str:
    """
    Return website base url with always '/' at the end
    """
    return as_url_folder(config.WEBSITE_BASE_URL)


def get_frontend_ui_base_url(config: 'CFG') -> str:
    """
    Return ui base url
    """
    return as_url_folder(
        urljoin(get_root_frontend_url(config), FRONTEND_UI_SUBPATH)
    )


def get_login_frontend_url(config: 'CFG'):
    """
    Return login page url
    """
    return urljoin(get_frontend_ui_base_url(config), LOGIN_SUBPATH)


def get_reset_password_frontend_url(
    config: 'CFG',
    token: str,
    email: str,
) -> str:
    """
    Return reset password url
    """
    path = urljoin(get_frontend_ui_base_url(config), RESET_PASSWORD_SUBPATH)
    params = {
        'token': token,
        'email': email,
    }

    return '{path}?{params}'.format(path=path, params=urlencode(params))


def as_url_folder(url: str) -> str:
    if url[-1] != '/':
        url = '{}/'.format(url)
    return url


def get_email_logo_frontend_url(config: 'CFG'):
    # TODO - G.M - 11-06-2018 - [emailTemplateURL] correct value for email_logo_frontend_url  # nopep8
    return 'data:image/png;base64,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'  # nopep8'


def get_redis_connection(config: 'CFG') -> Redis:
    """
    :param config: current app_config
    :return: redis connection
    """
    return Redis(
        host=config.EMAIL_SENDER_REDIS_HOST,
        port=config.EMAIL_SENDER_REDIS_PORT,
        db=config.EMAIL_SENDER_REDIS_DB,
    )


def get_rq_queue(redis_connection: Redis, queue_name: str ='default') -> Queue:
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
    return datetime.datetime.now().isoformat().replace(':', '.')


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


ALLOWED_AUTOGEN_PASSWORD_CHAR = string.ascii_letters + \
                                string.digits + \
                                string.punctuation

DEFAULT_PASSWORD_GEN_CHAR_LENGTH = 12


def password_generator(
        length: int=DEFAULT_PASSWORD_GEN_CHAR_LENGTH,
        chars: str=ALLOWED_AUTOGEN_PASSWORD_CHAR
) -> str:
    """
    :param length: length of the new password
    :param chars: characters allowed
    :return: password as string
    """
    return ''.join(random.choice(chars) for char_number in range(length))


COLOR_DARKEN_SCALE_FACTOR = 0.85
COLOR_LIGHTEN_SCALE_FACTOR = 1.15


def clamp(val: float, minimum: float = 0.0, maximum: float=1.0) -> float:
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
        new_color.luminance = clamp(COLOR_DARKEN_SCALE_FACTOR*self.luminance)
        return new_color

    @property
    def lighten(self):
        new_color = ExtendedColor(self)
        new_color.luminance = clamp(COLOR_LIGHTEN_SCALE_FACTOR*self.luminance)
        return new_color
