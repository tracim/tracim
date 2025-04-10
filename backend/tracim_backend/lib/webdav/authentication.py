# coding: utf8
from sqlalchemy.orm import Session  # noqa: F401
import transaction
import typing
from wsgidav.dc.base_dc import BaseDomainController

from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import DigestAuthNotImplemented
from tracim_backend.lib.core.user import UserApi

DEFAULT_TRACIM_WEBDAV_REALM = "/"


class TracimDomainController(BaseDomainController):
    """
    The domain controller is used by http_authenticator to authenticate the user every time a request is
    sent
    """

    def __init__(self, wsgidav_app, config):
        super().__init__(wsgidav_app, config)
        assert "tracim_settings" in config.keys()
        self.app_config = CFG(config["tracim_settings"])

    def get_domain_realm(self, path_info: str, environ: typing.Dict[str, typing.Any]) -> str:
        return DEFAULT_TRACIM_WEBDAV_REALM

    def get_realm_user_password(
        self, realmname: str, username: str, environ: typing.Dict[str, typing.Any]
    ) -> str:
        """
        This method is normally only use for digest auth. wsgidav need
        plain password to deal with it. as we didn't
        provide support for this kind of auth, this method raise an exception.
        """
        raise DigestAuthNotImplemented

    def require_authentication(self, realmname: str, environ: typing.Dict[str, typing.Any]) -> bool:
        return True

    def is_realm_user(
        self, realmname: str, username: str, environ: typing.Dict[str, typing.Any]
    ) -> bool:
        """
        Called to check if for a given root, the username exists (though here we don't make difference between
        root as we're always starting at tracim's root
        """
        session = environ["tracim_context"].dbsession  # type: Session
        api = UserApi(None, session, self.app_config)
        try:
            api.get_one_by_login(login=username)
            return True
        # TODO - G.M - 2019-04-25 - do better exception handling here,
        # see https://github.com/tracim/tracim/issues/1636
        except Exception:
            return False

    def basic_auth_user(
        self,
        realm: str,
        user_name: str,
        password: str,
        environ: typing.Dict[str, typing.Any],
    ) -> bool:
        """
        If you ever feel the need to send a request al-mano with a curl, this is the function that'll be called by
        http_authenticator to validate the password sent
        """
        session = environ["tracim_context"].dbsession
        api = UserApi(None, session, self.app_config)
        try:
            api.authenticate(
                login=user_name,
                password=password,
                ldap_connector=environ["tracim_registry"].ldap_connector,
            )
            transaction.commit()
        except AuthenticationFailed:
            return False
        return True

    def supports_http_digest_auth(self):
        return False
