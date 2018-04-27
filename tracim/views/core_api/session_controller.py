# coding=utf-8
import os
from http.client import HTTPException

from pyramid.httpexceptions import HTTPNoContent
from pyramid.response import Response
from sqlalchemy.orm.exc import NoResultFound

from tracim import TracimRequest
from tracim.extensions import hapic
from tracim.lib.core.user import UserApi
from tracim.models.context_models import UserInContext
from tracim.views.controllers import Controller
from pyramid.config import Configurator

from tracim.views import BASE_API_V2
from tracim.views.core_api.schemas import UserSchema
from tracim.views.core_api.schemas import NoContentSchema

from tracim.views.core_api.schemas import LoginOutputHeaders
from tracim.views.core_api.schemas import BasicAuthSchema
from tracim.exceptions import NotAuthentificated
from tracim.exceptions import AuthenticationFailed

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


class SessionController(Controller):

    @hapic.with_api_doc()
    @hapic.input_headers(LoginOutputHeaders())
    @hapic.input_body(BasicAuthSchema())
    @hapic.handle_exception(AuthenticationFailed, HTTPStatus.BAD_REQUEST)
    # TODO - G.M - 17-04-2018 - fix output header ?
    # @hapic.output_headers()
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def login(self, context, request: TracimRequest, hapic_data=None):
        """
        Logs user into the system
        """
        email = request.json_body['email']
        password = request.json_body['password']
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            None,
            session=request.dbsession,
            config=app_config,
        )
        return uapi.authenticate_user(email, password)

    @hapic.with_api_doc()
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
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
        return uapi.get_current(in_context=True)

    def bind(self, configurator: Configurator):

        # Login
        configurator.add_route(
            'login',
            os.path.join(BASE_API_V2, 'sessions', 'login'),
            request_method='POST',
        )
        configurator.add_view(
            self.login,
            route_name='login',
        )
        # Logout
        configurator.add_route(
            'post_logout',
            os.path.join(BASE_API_V2, 'sessions', 'logout'),
            request_method='POST',
        )
        configurator.add_route(
            'get_logout',
            os.path.join(BASE_API_V2, 'sessions', 'logout'),
            request_method='GET',
        )
        configurator.add_view(
            self.logout,
            route_name='get_logout',
        )
        configurator.add_view(
            self.logout,
            route_name='post_logout',
        )
        # Whoami
        configurator.add_route(
            'whoami',
            os.path.join(BASE_API_V2, 'sessions', 'whoami'),
            request_method='GET',
        )
        configurator.add_view(
            self.whoami,
            route_name='whoami',
        )
