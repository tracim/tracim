# -*- coding: utf-8 -*-
from tracim.lib.auth.internal import InternalAuth
from tracim.lib.auth.ldap import LDAPAuth


class AuthConfigWrapper:

    # TODO: Dynamic load, like plugins ?
    AUTH_WRAPPERS = (InternalAuth, LDAPAuth)
    EXTERNAL_AUTHS = (LDAPAuth,)

    @classmethod
    def wrap(cls, config):
        wrapper_class = cls._get_wrapper_class(config)
        wrapper = wrapper_class(config)
        wrapper.wrap_config()
        return config

    @classmethod
    def _get_wrapper_class(cls, config):
        for wrapper_class in cls.AUTH_WRAPPERS:
            if wrapper_class.name is NotImplemented:
                raise Exception("\"name\" attribute of %s is required" % str(wrapper_class))
            if config.auth_type == wrapper_class.name:
                return wrapper_class
        raise Exception("No auth config wrapper found for \"%s\" auth_type config" % config.auth_type)
