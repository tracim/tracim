# -*- coding: utf-8 -*-
from tg.configuration.auth import TGAuthMetadata
from who_ldap import LDAPAttributesPlugin, LDAPGroupsPlugin
from who_ldap import LDAPSearchAuthenticatorPlugin as BaseLDAPSearchAuthenticatorPlugin

from tracim.lib.auth.base import Auth
from tracim.lib.helpers import ini_conf_to_bool
from tracim.lib.user import UserApi
from tracim.model import auth, DBSession, User


class LDAPAuth(Auth):
    """
    LDAP auth management.
    TODO: Group connection

    """
    name = 'ldap'

    def __init__(self, config):
        super().__init__(config)
        self.ldap_auth = self._get_ldap_auth()
        self.ldap_user_provider = self._get_ldap_user_provider()
        if self._config.get('ldap_group_enabled', False):
            self.ldap_groups_provider = self._get_ldap_groups_provider()

    def wrap_config(self):
        super().wrap_config()
        self._config['auth_backend'] = 'ldapauth'
        self._config['sa_auth'].authenticators = [('ldapauth', self.ldap_auth)]

        mdproviders = [('ldapuser', self.ldap_user_provider)]
        if self._config.get('ldap_group_enabled', False):
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

    # map from LDAP group names to TurboGears group names
    group_map = {'operators': 'managers'}

    # set of permissions for all mapped groups
    permissions_for_groups = {'managers': {'manage'}}

    def __init__(self, sa_auth):
        self.sa_auth = sa_auth

    def get_user(self, identity, userid):
        user = identity.get('user')
        if user:
            name = '{email}'.format(**user).strip()
            user.update(user_name=userid, display_name=name)
        return user

    def get_groups(self, identity, userid):
        get_group = self.group_map.get
        return [get_group(g, g) for g in identity.get('groups', [])]

    def get_permissions_for_group(self, group):
        return self.permissions_for_groups.get(group, set())

    def get_permissions(self, identity, userid):
        permissions = set()
        get_permissions = self.get_permissions_for_group
        for group in self.get_groups(identity, userid):
            permissions |= get_permissions(group)
        return permissions
