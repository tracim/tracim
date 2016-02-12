# -*- coding: utf-8 -*-
from tg.util import Bunch

""" Backup of config.sa_auth """
_original_sa_auth = None


def _get_clean_sa_auth(config):
    """
    Return the original sa_auth parameter. Consider Original as it's content before first fill in configuration.
    :param config: tg2 app config
    :return: original sa_auth parameter
    """
    global _original_sa_auth

    if _original_sa_auth is None:
        _original_sa_auth = dict(config.get('sa_auth'))

    sa_auth = Bunch()
    sa_auth.update(_original_sa_auth)
    return sa_auth


class Auth:
    """
    Auth strategy base class
    """

    """ Auth strategy must be named: .ini config will use this name in auth_type parameter """
    name = NotImplemented

    """ When Auth is not internal, user account management are disabled (forgotten password, etc.) """
    _internal = NotImplemented

    def __init__(self, config):
        self._config = config
        self._managed_fields = []

    @property
    def is_internal(self):
        return bool(self._internal)

    @property
    def managed_fields(self):
        return self._managed_fields

    def feed_config(self):
        """
        Fill config with auth needed. You must overload with whild implementation.
        :return:
        """
        self._config['sa_auth'] = _get_clean_sa_auth(self._config)

        self._config['auth_is_internal'] = self.is_internal

        # override this if you would like to provide a different who plugin for
        # managing login and logout of your application
        self._config['sa_auth'].form_plugin = None

        # You may optionally define a page where you want users to be redirected to
        # on login:
        self._config['sa_auth'].post_login_url = '/post_login'

        # You may optionally define a page where you want users to be redirected to
        # on logout:
        self._config['sa_auth'].post_logout_url = '/post_logout'
