import typing

from pyramid.request import Request
from sqlalchemy.orm.exc import NoResultFound

from tracim import TracimRequest
from tracim.lib.core.user import UserApi
from tracim.models import User

BASIC_AUTH_WEBUI_REALM = "tracim"


###
# Pyramid HTTP Basic Auth
###

def basic_auth_check_credentials(
        login: str,
        cleartext_password: str,
        request: TracimRequest
) -> typing.Optional[list]:
    """
    Check credential for pyramid basic_auth
    :param login: login of user
    :param cleartext_password: user password in cleartext
    :param request: Pyramid request
    :return: None if auth failed, list of permissions if auth succeed
    """

    # Do not accept invalid user
    user = _get_basic_auth_unsafe_user(request)
    if not user \
            or user.email != login \
            or not user.validate_password(cleartext_password):
        return None
    return []


def _get_basic_auth_unsafe_user(
    request: Request,
) -> typing.Optional[User]:
    """
    :param request: pyramid request
    :return: User or None
    """
    app_config = request.registry.settings['CFG']
    uapi = UserApi(None, session=request.dbsession, config=app_config)
    try:
        login = request.unauthenticated_userid
        if not login:
            return None
        user = uapi.get_one_by_email(login)
    except NoResultFound:
        return None
    return user
