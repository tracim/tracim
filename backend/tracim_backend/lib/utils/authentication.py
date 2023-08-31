from abc import ABC
from abc import abstractmethod
import datetime
from pyramid.authentication import BasicAuthAuthenticationPolicy
from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.authentication import SessionAuthenticationHelper
from pyramid.authentication import SessionAuthenticationPolicy
from pyramid.authentication import extract_http_basic_credentials
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPFound
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.request import Request
from pyramid.response import Response
from pyramid.security import Allowed
from pyramid.security import Denied
from pyramid_ldap3 import get_ldap_connector
import time
import typing
from zope.interface import implementer

from tracim_backend.config import CFG  # noqa: F401
from tracim_backend.exceptions import AuthenticationFailed
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import User

BASIC_AUTH_WEBUI_REALM = "tracim"
TRACIM_API_KEY_HEADER = "Tracim-Api-Key"
TRACIM_API_USER_LOGIN_HEADER = "Tracim-Api-Login"
AUTH_TOKEN_QUERY_PARAMETER = "access_token"
CLIENT_TOKEN_HEADER = "X-Tracim-ClientToken"


class SAMLSecurityPolicy:
    def __init__(self, app_config: CFG, configurator: Configurator) -> None:
        self.app_config = app_config
        self._session_helper = SessionAuthenticationHelper()
        # TODO - SGD - 2023-07-26 - Add views for sso/slo/acs/sls
        # The routes could also be defined through a controller (see Controller class)
        # even if it added-value is small.
        configurator.add_forbidden_view(self._idp_chooser)

        configurator.add_route("acs", "/saml/acs", request_method="POST")
        configurator.add_view(self._acs, route_name="acs")

    def authenticated_userid(
        self, request: TracimRequest
    ) -> typing.Optional[typing.Union[str, int]]:
        # FIXME - SGD - 2023-07-26 - Return Tracim user id when SAML data is present in the session.
        # By matching it with SAML ID attribute (in external_id, see https://github.com/tracim/tracim/issues/6209)
        saml_user_id = request.session.get("saml_user_id")
        if saml_user_id is None:
            return None
        user_api = UserApi(None, request.dbsession, self.app_config)
        try:
            user = user_api.get_one_by_login(saml_user_id)
        except UserDoesNotExist:
            user = user_api.create_minimal_user(
                username=saml_user_id, email=f"{saml_user_id}@saml.test", save_now=True
            )
        self.remember(request, user.user_id)
        request.set_user(user)
        return user.user_id

    def permits(self, request, context, permission):
        if request.authenticated_userid is None and not request.path.startswith("/saml"):
            return Denied("Nobody is allowed")
        return Allowed("Allowed")

    def remember(
        self, request: TracimRequest, userid: typing.Union[str, int], **kw: typing.Any
    ) -> typing.Iterable[str]:
        self._session_helper.remember(request, userid)
        return []

    def forget(self, request: TracimRequest, **kw: typing.Any) -> typing.Iterable[str]:
        del request.session["saml_user_id"]
        self._session_helper.forget(request, **kw)
        return []

    def _idp_chooser(self, request: TracimRequest) -> Response:
        # TODO - SGD - 2023-07-26 - This view should render an HTML form
        # with the list of configured IdPs.
        # The form should redirect to the chosen IdPs SSO endpoint when submitted.
        # Maybe some JS will be needed here?
        return Response(
            f"""
          <form action="{self.app_config.WEBSITE__BASE_URL}/saml/acs" method="POST">
            <input name="saml_user_id" type="hidden" value="saml-user"/>
            <input name="redirect_url" type="hidden" value="{request.path_url}" />
            <button>Login</button>
          </form>"""
        )

    def _acs(self, request: TracimRequest) -> Response:
        saml_user_id = request.params.get("saml_user_id")
        if saml_user_id is not None:
            request.session["saml_user_id"] = saml_user_id
        return HTTPFound(request.params["redirect_url"])


class TracimAuthenticationPolicy(ABC):
    """
    Abstract class with some helper for Pyramid TracimAuthenticationPolicy
    """

    def _get_user_api(self, request: Request) -> "UserApi":
        app_config = request.registry.settings["CFG"]  # type: CFG
        return UserApi(None, session=request.dbsession, config=app_config)

    def _authenticate_user(
        self,
        request: Request,
        login: typing.Optional[str],
        password: typing.Optional[str],
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
            user = uapi.authenticate(
                login=login,
                password=password,
                ldap_connector=ldap_connector,
            )
            return user
        except AuthenticationFailed:
            return None

    def _remote_authenticated_user(
        self, request: Request, login: typing.Optional[str]
    ) -> typing.Optional[User]:
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        if not app_config.REMOTE_USER_HEADER or not login:
            return None
        try:
            return uapi.remote_authenticate(login)
        except AuthenticationFailed:
            return None

    @abstractmethod
    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        pass

    def authenticated_user(self, request: TracimRequest) -> typing.Optional[User]:
        user = self.get_current_user(request)
        if user:
            request.set_user(user)
        client_token = request.headers.get(CLIENT_TOKEN_HEADER)
        if client_token:
            request.set_client_token(client_token)

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
class CookieSessionAuthenticationPolicy(TracimAuthenticationPolicy, SessionAuthenticationPolicy):
    COOKIE_LAST_SET_TIME = "cookie_last_set_time"

    def __init__(self, debug: bool = False):
        SessionAuthenticationPolicy.__init__(self, debug=debug, callback=None)
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        # check if user is correct
        # INFO - G.M - 2018-10-23 - skip non-int user_id
        # if we are using basic_auth policy, unauthenticated_userid is string,
        # this means this policy is not the correct one. Explictly not checking
        # this avoid issue in some database because int is expected not string.
        unauthenticated_user_id = self.unauthenticated_userid(request)
        if not isinstance(unauthenticated_user_id, int):
            return None
        try:
            user = self._get_user_api(request).get_one(user_id=unauthenticated_user_id)
        except UserDoesNotExist:
            user = None
        # do not allow invalid_user
        if not user or not user.is_active or user.is_deleted:
            return None

        # ensure cookie expiry date is updated if it is too old
        if not request.session.new:
            # all computation is done in timestamps (Epoch)
            cookie_last_set_time = (
                request.session.get(self.COOKIE_LAST_SET_TIME) or request.session.created
            )

            # convert beaker parameter to timestamp
            cookie_expires = request.session.cookie_expires
            cookie_expires_time = None  # type: typing.Optional[float]
            if isinstance(cookie_expires, datetime.datetime):
                cookie_expires_time = cookie_expires.timestamp()
            elif isinstance(cookie_expires, datetime.timedelta):
                cookie_expires_time = cookie_last_set_time + cookie_expires.total_seconds()
            # the cases left are when session.cookie_expires is a boolean
            # which means there is no expiry date, so no renewal to do

            if cookie_expires_time is not None:
                max_cookie_age = cookie_expires_time - cookie_last_set_time
                current_cookie_age = time.time() - cookie_last_set_time
                if current_cookie_age > 0.5 * max_cookie_age:
                    request.session[self.COOKIE_LAST_SET_TIME] = time.time()
                    request.session.save()
                    request.session._update_cookie_out()

        return user

    def forget(self, request: TracimRequest) -> typing.List[typing.Any]:
        """Remove the stored userid from the session."""
        if self.helper.userid_key in request.session:
            request.session.delete()
        return []


###
# RemoteUser auth
###


@implementer(IAuthenticationPolicy)
class RemoteAuthenticationPolicy(TracimAuthenticationPolicy, CallbackAuthenticationPolicy):
    def __init__(self, remote_user_login_header: str) -> None:
        self.remote_user_login_header = remote_user_login_header
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        user = self._remote_authenticated_user(
            request=request, login=self.unauthenticated_userid(request)
        )
        if not user:
            return None
        return user

    def unauthenticated_userid(self, request: TracimRequest) -> typing.Optional[str]:
        """Return the user id found in the configured header.

        MUST return None if no user id is found as pyramid_multiauth tests
        the validity with `userid is None`.
        """
        return request.environ.get(self.remote_user_login_header)

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
class ApiTokenAuthenticationPolicy(TracimAuthenticationPolicy, CallbackAuthenticationPolicy):
    def __init__(self, api_key_header: str, api_user_login_header: str) -> None:
        self.api_key_header = api_key_header
        self.api_user_login_header = api_user_login_header
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
        try:
            user = self._get_user_api(request).get_one_by_login(
                login=self.unauthenticated_userid(request)
            )
        except UserDoesNotExist:
            user = None
        if not user or not user.is_active or user.is_deleted:
            return None
        return user

    def unauthenticated_userid(self, request: TracimRequest) -> typing.Optional[str]:
        """Return the user id found in the configured header.

        MUST return None if no user id is found as pyramid_multiauth tests
        the validity with `userid is None`.
        """
        return request.headers.get(self.api_user_login_header)

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
class QueryTokenAuthenticationPolicy(TracimAuthenticationPolicy, CallbackAuthenticationPolicy):
    def __init__(self) -> None:
        self.callback = None

    def get_current_user(self, request: TracimRequest) -> typing.Optional[User]:
        app_config = request.registry.settings["CFG"]  # type: CFG
        # check if user is correct
        token = self.unauthenticated_userid(request)
        if not token:
            return None
        try:
            user = self._get_user_api(request).get_one_by_token(token=token)
        except UserDoesNotExist:
            user = None
        if not user:
            return None
        if not user.validate_auth_token(token, app_config.USER__AUTH_TOKEN__VALIDITY):
            return None
        if not user.is_active or user.is_deleted:
            return None
        return user

    def unauthenticated_userid(self, request: TracimRequest) -> typing.Optional[str]:
        """Return the user id found in the query parameter.
        The user id in this case in the user's token.

        MUST return None if no user id is found as pyramid_multiauth tests
        the validity with `userid is None`.
        """
        return request.params.get(AUTH_TOKEN_QUERY_PARAMETER)

    def remember(
        self, request: TracimRequest, userid: int, **kw: typing.Any
    ) -> typing.List[typing.Any]:
        return []

    def forget(self, request: TracimRequest) -> typing.List[typing.Any]:
        return []
