# -*- coding: utf-8 -*-
from typing import Dict

from sqlalchemy import and_
from tg.configuration.auth import TGAuthMetadata

from tracim.lib.auth.base import Auth
from tracim.model import DBSession, User


class InternalAuth(Auth):

    name = 'internal'
    _internal = True

    def feed_config(self):
        """
        Fill config with internal (database) auth information.
        :return:
        """
        super().feed_config()
        self._config['sa_auth'].user_class = User
        self._config['auth_backend'] = 'sqlalchemy'
        self._config['sa_auth'].dbsession = DBSession
        self._config['sa_auth'].authmetadata = InternalApplicationAuthMetadata(self._config.get('sa_auth'))


class InternalApplicationAuthMetadata(TGAuthMetadata):
    def __init__(self, sa_auth):
        self.sa_auth = sa_auth

    def authenticate(
            self,
            environ: Dict[str, str],
            identity: Dict[str, str],
            allow_auth_token: bool = False,
    ) -> str:
        """
        Authenticates using given credentials.

        Checks password first then auth token if allowed.
        :param environ:
        :param identity: The given credentials to authenticate.
        :param allow_auth_token: The indicator of auth token use.
        :return: The given login or an empty string if auth failed.
        """
        result = ''
        user = self.sa_auth.dbsession \
            .query(self.sa_auth.user_class) \
            .filter(self.sa_auth.user_class.is_active.is_(True)) \
            .filter(self.sa_auth.user_class.email == identity['login']) \
            .first()
        if user:
            if user.validate_password(identity['password']):
                result = identity['login']
            if allow_auth_token:
                user.ensure_auth_token()
                if user.auth_token == identity['password']:
                    result = identity['login']
        return result

    def get_user(self, identity, userid):
        return self.sa_auth.dbsession.query(self.sa_auth.user_class).filter(
            and_(self.sa_auth.user_class.is_active == True, self.sa_auth.user_class.email == userid)).first()

    def get_groups(self, identity, userid):
        return [g.group_name for g in identity['user'].groups]

    def get_permissions(self, identity, userid):
        return [p.permission_name for p in identity['user'].permissions]
