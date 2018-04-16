# coding: utf8
from tracim.exceptions import DigestAuthNotImplemented
from tracim.lib.core.user import UserApi

DEFAULT_TRACIM_WEBDAV_REALM = '/'


class TracimDomainController(object):
    """
    The domain controller is used by http_authenticator to authenticate the user every time a request is
    sent
    """
    def __init__(self, app_config, presetdomain=None, presetserver=None):
        self.app_config = app_config

    def getDomainRealm(self, inputURL, environ):
        return DEFAULT_TRACIM_WEBDAV_REALM

    def getRealmUserPassword(self, realmname, username, environ):
        """
        This method is normally only use for digest auth. wsgidav need
        plain password to deal with it. as we didn't
        provide support for this kind of auth, this method raise an exception.
        """
        raise DigestAuthNotImplemented

    def requireAuthentication(self, realmname, environ):
        return True

    def isRealmUser(self, realmname, username, environ):
        """
        Called to check if for a given root, the username exists (though here we don't make difference between
        root as we're always starting at tracim's root
        """
        api = UserApi(None, environ['tracim_dbsession'], self.app_config)
        try:
             api.get_one_by_email(username)
             return True
        except:
             return False

    def authDomainUser(self, realmname, username, password, environ):
        """
        If you ever feel the need to send a request al-mano with a curl, this is the function that'll be called by
        http_authenticator to validate the password sent
        """
        api = UserApi(None, environ['tracim_dbsession'], self.app_config)
        return self.isRealmUser(realmname, username, environ) and \
             api.get_one_by_email(username).validate_password(password)
