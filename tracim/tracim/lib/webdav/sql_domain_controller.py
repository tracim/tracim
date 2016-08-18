# coding: utf8

from tracim.lib.user import UserApi

class TracimDomainController(object):
    """
    The domain controller is used by http_authenticator to authenticate the user every time a request is
    sent
    """
    def __init__(self, presetdomain = None, presetserver = None):
        self._api = UserApi(None)

    def getDomainRealm(self, inputURL, environ):
        return '/'

    def requireAuthentication(self, realmname, environ):
        return True

    def isRealmUser(self, realmname, username, environ):
        """
        Called to check if for a given root, the username exists (though here we don't make difference between
        root as we're always starting at tracim's root
        """
        try:
            self._api.get_one_by_email(username)
            return True
        except:
            return False

    def get_left_digest_response_hash(self, realmname, username, environ):
        """
        Called by our http_authenticator to get the hashed md5 digest for the current user that is also sent by
        the webdav client
        """
        try:
            user = self._api.get_one_by_email(username)
            return user.webdav_left_digest_response_hash
        except:
            return None

    def authDomainUser(self, realmname, username, password, environ):
        """
        If you ever feel the need to send a request al-mano with a curl, this is the function that'll be called by
        http_authenticator to validate the password sent
        """

        return self.isRealmUser(realmname, username, environ) and \
            self._api.get_one_by_email(username).validate_password(password)
