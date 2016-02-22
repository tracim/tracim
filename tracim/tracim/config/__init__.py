# -*- coding: utf-8 -*-
from tg import AppConfig

from tracim.lib.auth.wrapper import AuthConfigWrapper


class TracimAppConfig(AppConfig):
    """
    Tracim specific config processes.
    """

    def after_init_config(self, conf):
        AuthConfigWrapper.wrap(conf)
        #  Fix tg2 problem: https://groups.google.com/forum/#!topic/turbogears/oL_04O6eCQQ
        self.auth_backend = conf.get('auth_backend')
        self.sa_auth = conf.get('sa_auth')
