# -*- coding: utf-8 -*-
import datetime
import os
import time
import signal

import tg
from tg import config
from tg import require
from tg import response
from tg.controllers.util import abort
from tg.appwrappers.errorpage import ErrorPageApplicationWrapper \
    as BaseErrorPageApplicationWrapper
from tg.i18n import ugettext
from tg.support.registry import StackedObjectProxy
from tg.util import LazyString as BaseLazyString
from tg.util import lazify
from redis import Redis
from rq import Queue

from wsgidav.middleware import BaseMiddleware
from tracim.lib.base import logger
from webob import Response
from webob.exc import WSGIHTTPException


def exec_time_monitor():
    def decorator_func(func):
        def wrapper_func(*args, **kwargs):
            start = time.time()
            retval = func(*args, **kwargs)
            end = time.time()
            logger.debug(func, 'exec time: {} seconds'.format(end-start))
            return retval
        return wrapper_func
    return decorator_func


class SameValueError(ValueError):
    pass


def replace_reset_password_templates(engines):
    try:
        if engines['text/html'][1] == 'resetpassword.templates.index':
            engines['text/html'] = (
                'mako',
                'tracim.templates.reset_password_index',
                engines['text/html'][2],
                engines['text/html'][3]
            )

        if engines['text/html'][1] == 'resetpassword.templates.change_password':
            engines['text/html'] = (
                'mako',
                'tracim.templates.reset_password_change_password',
                engines['text/html'][2],
                engines['text/html'][3]
            )
    except IndexError:
        pass
    except KeyError:
        pass


@property
def NotImplemented():
    raise NotImplementedError()


class APIWSGIHTTPException(WSGIHTTPException):
    def json_formatter(self, body, status, title, environ):
        if self.comment:
            msg = '{0}: {1}'.format(title, self.comment)
        else:
            msg = title
        return {
            'code': self.code,
            'msg': msg,
            'detail': self.detail,
        }


class api_require(require):
    def default_denial_handler(self, reason):
        # Add code here if we have to hide 401 errors (security reasons)

        abort(response.status_int, reason, passthrough='json')


class ErrorPageApplicationWrapper(BaseErrorPageApplicationWrapper):
    # Define here response code to manage in APIWSGIHTTPException
    api_managed_error_codes = [
        400, 401, 403, 404,
    ]

    def __call__(self, controller, environ, context) -> Response:
        # We only do ou work when it's /api request
        # TODO BS 20161025: Look at PATH_INFO is not smart, find better way
        if not environ['PATH_INFO'].startswith('/api'):
            return super().__call__(controller, environ, context)

        try:
            resp = self.next_handler(controller, environ, context)
        except:  # We catch all exception to display an 500 error json response
            if config.get('debug', False):  # But in debug, we want to see it
                raise
            return APIWSGIHTTPException()

        # We manage only specified errors codes
        if resp.status_int not in self.api_managed_error_codes:
            return resp

        # Rewrite error in api format
        return APIWSGIHTTPException(
            code=resp.status_int,
            detail=resp.detail,
            title=resp.title,
            comment=resp.comment,
        )


def get_valid_header_file_name(file_name: str) -> str:
    """
    :param file_name: file name to test
    :return: Return given string if compatible to header encoding, or
    download.ext if not.
    """
    try:
        file_name.encode('iso-8859-1')
        return file_name
    except UnicodeEncodeError:
        split_file_name = file_name.split('.')
        if len(split_file_name) > 1:  # If > 1 so file have extension
            return 'download.{0}'.format(split_file_name[-1])
        return 'download'


def str_as_bool(string: str) -> bool:
    if string == '0':
        return False
    return bool(string)


class LazyString(BaseLazyString):
    pass


def _lazy_ugettext(text: str):
    """
    This function test if application context is available
    :param text: String to traduce
    :return: lazyfied string or string
    """
    try:
        # Test if tg.translator is defined
        #
        # cf. https://github.com/tracim/tracim/issues/173
        #
        # HACK - 2017-11-03 - D.A
        # Replace context proxyfied by direct access to gettext function
        # which is not setup in case the tg2 context is not initialized
        tg.translator.gettext  # raises a TypeError exception if context not set
        return ugettext(text)
    except TypeError as e:
        logger.debug(_lazy_ugettext, 'TG2 context not available for translation. TypeError: {}'.format(e))
        return text

lazy_ugettext = lazify(_lazy_ugettext)


def get_rq_queue(queue_name: str= 'default') -> Queue:
    """
    :param queue_name: name of queue
    :return: wanted queue
    """
    from tracim.config.app_cfg import CFG
    cfg = CFG.get_instance()

    return Queue(queue_name, connection=Redis(
        host=cfg.EMAIL_SENDER_REDIS_HOST,
        port=cfg.EMAIL_SENDER_REDIS_PORT,
        db=cfg.EMAIL_SENDER_REDIS_DB,
    ))

def current_date_for_filename() -> str:
    """
    ISO8601 current date, adapted to be used in filename (for
    webdav feature for example), with trouble-free characters.

    :return: current date as string
    """
    # INFO - G.M - 19-03-2018 - As ':' is in transform_to_bdd method in
    # webdav utils, it may cause trouble. So, it should be replaced to
    # a character which will not change in bdd.
    return datetime.datetime.now().isoformat().replace(':', '.')

class TracimEnforceHTTPS(BaseMiddleware):

    def __init__(self, application, config):
        super().__init__(application, config)
        self._application = application
        self._config = config

    def __call__(self, environ, start_response):
        # TODO - G.M - 06-03-2018 - Check protocol from http header first
        # see http://www.bortzmeyer.org/7239.html
        # if this params doesn't exist, rely on tracim config
        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        if cfg.WEBSITE_BASE_URL.startswith('https'):
            environ['wsgi.url_scheme'] = 'https'
        return self._application(environ, start_response)
