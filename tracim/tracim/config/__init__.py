# -*- coding: utf-8 -*-
from tg import AppConfig

from tracim.lib.auth.wrapper import AuthConfigWrapper


class TracimAppConfig(AppConfig):
    """
    Tracim specific config processes.
    """

    def after_init_config(self, conf):
        AuthConfigWrapper.wrap(conf)
        #  Fix an tg2 strange thing: auth_backend is set in config, but instance
        #  of AppConfig has None in auth_backend attr
        self.auth_backend = conf['auth_backend']
        self.sa_auth = conf.get('sa_auth')
