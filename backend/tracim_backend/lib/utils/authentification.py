from abc import ABC
from abc import abstractmethod
import datetime
import typing

from pyramid.authentication import BasicAuthAuthenticationPolicy
from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.authentication import SessionAuthenticationPolicy
from pyramid.authentication import extract_http_basic_credentials
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.request import Request
from pyramid_ldap3 import get_ldap_connector
from zope.interface import implementer

from tracim_backend.config import CFG
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import User

BASIC_AUTH_WEBUI_REALM = "tracim"
TRACIM_API_KEY_HEADER = "Tracim-Api-Key"
TRACIM_API_USER_EMAIL_LOGIN_HEADER = "Tracim-Api-Login"
AUTH_TOKEN_QUERY_PARAMETER = "access_token"


class TracimAuthenticationPolicy(ABC):
    """
    Abstract class with some helper for Pyramid TracimAuthentificationPolicy
    """

    def _get_auth_unsafe_user(
        self,
        request: Request,
        email: typing.Optional[str] = None,
        user_id: typing.Optional[int] = None,
        token: typing.Optional[str] = None,
    ) -> typing.Optional[User]:
        """
        Helper to get user from email or user_id in pyramid request
        (process check user_id first)
        :param request: pyramid request
        :param email: email of the user, optional
        :param user_id: user_id of the user, optional
        :return: User or None
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        try:
            _, user = uapi.find(user_id=user_id, email=email, token=token)
            return user
        except UserDoesNotExist:
            return None

    def _authenticate_user(
        self, request: Request, login: typing.Optional[str], password: typing.Optional[str],
    ) -> typing.Optional[User]:
        """
        Helper to authenticate user in pyramid request
        from user email or username and password
        :param request: pyramid request
        :return: User or None
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        ldap_connector = None
        if AuthType.LDAP in app_config.AUTH_TYPES:
            ldap_connector = get_ldap_connector(request)
        try:
            user = uapi.authenticate(login=login, password=password, ldap_connector=ldap_connector,)
            return user
        except AuthenticationFailed:
            return None

    def _remote_authenticated_user(self, request: Request, email: str) -> typing.Optional[User]:
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        if not app_config.REMOTE_USER_HEADER:
            return None
        try:
            return uapi.remote_authenticate(email)
        except AuthenticationFailed:
            return None

    @abstractmethod
    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        pass

    def authenticated_user(self, request: TracimRequest) -> typing.Optional[User]:
        user = self.get_current_user(request)
        if user:
            request.set_user(user)
        return user

    def authenticated_userid(self, request: TracimRequest) -> typing.Optional[int]:
        if not request._current_user:
            user = self.authenticated_user(request)
            if not user:
                return None
        return request._current_user.user_id


###
# Pyramid HTTP Basic Auth
###


@implementer(IAuthenticationPolicy)
class TracimBasicAuthAuthenticationPolicy(
    TracimAuthenticationPolicy, BasicAuthAuthenticationPolicy
):
    def __init__(self, realm: str) -> None:
        BasicAuthAuthenticationPolicy.__init__(self, check=None, realm=realm)
        # TODO - G.M - 2018-09-21 - Disable callback is needed to have BasicAuth
        # correctly working, if enabled, callback method will try check method
        # who is now disabled (uneeded because we use directly
        # authenticated_user_id) and failed.
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        # check if user is correct
        credentials = extract_http_basic_credentials(request)
        if not credentials:
            return None

        user = self._authenticate_user(
            request=request, login=credentials.username, password=credentials.password
        )
        if not user:
            return None
        return user


###
# Pyramid cookie auth policy
###


@implementer(IAuthenticationPolicy)
class CookieSessionAuthentificationPolicy(TracimAuthenticationPolicy, SessionAuthenticationPolicy):
    def __init__(self, reissue_time: int, debug: bool = False):
        SessionAuthenticationPolicy.__init__(self, debug=debug, callback=None)
        self._reissue_time = reissue_time
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        # check if user is correct
        # INFO - G.M - 2018-10-23 - skip non-int user_id
        # if we are using basic_auth policy, unauthenticated_userid is string,
        # this means this policy is not the correct one. Explictly not checking
        # this avoid issue in some database because int is expected not string.
        if not isinstance(request.unauthenticated_userid, int):
            request.session.delete()
            return None
        user = self._get_auth_unsafe_user(request, user_id=request.unauthenticated_userid)
        # do not allow invalid_user + ask for cleanup of session cookie
        if not user or not user.is_active or user.is_deleted:
            request.session.delete()
            return None
        # recreate session if need renew
        if not request.session.new:
            now = datetime.datetime.now()
            last_access_datetime = datetime.datetime.utcfromtimestamp(request.session.last_accessed)
            reissue_limit = last_access_datetime + datetime.timedelta(seconds=self._reissue_time)
            if now > reissue_limit:
                request.session.regenerate_id()
        return user

    def forget(self, request: TracimRequest) -> typing.List[typing.Any]:
        """ Remove the stored userid from the session."""
        if self.userid_key in request.session:
            request.session.delete()
        return []


###
# RemoteUser auth
###


@implementer(IAuthenticationPolicy)
class RemoteAuthentificationPolicy(TracimAuthenticationPolicy, CallbackAuthenticationPolicy):
    def __init__(self, remote_user_email_login_header: str) -> None:
        self.remote_user_email_login_header = remote_user_email_login_header
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        user = self._remote_authenticated_user(
            request=request, email=self.unauthenticated_userid(request)
        )
        if not user:
            return None
        return user

    def unauthenticated_userid(self, request: TracimRequest) -> str:
        return request.environ.get(self.remote_user_email_login_header)

    def remember(
        self, request: TracimRequest, userid: int, **kw: typing.Any
    ) -> typing.List[typing.Any]:
        return []

    def forget(self, request: TracimRequest) -> typing.List[typing.Any]:
        return []


###
# Pyramid API key auth
###


@implementer(IAuthenticationPolicy)
class ApiTokenAuthentificationPolicy(TracimAuthenticationPolicy, CallbackAuthenticationPolicy):
    def __init__(self, api_key_header: str, api_user_email_login_header: str) -> None:
        self.api_key_header = api_key_header
        self.api_user_email_login_header = api_user_email_login_header
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        app_config = request.registry.settings["CFG"]  # type: CFG
        valid_api_key = app_config.API__KEY
        api_key = request.headers.get(self.api_key_header)
        if not api_key or not valid_api_key:
            return None
        if valid_api_key != api_key:
            return None
        # check if user is correct
        user = self._get_auth_unsafe_user(request, email=request.unauthenticated_userid)
        if not user or not user.is_active or user.is_deleted:
            return None
        return user

    def unauthenticated_userid(self, request: TracimRequest) -> str:
        return request.headers.get(self.api_user_email_login_header)

    def remember(
        self, request: TracimRequest, userid: int, **kw: typing.Any
    ) -> typing.List[typing.Any]:
        return []

    def forget(self, request: TracimRequest) -> typing.List[typing.Any]:
        return []


###
# QueryTokenAuthPolicy
###


@implementer(IAuthenticationPolicy)
class QueryTokenAuthentificationPolicy(TracimAuthenticationPolicy, CallbackAuthenticationPolicy):
    def __init__(self) -> None:
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        app_config = request.registry.settings["CFG"]  # type: CFG
        # check if user is correct
        token = self.unauthenticated_userid(request)
        if not token:
            return None
        user = self._get_auth_unsafe_user(request=request, token=token)
        if not user:
            return None
        if not user.validate_auth_token(token, app_config.USER__AUTH_TOKEN__VALIDITY):
            return None
        if not user.is_active or user.is_deleted:
            return None
        return user

    def unauthenticated_userid(self, request: TracimRequest) -> str:
        return request.params.get(AUTH_TOKEN_QUERY_PARAMETER)

    def remember(
        self, request: TracimRequest, userid: int, **kw: typing.Any
    ) -> typing.List[typing.Any]:
        return []

    def forget(self, request: TracimRequest) -> typing.List[typing.Any]:
        return []
