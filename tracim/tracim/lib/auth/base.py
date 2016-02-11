# -*- coding: utf-8 -*-
from tg.util import Bunch

_original_sa_auth = None


def _get_clean_sa_auth(config):
    """
    TODO COMMENT
    :param config:
    :return:
    """
    global _original_sa_auth

    if _original_sa_auth is None:
        _original_sa_auth = dict(config.get('sa_auth'))

    sa_auth = Bunch()
    sa_auth.update(_original_sa_auth)
    return sa_auth


class Auth:

    name = NotImplemented

    def __init__(self, config):
        self._config = config

    def wrap_config(self):
        self._config['sa_auth'] = _get_clean_sa_auth(self._config)

        # override this if you would like to provide a different who plugin for
        # managing login and logout of your application
        self._config['sa_auth'].form_plugin = None

        # You may optionally define a page where you want users to be redirected to
        # on login:
        self._config['sa_auth'].post_login_url = '/post_login'

        # You may optionally define a page where you want users to be redirected to
        # on logout:
        self._config['sa_auth'].post_logout_url = '/post_logout'
