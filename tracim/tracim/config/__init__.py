# -*- coding: utf-8 -*-
from tg import AppConfig
from tg.appwrappers.errorpage import ErrorPageApplicationWrapper \
    as BaseErrorPageApplicationWrapper

from tracim.lib.auth.wrapper import AuthConfigWrapper
from tracim.lib.utils import ErrorPageApplicationWrapper


class TracimAppConfig(AppConfig):
    """
    Tracim specific config processes.
    """
    def __init__(self, minimal=False, root_controller=None):
        super().__init__(minimal, root_controller)
        self._replace_errors_wrapper()

    def _replace_errors_wrapper(self) -> None:
        """
        Replace tg ErrorPageApplicationWrapper by ourself
        """
        for index, wrapper_class in enumerate(self.application_wrappers):
            if issubclass(wrapper_class, BaseErrorPageApplicationWrapper):
                self.application_wrappers[index] = ErrorPageApplicationWrapper

    def after_init_config(self, conf):
        AuthConfigWrapper.wrap(conf)
        #  Fix tg2 problem: https://groups.google.com/forum/#!topic/turbogears/oL_04O6eCQQ
        self.auth_backend = conf.get('auth_backend')
        self.sa_auth = conf.get('sa_auth')
