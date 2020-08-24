# coding=utf-8
from hapic.data import HapicData
from pyramid.config import Configurator
from pyramid.security import forget
from pyramid.security import remember
from pyramid_ldap3 import get_ldap_connector

from tracim_backend import AuthenticationFailed
from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.live_messages import LiveMessagesLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models.auth import AuthType
from tracim_backend.models.context_models import LoginCredentials
from tracim_backend.models.context_models import UserInContext
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import BasicAuthSchema
from tracim_backend.views.core_api.schemas import LoginOutputHeaders
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__AUTHENTICATION_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


class SessionController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__AUTHENTICATION_ENDPOINTS])
    @hapic.input_headers(LoginOutputHeaders())
    @hapic.input_body(BasicAuthSchema())
    @hapic.output_body(UserSchema())
    def login(self, context, request: TracimRequest, hapic_data: HapicData) -> UserInContext:
        """
        Logs the user into the system.
        In case of success, the JSON returned is the user profile.
        In that case, a cookie is created with a session_key and an expiration date.
        Eg. : `session_key=932d2ad68f3a094c2d4da563ccb921e6479729f5b5f707eba91d4194979df20831be48a0; expires=Mon, 22-Oct-2018 19:37:02 GMT; Path=/; SameSite=Lax`
        """

        login = hapic_data.body  # type: LoginCredentials
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        ldap_connector = None
        if AuthType.LDAP in app_config.AUTH_TYPES:
            ldap_connector = get_ldap_connector(request)

        user = None
        if login.email:
            try:
                user = uapi.authenticate(
                    login=login.email, password=login.password, ldap_connector=ldap_connector,
                )
            except AuthenticationFailed as exc:
                if not login.username:
                    raise exc

        if user is None:
            user = uapi.authenticate(
                login=login.username, password=login.password, ldap_connector=ldap_connector,
            )

        remember(request, user.user_id)
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__AUTHENTICATION_ENDPOINTS])
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def logout(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs out current logged in user. This also trashes the associated session and the
        live message connections of the current user.
        """
        if request.authenticated_userid:
            app_config = request.registry.settings["CFG"]  # type: CFG
            LiveMessagesLib(app_config).close_channel_connections(
                LiveMessagesLib.user_grip_channel(request.current_user.user_id)
            )
        forget(request)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__AUTHENTICATION_ENDPOINTS])
    @hapic.output_body(UserSchema())
    def whoami(self, context, request: TracimRequest, hapic_data=None):
        """
        Return current logged-in user.
        If user is not authenticated or the session has expired, a 401 is returned.
        This is the recommanded way to check if the user is already authenticated
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(request.current_user, session=request.dbsession, config=app_config)
        user = uapi.get_current_user()  # User
        return uapi.get_user_with_context(user)

    def bind(self, configurator: Configurator):

        # Login
        configurator.add_route("login", "/auth/login", request_method="POST")
        configurator.add_view(self.login, route_name="login")
        # Logout
        configurator.add_route("logout", "/auth/logout", request_method="POST")
        configurator.add_view(self.logout, route_name="logout")
        configurator.add_route("logout_get", "/auth/logout", request_method="GET")
        configurator.add_view(self.logout, route_name="logout_get")
        # Whoami
        configurator.add_route("whoami", "/auth/whoami", request_method="GET")
        configurator.add_view(self.whoami, route_name="whoami")
