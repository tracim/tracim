# -*- coding: utf-8 -*-
from tracim.lib.auth.internal import InternalAuth
from tracim.lib.auth.ldap import LDAPAuth


class AuthConfigWrapper:

    # TODO: Dynamic load, like plugins ?
    AUTH_CLASSES = (InternalAuth, LDAPAuth)

    @classmethod
    def wrap(cls, config):
        auth_class = cls._get_auth_class(config)
        config['auth_instance'] = auth_class(config)
        config['auth_instance'].feed_config()

    @classmethod
    def _get_auth_class(cls, config):
        for auth_class in cls.AUTH_CLASSES:
            if auth_class.name is NotImplemented:
                raise Exception("\"name\" attribute of %s is required" % str(auth_class))
            if config.get('auth_type') == auth_class.name:
                return auth_class
        raise Exception("No auth config wrapper found for \"%s\" auth_type config" % config.get('auth_type'))
