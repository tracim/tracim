# -*- coding: utf-8 -*-
from tg import AppConfig, config

from tracim.lib.auth.wrapper import AuthConfigWrapper


class TracimAppConfig(AppConfig):
    """
    Tracim specific config processes.
    """

    def after_init_config(self, conf):
        self._set_up_auth()
        # Fix an tg2 strange thing: auth_backend is set in config, but instance
        #  of AppConfig has None in auth_backend attr
        self.auth_backend = config.auth_backend

    def _set_up_auth(self, ):
        AuthConfigWrapper.wrap(config)
