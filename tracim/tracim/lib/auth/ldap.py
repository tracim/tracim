# -*- coding: utf-8 -*-
from tg.configuration.auth import TGAuthMetadata
from who_ldap import LDAPAttributesPlugin as BaseLDAPAttributesPlugin
from who_ldap import LDAPGroupsPlugin as BaseLDAPGroupsPlugin
from who_ldap import LDAPSearchAuthenticatorPlugin as BaseLDAPSearchAuthenticatorPlugin

from tracim.lib.auth.base import Auth
from tracim.lib.helpers import ini_conf_to_bool
from tracim.lib.user import UserApi
from tracim.model import DBSession, User


class LDAPAuth(Auth):
    """
    LDAP auth management.

    """
    name = 'ldap'
    _internal = False

    def __init__(self, config):
        super().__init__(config)
        self.ldap_auth = self._get_ldap_auth()
        self.ldap_user_provider = self._get_ldap_user_provider()
        if ini_conf_to_bool(self._config.get('ldap_group_enabled', False)):
            self.ldap_groups_provider = self._get_ldap_groups_provider()
        self._managed_fields = self.ldap_user_provider.local_fields

    def feed_config(self):
        super().feed_config()
        self._config['auth_backend'] = 'ldapauth'
        self._config['sa_auth'].authenticators = [('ldapauth', self.ldap_auth)]

        mdproviders = [('ldapuser', self.ldap_user_provider)]
        if ini_conf_to_bool(self._config.get('ldap_group_enabled', False)):
            mdproviders.append(('ldapgroups', self.ldap_groups_provider))
        self._config['sa_auth'].mdproviders = mdproviders

        self._config['sa_auth'].authmetadata = LDAPApplicationAuthMetadata(self._config.get('sa_auth'))

    def _get_ldap_auth(self):
        auth_plug = LDAPSearchAuthenticatorPlugin(
            url=self._config.get('ldap_url'),
            base_dn=self._config.get('ldap_base_dn'),
            bind_dn=self._config.get('ldap_bind_dn'),
            bind_pass=self._config.get('ldap_bind_pass'),
            returned_id='login',
            # the LDAP attribute that holds the user name:
            naming_attribute=self._config.get('ldap_naming_attribute'),
            start_tls=ini_conf_to_bool(self._config.get('ldap_tls', False)),
        )
        auth_plug.set_auth(self)
        return auth_plug

    def _get_ldap_user_provider(self):
        return LDAPAttributesPlugin(
            url=self._config.get('ldap_url'),
            bind_dn=self._config.get('ldap_bind_dn'),
            bind_pass=self._config.get('ldap_bind_pass'),
            name='user',
            # map from LDAP attributes to TurboGears user attributes:
            attributes=self._config.get('ldap_user_attributes', 'mail=email'),
            flatten=True,
            start_tls=ini_conf_to_bool(self._config.get('ldap_tls', False)),
        )

    def _get_ldap_groups_provider(self):
        return LDAPGroupsPlugin(
            url=self._config.get('ldap_url'),
            base_dn=self._config.get('ldap_base_dn'),
            bind_dn=self._config.get('ldap_bind_dn'),
            bind_pass=self._config.get('ldap_bind_pass'),
            filterstr=self._config.get('ldap_group_filter', '(&(objectClass=group)(member=%(dn)s))'),
            name='groups',
            start_tls=ini_conf_to_bool(self._config.get('ldap_tls', False)),
        )


class LDAPSearchAuthenticatorPlugin(BaseLDAPSearchAuthenticatorPlugin):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._auth = None
        self._user_api = UserApi(None)

    def set_auth(self, auth):
        self._auth = auth

    def authenticate(self, environ, identity):
        # Note: super().authenticate return None if already authenticated or not found
        email = super().authenticate(environ, identity)
        if email:
            self._sync_ldap_user(email)
        return email

    def _sync_ldap_user(self, email):
        if not self._user_api.user_with_email_exists(email):
            user = User(email=email, imported_from=LDAPAuth.name)
            DBSession.add(user)
            import transaction
            transaction.commit()

            # TODO - B.S. - 20160208: Voir avec Damien, si je ne fait pas de transaction.commit()
            # manuellement la donnée n'est pas en base.
            # self._user_api.create_user(email=email, save_now=True)


class LDAPApplicationAuthMetadata(TGAuthMetadata):

    def __init__(self, config):
        self.sa_auth = config.get('sa_auth')
        self._config = config

    def get_user(self, identity, userid):
        return identity.get('user')

    def get_groups(self, identity, userid):
        if not ini_conf_to_bool(self._config.get('ldap_group_enabled')):

            # TODO - B.S. - 20160212: récupérer identity['user'].groups directement produit
            # Parent instance XXX is not bound to a Session. Voir avec Damien.
            user = DBSession.query(User).filter(User.email == identity['user'].email).one()
            return [g.group_name for g in user.groups]

            return [g.group_name for g in identity['user'].groups]
        else:
            raise NotImplementedError()

    def get_permissions(self, identity, userid):
        if not ini_conf_to_bool(self._config.get('ldap_group_enabled')):

            # TODO - B.S. - 20160212: récupérer identity['user'].groups directement produit
            # Parent instance XXX is not bound to a Session. Voir avec Damien.
            user = DBSession.query(User).filter(User.email == identity['user'].email).one()
            return [p.permission_name for p in user.permissions]

            return [p.permission_name for p in identity['user'].permissions]
        else:
            raise NotImplementedError()


class LDAPGroupsPlugin(BaseLDAPGroupsPlugin):

    def add_metadata(self, environ, identity):
        super().add_metadata(environ, identity)
        groups_names = identity[self.name]
        raise NotImplementedError()  # Should sync groups etc ...


class LDAPAttributesPlugin(BaseLDAPAttributesPlugin):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._user_api = UserApi(None)

    def add_metadata(self, environ, identity):
        super().add_metadata(environ, identity)
        # TODO - B.S. - 20160212: identity contains now som information from LDAP what we can save in local database
        identity[self.name] = self._user_api.get_one_by_email(identity.get('repoze.who.userid'))

    @property
    def local_fields(self):
        """
        :return: list of ldap side managed field names
        """
        return list(self._attributes_map.values())
