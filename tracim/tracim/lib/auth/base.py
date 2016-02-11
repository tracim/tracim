# -*- coding: utf-8 -*-


class Auth:

    name = NotImplemented

    def __init__(self, config):
        self._config = config

    def wrap_config(self):
        # override this if you would like to provide a different who plugin for
        # managing login and logout of your application
        self._config['sa_auth'].form_plugin = None

        # You may optionally define a page where you want users to be redirected to
        # on login:
        self._config['sa_auth'].post_login_url = '/post_login'

        # You may optionally define a page where you want users to be redirected to
        # on logout:
        self._config['sa_auth'].post_logout_url = '/post_logout'
