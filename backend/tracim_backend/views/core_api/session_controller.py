# coding=utf-8
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPFound
from pyramid.security import forget
from pyramid.security import remember
from pyramid.response import Response

from tracim_backend.extensions import hapic
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import BasicAuthSchema
from tracim_backend.views.core_api.schemas import LoginOutputHeaders
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import UserSchema

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__SESSION_ENDPOINTS = 'Session'


class SessionController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__SESSION_ENDPOINTS])
    @hapic.input_headers(LoginOutputHeaders())
    @hapic.input_body(BasicAuthSchema())
    @hapic.output_body(UserSchema())
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
        remember(request, user.user_id)
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__SESSION_ENDPOINTS])
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def logout(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs out current logged in user session
        """
        request.session.delete()
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__SESSION_ENDPOINTS])
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
