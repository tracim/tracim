from tg import config

from tracim.lib.user import UserApi
from tracim.model import DBSession


class Auth(object):
    """
    This Auth class is designed to solve following problematic:
    In tracim.lib.radicale.storage.Collection append, replace and delete
    methods we don't know wich user is processing. So this Auth singleton
    store last authenticated user.
    """
    current_user = None

    @classmethod
    def is_authenticated(cls, user, password) -> bool:
        """
        :param user: user email
        :param password: user password
        :return: True if auth success, False if not
        """
        email = config.get('sa_auth').authmetadata.authenticate({}, {
            'login': user,
            'password': password
        }, allow_auth_token=True)
        if email:
            cls.current_user = UserApi(None).get_one_by_email(email)

        return bool(email)


def is_authenticated(user: str, password: str) -> bool:
    """
    see tracim.lib.radicale.auth.Auth#is_authenticated
    """
    DBSession.expire_all()
    return Auth.is_authenticated(user, password)
