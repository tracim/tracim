# coding: utf8
import typing

import transaction
from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import DigestAuthNotImplemented
from tracim_backend.lib.core.user import UserApi

DEFAULT_TRACIM_WEBDAV_REALM = '/'


class TracimDomainController(object):
    """
    The domain controller is used by http_authenticator to authenticate the user every time a request is
    sent
    """
    def __init__(self, app_config: CFG, presetdomain=None, presetserver=None):
        self.app_config = app_config

    def getDomainRealm(self, inputURL: str, environ: typing.Dict[str, typing.Any]) -> str:
        return DEFAULT_TRACIM_WEBDAV_REALM

    def getRealmUserPassword(self, realmname: str, username: str, environ: typing.Dict[str, typing.Any]) -> str:
        """
        This method is normally only use for digest auth. wsgidav need
        plain password to deal with it. as we didn't
        provide support for this kind of auth, this method raise an exception.
        """
        raise DigestAuthNotImplemented

    def requireAuthentication(self, realmname: str, environ: typing.Dict[str, typing.Any]) -> bool:
        return True

    def isRealmUser(self, realmname: str, username: str, environ: typing.Dict[str, typing.Any]) -> bool:
        """
        Called to check if for a given root, the username exists (though here we don't make difference between
        root as we're always starting at tracim's root
        """
        session = environ['tracim_dbsession'] # type: Session
        api = UserApi(None, session, self.app_config)
        try:
             api.get_one_by_email(username)
             return True
        except:
             return False

    def authDomainUser(self, realmname: str, username: str, password: str, environ: typing.Dict[str, typing.Any]) -> bool:
        """
        If you ever feel the need to send a request al-mano with a curl, this is the function that'll be called by
        http_authenticator to validate the password sent
        """
        session = environ['tracim_context'].dbsession
        api = UserApi(None, session, self.app_config)
        try:
            api.authenticate(
                email=username,
                password=password,
                ldap_connector=environ['tracim_registry'].ldap_connector
            )
            transaction.commit()
        except AuthenticationFailed:
            return False
        return True
