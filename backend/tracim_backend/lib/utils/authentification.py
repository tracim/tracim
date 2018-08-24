import typing

from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.request import Request
from zope.interface import implementer

from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models import User

BASIC_AUTH_WEBUI_REALM = "tracim"
TRACIM_API_KEY_HEADER = "Tracim-Api-Key"
TRACIM_API_USER_EMAIL_LOGIN_HEADER = "Tracim-Api-Login"

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
    user = _get_auth_unsafe_user(request)
    if not user \
            or user.email != login \
            or not user.is_active \
            or not user.validate_password(cleartext_password):
        return None
    return []


def _get_auth_unsafe_user(
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
    except UserDoesNotExist:
        return None
    return user

###
# Pyramid API key auth
###


@implementer(IAuthenticationPolicy)
class ApiTokenAuthentificationPolicy(CallbackAuthenticationPolicy):

    def __init__(self, api_key_header: str, api_user_email_login_header: str):
        self.api_key_header = api_key_header
        self.api_user_email_login_header = api_user_email_login_header

    def authenticated_userid(self, request):
        app_config = request.registry.settings['CFG']  # type:'CFG'
        valid_api_key = app_config.API_KEY
        api_key = request.headers.get(self.api_key_header)
        if not api_key or not valid_api_key:
            return None
        if valid_api_key != api_key:
            return None
        # check if user is correct
        user = _get_auth_unsafe_user(request)
        if not user or not user.is_active:
            return None
        return request.unauthenticated_userid

    def unauthenticated_userid(self, request):
        return request.headers.get(self.api_user_email_login_header)

    def remember(self, request, userid, **kw):
        return []

    def forget(self, request):
        return []
