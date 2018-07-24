import transaction
from pyramid.config import Configurator

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest

from tracim.exceptions import WrongUserPassword, PasswordDoNotMatch
from tracim.lib.core.group import GroupApi
from tracim.lib.utils.authorization import require_same_user_or_profile
from tracim.lib.utils.authorization import require_profile
from tracim.models import Group
from tracim.models.context_models import WorkspaceInContext
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserIdPathSchema
from tracim.views.core_api.schemas import UserSchema
from tracim.views.core_api.schemas import SetEmailSchema
from tracim.views.core_api.schemas import SetPasswordSchema
from tracim.views.core_api.schemas import UserInfosSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.views.core_api.schemas import UserCreationSchema
from tracim.views.core_api.schemas import UserProfileSchema
from tracim.views.core_api.schemas import WorkspaceDigestSchema

USER_ENDPOINTS_TAG = 'Users'


class UserController(Controller):

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(WorkspaceDigestSchema(many=True),)
    def user_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of user workspaces
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        
        workspaces = wapi.get_all_for_user(request.candidate_user)
        return [
            WorkspaceInContext(workspace, request.dbsession, app_config)
            for workspace in workspaces
        ]

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(UserSchema())
    def user(self, context, request: TracimRequest, hapic_data=None):
        """
        Get user infos.
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        return uapi.get_user_with_context(request.candidate_user)

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_body(SetEmailSchema())
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(UserSchema())
    def set_user_email(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user Email
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.set_email(
            request.candidate_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.email,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(PasswordDoNotMatch, HTTPStatus.BAD_REQUEST)
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_body(SetPasswordSchema())
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_user_password(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Set user password
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        uapi.set_password(
            request.candidate_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.new_password,
            hapic_data.body.new_password2,
            do_save=True
        )
        return

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_body(UserInfosSchema())
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(UserSchema())
    def set_user_infos(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user info data
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        user = uapi.update(
            request.candidate_user,
            name=hapic_data.body.public_name,
            timezone=hapic_data.body.timezone,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(UserCreationSchema())
    @hapic.output_body(UserSchema())
    def create_user(self, context, request: TracimRequest, hapic_data=None):
        """
        Create new user
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        gapi = GroupApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        groups = [gapi.get_one_with_name(hapic_data.body.profile)]
        user = uapi.create_user(
            email=hapic_data.body.email,
            password=hapic_data.body.password,
            timezone=hapic_data.body.timezone,
            name=hapic_data.body.public_name,
            do_notify=hapic_data.body.email_notification,
            groups=groups,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def enable_user(self, context, request: TracimRequest, hapic_data=None):
        """
        enable user
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        uapi.enable(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def disable_user(self, context, request: TracimRequest, hapic_data=None):
        """
        disable user
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        uapi.disable(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(UserProfileSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_profile(self, context, request: TracimRequest, hapic_data=None):
        """
        set user profile
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        gapi = GroupApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        groups = [gapi.get_one_with_name(hapic_data.body.profile)]
        uapi.update(
            user=request.candidate_user,
            groups=groups,
            do_save=True,
        )
        return

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # user workspace
        configurator.add_route('user_workspace', '/users/{user_id}/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.user_workspace, route_name='user_workspace')

        # user info
        configurator.add_route('user', '/users/{user_id}', request_method='GET')  # nopep8
        configurator.add_view(self.user, route_name='user')

        # set user email
        configurator.add_route('set_user_email', '/users/{user_id}/email', request_method='PUT')  # nopep8
        configurator.add_view(self.set_user_email, route_name='set_user_email')

        # set user password
        configurator.add_route('set_user_password', '/users/{user_id}/password', request_method='PUT')  # nopep8
        configurator.add_view(self.set_user_password, route_name='set_user_password')  # nopep8

        # set user_info
        configurator.add_route('set_user_info', '/users/{user_id}', request_method='PUT')  # nopep8
        configurator.add_view(self.set_user_infos, route_name='set_user_info')

        # create user
        configurator.add_route('create_user', '/users', request_method='POST')
        configurator.add_view(self.create_user, route_name='create_user')

        # enable user
        configurator.add_route('enable_user', '/users/{user_id}/enable', request_method='PUT')  # nopep8
        configurator.add_view(self.enable_user, route_name='enable_user')

        # disable user
        configurator.add_route('disable_user', '/users/{user_id}/disable', request_method='PUT')  # nopep8
        configurator.add_view(self.disable_user, route_name='disable_user')

        # set user profile
        configurator.add_route('set_user_profile', '/users/{user_id}/profile', request_method='PUT')  # nopep8
        configurator.add_view(self.set_profile, route_name='set_user_profile')
