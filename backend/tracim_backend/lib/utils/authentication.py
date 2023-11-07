from abc import ABC
from abc import abstractmethod
import datetime
import json
import os
from pyramid.authentication import BasicAuthAuthenticationPolicy
from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.authentication import SessionAuthenticationHelper
from pyramid.authentication import SessionAuthenticationPolicy
from pyramid.authentication import extract_http_basic_credentials
from pyramid.config import Configurator
from pyramid.exceptions import Forbidden
from pyramid.httpexceptions import HTTPBadRequest
from pyramid.httpexceptions import HTTPFound
from pyramid.httpexceptions import HTTPNotFound
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.request import Request
from pyramid.response import Response
from pyramid.security import Allowed
from pyramid_ldap3 import get_ldap_connector
import re
from saml2 import BINDING_HTTP_POST
from saml2 import BINDING_HTTP_REDIRECT
from saml2.client import Saml2Client
from saml2.config import Config as Saml2Config
from saml2.metadata import create_metadata_string
from saml2.validate import ResponseLifetimeExceed
import time
import typing
from zope.interface import implementer

from tracim_backend.config import CFG  # noqa: F401
from tracim_backend.config import SamLIdPConfig
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

SAML_IDP_DEFAULT_CONFIG = {
    "default": {
        "logo_url": "",
        "displayed_name": "",
        "attribute_map": {
            "user_id": "${mail}",
            "email": "${eduPersonUniqueId}",
            "username": "${commonName}",
            "display_name": "${surName} ${givenName}",
        },
    }
}


class SAMLSecurityPolicy:
    def __init__(self, app_config: CFG, configurator: Configurator) -> None:
        self.app_config = app_config
        self._session_helper = SessionAuthenticationHelper()
        # TODO - SGD - 2023-07-26 - Add views for sso/slo/acs/sls
        #  The routes could also be defined through a controller (see Controller class)
        #  even if it added-value is small.

        # TODO - M.L - 2023-11-03 - Add documentation through swagger
        #  (currently is in the doc/setting.md file) or upgrade the way swagger generates
        #  documentation to ease the addition of non conventional routes

        self._load_settings(configurator)
        _config = configurator.get_settings().get("pyramid_saml")
        with open(_config.get("saml_path"), "r") as config_file:
            config_data = json.load(config_file)
            self.saml_config = Saml2Config()
            self.saml_config.load(config_data)
        self._metadata_response = Response(content_type="application/xml")
        self._metadata_response.text = create_metadata_string(
            config=self.saml_config, configfile=None
        ).decode()
        self.saml_client = Saml2Client(config=self.saml_config)

        for url, data in self.saml_client.config.vorg.items():
            if data.common_identifier not in app_config.SAML_IDP_LIST:
                idp_config = config_data["virtual_organization"][url]
                merged_config = SAML_IDP_DEFAULT_CONFIG["default"].copy()
                merged_config.update(idp_config)
                SAML_IDP_DEFAULT_CONFIG[data.common_identifier] = merged_config
                app_config.SAML_IDP_LIST.append(
                    SamLIdPConfig(
                        displayed_name=merged_config.get("displayed_name"),
                        identifier=data.common_identifier,
                        logo_url=merged_config.get("logo_url"),
                    )
                )

        configurator.add_route("acs", "/saml/acs", request_method="POST")
        configurator.add_route("sso", "/saml/sso", request_method="GET")
        configurator.add_route("slo_redirect", "/saml/slo/redirect", request_method="GET")
        configurator.add_route("slo_post", "/saml/slo/post", request_method="POST")
        configurator.add_route("metadata", "/saml/metadata", request_method="GET")
        configurator.add_view(self._acs, route_name="acs")
        configurator.add_view(self._sso, route_name="sso")
        configurator.add_view(self._slo, route_name="slo_redirect")
        configurator.add_view(self._slo, route_name="slo_post")
        configurator.add_view(self._metadata, route_name="metadata")

    def _load_settings(self, config: Configurator):
        """Parse and validate SAML configuration.

        Args:
            config (pyramid.config.Configurator): The configuration of the
                existing Pyramid application.
        """

        if "PYRAMID_SAML_PATH" in os.environ:
            if "pyramid_saml" not in config.get_settings():
                config.get_settings().update({"pyramid_saml": {}})
            config.get_settings().get("pyramid_saml").update(
                {"saml_path": os.environ.get("PYRAMID_SAML_PATH")}
            )

        if "pyramid_saml" not in config.get_settings():
            msg = "Missing 'pyramid_saml' configuration in settings"
            raise AssertionError(msg)
        else:
            settings = config.get_settings().get("pyramid_saml")

        if "saml_path" not in settings:
            msg = "Missing 'saml_path' in settings"
            raise AssertionError(msg)

    def authenticated_userid(
        self, request: TracimRequest
    ) -> typing.Optional[typing.Union[str, int]]:
        saml_user_id = request.session.get("saml_user_id")
        if saml_user_id is None:
            return None
        saml_expiry = request.session.get("saml_expiry")
        if saml_expiry is None or saml_expiry <= int(time.time()):
            return None

        user_api = UserApi(None, request.dbsession, self.app_config)

        user = user_api.saml_authenticate(
            user=None,
            user_id=saml_user_id,
            name=request.session.get("saml_display_name"),
            mail=request.session.get("saml_email"),
        )
        self.remember(request, user.user_id)
        request.set_user(user)
        return user.user_id

    def permits(self, request, context, permission):
        saml_expiry = request.session.get("saml_expiry")
        if saml_expiry is not None and saml_expiry <= int(time.time()):
            self.forget(request, context=context)
            return Forbidden("Session Expired")
        return Allowed("Allowed")

    def remember(
        self, request: TracimRequest, userid: typing.Union[str, int], **kw: typing.Any
    ) -> typing.Iterable[str]:
        self._session_helper.remember(request, userid)
        return []

    def forget(self, request: TracimRequest, **kw: typing.Any) -> typing.Iterable[str]:
        if "saml_user_id" in request.session:
            try:
                del request.session["saml_user_id"]
                del request.session["saml_email"]
                del request.session["saml_display_name"]
                del request.session["saml_expiry"]
            except Exception:
                pass
        self._session_helper.forget(request, **kw)
        return []

    # NOTE - M.L - 2023-10-25 - ACS (Assertion Consumer Service) is where the response
    #  sent by the SAML IdP is processed and consumed
    def _acs(self, request: TracimRequest) -> Response:
        if "RelayState" not in request.POST or "SAMLResponse" not in request.POST:
            return HTTPBadRequest()
        response = request.POST["SAMLResponse"]
        try:
            authn_response = self.saml_client.parse_authn_request_response(
                response,
                binding=BINDING_HTTP_POST,
            )
        except ResponseLifetimeExceed as e:
            return Response(e.__str__())
        if authn_response.not_on_or_after <= int(time.time()):
            return HTTPBadRequest()
        identity = authn_response.get_identity()
        if identity is None:
            return HTTPBadRequest()
        # NOTE - M.L - 2023-10-25 - RelayState is information conveyed through the auth process,
        #  this is here to keep info about at which idp the user authenticated
        idp_name = request.POST.get("RelayState")

        formatted_attributes = {}
        for key, value in SAML_IDP_DEFAULT_CONFIG[idp_name]["attribute_map"].items():
            # NOTE - M.L - 2023-10-25 - This regex parses the ${xxx} formatted attribute mapping
            #  it permits to find and replace multiple patterns in a same string
            #  \$ Matches the '$' character
            #  {(.*?)} matches this pattern {xxx} and captures and isolate in a group
            #  anything between the "{}", it matches between zero and unlimited times,
            #  as few times as possible, meaning that if it meets a '}', it will not be matched
            placeholders = re.findall(r"\${(.*?)}", value)
            formatted_value = value
            for placeholder in placeholders:
                if placeholder in identity:
                    formatted_value = formatted_value.replace(
                        f"${{{placeholder}}}", "".join(identity[placeholder])
                    )
            formatted_attributes[key] = formatted_value

        if "user_id" not in formatted_attributes:
            return HTTPBadRequest()
        request.session["saml_user_id"] = formatted_attributes["user_id"]
        if "email" in formatted_attributes:
            request.session["saml_email"] = formatted_attributes["email"]
        if "display_name" in formatted_attributes:
            request.session["saml_display_name"] = formatted_attributes["display_name"]
        request.session["saml_expiry"] = authn_response.not_on_or_after
        request.session["saml_name_id"] = authn_response.name_id.text

        return HTTPFound("/")

    def _sso(self, request: TracimRequest) -> Response:
        if "target" not in request.params:
            return HTTPBadRequest("Missing target parameter")

        target = None
        target_identifier = None
        for entity_id, data in self.saml_client.config.vorg.items():
            if request.params["target"] == data.common_identifier:
                target_identifier = data.common_identifier
                target = entity_id

        if target is None:
            return HTTPNotFound("This IdP doesn't exist")
        # NOTE - M.L - 2023-10-25 - RelayState is information conveyed through the auth process,
        #  this is here to keep info about at which idp the user authenticated
        req_id, info = self.saml_client.prepare_for_authenticate(
            relay_state=target_identifier,
            entityid=self.saml_config.metadata.metadata[target].entity_descr.entity_id,
        )

        redirect_url = None
        for key, value in info["headers"]:
            if key == "Location":
                redirect_url = value
        return HTTPFound(redirect_url)

    def _slo(self, request: TracimRequest) -> Response:
        http_args = request.GET if request.method == "GET" else request.POST
        saml_request = http_args.get("SAMLRequest", None)

        if not saml_request:
            return HTTPBadRequest("Missing SAMLRequest parameter")

        result = self.saml_client.parse_logout_request(saml_request, BINDING_HTTP_REDIRECT)
        if not result:
            return HTTPBadRequest("Invalid SLO request")

        self.forget(request, from_slo=True)
        return HTTPFound("/")

    def _metadata(self, request: TracimRequest) -> Response:
        return self._metadata_response


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
