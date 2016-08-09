# coding: utf8

from tracim.lib.user import UserApi

class SQLDomainController(object):

    def __init__(self, presetdomain = None, presetserver = None):
        self._api = UserApi(None)

    def getDomainRealm(self, inputURL, environ):
        """
        On va récupérer le workspace de travail pour travailler sur les droits
        """
        return '/'

    def requireAuthentication(self, realmname, environ):
        return True

    def isRealmUser(self, realmname, username, environ):
        """
        travailler dans la bdd pour vérifier si utilisateur existe
        """
        try:
            self._api.get_one_by_email(username)
            return True
        except:
            return False

    def getRealmUserPassword(self, realmname, username, environ):
        """Retourne le mdp pour l'utilisateur pour ce real"""
        try:
            user = self._api.get_one_by_email(username)
            return user.password
        except:
            return None

    def authDomainUser(self, realmname, username, password, environ):
        """Vérifier que l'utilisateur est valide pour ce domaine"""
        return self.isRealmUser(realmname, username, environ) and \
            self._api.get_one_by_email(username).validate_password(password)