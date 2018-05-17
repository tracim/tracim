# coding=utf-8
from pyramid.config import Configurator
try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.user import UserApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.views.core_api.schemas import LoginOutputHeaders
from tracim.views.core_api.schemas import BasicAuthSchema
from tracim.exceptions import NotAuthentificated
from tracim.exceptions import AuthenticationFailed


class SessionController(Controller):

    @hapic.with_api_doc()
    @hapic.input_headers(LoginOutputHeaders())
    @hapic.input_body(BasicAuthSchema())
    @hapic.handle_exception(AuthenticationFailed, HTTPStatus.BAD_REQUEST)
    # TODO - G.M - 17-04-2018 - fix output header ?
    # @hapic.output_headers()
    @hapic.output_body(UserSchema(),)
    #@hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def login(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs user into the system
        """

        login = hapic_data.body
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            None,
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.authenticate_user(login.email, login.password)
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc()
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def logout(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs out current logged in user session
        """

        return

    @hapic.with_api_doc()
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    @hapic.output_body(UserSchema(),)
    def whoami(self, context, request: TracimRequest, hapic_data=None):
        """
        Return current logged in user or 401
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.get_current_user()  # User
        return uapi.get_user_with_context(user)

    def bind(self, configurator: Configurator):

        # Login
        configurator.add_route('login', '/sessions/login', request_method='POST')  # nopep8
        configurator.add_view(self.login, route_name='login')
        # Logout
        configurator.add_route('logout', '/sessions/logout', request_method='POST')  # nopep8
        configurator.add_view(self.logout, route_name='logout')
        configurator.add_route('logout_get', '/sessions/logout', request_method='GET')  # nopep8
        configurator.add_view(self.logout, route_name='logout_get')
        # Whoami
        configurator.add_route('whoami', '/sessions/whoami', request_method='GET')  # nopep8
        configurator.add_view(self.whoami, route_name='whoami',)
