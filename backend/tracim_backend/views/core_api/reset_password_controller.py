# coding=utf-8
from pyramid.config import Configurator

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.user import UserApi
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ResetPasswordRequestSchema
from tracim_backend.views.core_api.schemas import ResetPasswordCheckTokenSchema
from tracim_backend.views.core_api.schemas import ResetPasswordModifySchema
from tracim_backend.exceptions import UnvalidResetPasswordToken
from tracim_backend.exceptions import ExpiredResetPasswordToken
from tracim_backend.exceptions import PasswordDoNotMatch

SWAGGER_TAG__RESET_PASSWORD_ENDPOINTS = 'Reset Password'


class ResetPasswordController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__RESET_PASSWORD_ENDPOINTS])
    @hapic.input_body(ResetPasswordRequestSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def reset_password_request(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Request to reset password
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            None,
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.get_one_by_email(hapic_data.body.email)
        uapi.reset_password_notification(user, do_save=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__RESET_PASSWORD_ENDPOINTS])
    @hapic.handle_exception(ExpiredResetPasswordToken, http_code=HTTPStatus.UNAUTHORIZED)  # nopep8
    @hapic.handle_exception(UnvalidResetPasswordToken, http_code=HTTPStatus.UNAUTHORIZED)  # nopep8
    @hapic.input_body(ResetPasswordCheckTokenSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def reset_password_check_token(self, context, request: TracimRequest, hapic_data=None):   # nopep8
        """
        check reset_password token
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            None,
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.get_one_by_email(hapic_data.body.email)
        uapi.validate_reset_password_token(user, hapic_data.body.reset_password_token)  # nopep8
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__RESET_PASSWORD_ENDPOINTS])
    @hapic.handle_exception(ExpiredResetPasswordToken, http_code=HTTPStatus.UNAUTHORIZED)  # nopep8
    @hapic.handle_exception(UnvalidResetPasswordToken, http_code=HTTPStatus.UNAUTHORIZED)  # nopep8
    @hapic.handle_exception(PasswordDoNotMatch, http_code=HTTPStatus.BAD_REQUEST)  # nopep8
    @hapic.input_body(ResetPasswordModifySchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def reset_password_modify(self, context, request: TracimRequest, hapic_data=None):   # nopep8
        """
        change password with reset_password token
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            None,
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.get_one_by_email(hapic_data.body.email)
        uapi.set_password_reset_token(
            new_password=hapic_data.body.new_password,
            new_password2=hapic_data.body.new_password2,
            reset_token=hapic_data.body.reset_password_token,
            user=user,
            do_save=True
        )
        return

    def bind(self, configurator: Configurator):
        # reset password request
        configurator.add_route('reset_password_request', '/reset_password/request', request_method='POST')  # nopep8
        configurator.add_view(self.reset_password_request, route_name='reset_password_request')  # nopep8
        # check reset password token
        configurator.add_route('reset_password_check_token', '/reset_password/check_token', request_method='POST')  # nopep8
        configurator.add_view(self.reset_password_check_token, route_name='reset_password_check_token')  # nopep8
        # reset password, set password
        configurator.add_route('reset_password_modify', '/reset_password/modify', request_method='POST')  # nopep8
        configurator.add_view(self.reset_password_modify, route_name='reset_password_modify')  # nopep8
