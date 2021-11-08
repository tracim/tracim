# coding=utf-8
from http import HTTPStatus

from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.exceptions import ExpiredResetPasswordToken
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import InvalidResetPasswordToken
from tracim_backend.exceptions import MissingEmailCantResetPassword
from tracim_backend.exceptions import NotificationDisabledCantResetPassword
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import UserAuthTypeDisabled
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ResetPasswordCheckTokenSchema
from tracim_backend.views.core_api.schemas import ResetPasswordModifySchema
from tracim_backend.views.core_api.schemas import ResetPasswordRequestSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__AUTHENTICATION_ENDPOINTS

SWAGGER_TAG__RESET_PASSWORD_SECTION = "Reset Password"
SWAGGER_TAG__AUTHENTICATION_RESET_PASSWORD_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__AUTHENTICATION_ENDPOINTS, SWAGGER_TAG__RESET_PASSWORD_SECTION
)


class ResetPasswordController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__AUTHENTICATION_RESET_PASSWORD_ENDPOINTS])
    @hapic.handle_exception(MissingEmailCantResetPassword, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(NotificationDisabledCantResetPassword, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(
        ExternalAuthUserPasswordModificationDisallowed, http_code=HTTPStatus.BAD_REQUEST
    )
    @hapic.handle_exception(UserAuthTypeDisabled, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.input_body(ResetPasswordRequestSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def reset_password_request(self, context, request: TracimRequest, hapic_data=None):
        """
        Send a request to reset password. This will result in a new email sent to the user
        with a token to be used for password reset operation.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        if hapic_data.body.username:
            user = uapi.get_one_by_username(username=hapic_data.body.username)
        else:
            user = uapi.get_one_by_email(email=hapic_data.body.email)
        uapi.reset_password_notification(user, do_save=True)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__AUTHENTICATION_RESET_PASSWORD_ENDPOINTS])
    @hapic.handle_exception(ExpiredResetPasswordToken, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(InvalidResetPasswordToken, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(
        ExternalAuthUserPasswordModificationDisallowed, http_code=HTTPStatus.BAD_REQUEST
    )
    @hapic.handle_exception(UserAuthTypeDisabled, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.input_body(ResetPasswordCheckTokenSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def reset_password_check_token(self, context, request: TracimRequest, hapic_data=None):
        """
        Check reset_password token. The token sent by email has a limited life duration,
        this API allow to check that the token is existing and still valid.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        user = uapi.get_one_by_email(hapic_data.body.email)
        uapi.validate_reset_password_token(user, hapic_data.body.reset_password_token)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__AUTHENTICATION_RESET_PASSWORD_ENDPOINTS])
    @hapic.handle_exception(ExpiredResetPasswordToken, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(InvalidResetPasswordToken, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(
        ExternalAuthUserPasswordModificationDisallowed, http_code=HTTPStatus.BAD_REQUEST
    )
    @hapic.handle_exception(PasswordDoNotMatch, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserAuthTypeDisabled, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.input_body(ResetPasswordModifySchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def reset_password_modify(self, context, request: TracimRequest, hapic_data=None):
        """
        Do change the password. This requires the token received by email.
        After this request returns a 200, the user password is effectively changed
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(None, session=request.dbsession, config=app_config)
        user = uapi.get_one_by_email(hapic_data.body.email)
        uapi.set_password_reset_token(
            new_password=hapic_data.body.new_password,
            new_password2=hapic_data.body.new_password2,
            reset_token=hapic_data.body.reset_password_token,
            user=user,
            do_save=True,
        )
        return

    def bind(self, configurator: Configurator):
        # reset password request
        configurator.add_route(
            "reset_password_request", "/auth/password/reset/request", request_method="POST"
        )
        configurator.add_view(self.reset_password_request, route_name="reset_password_request")
        # check reset password token
        configurator.add_route(
            "reset_password_check_token", "/auth/password/reset/token/check", request_method="POST"
        )
        configurator.add_view(
            self.reset_password_check_token, route_name="reset_password_check_token"
        )
        # reset password, set password
        configurator.add_route(
            "reset_password_modify", "/auth/password/reset/modify", request_method="POST"
        )
        configurator.add_view(self.reset_password_modify, route_name="reset_password_modify")
