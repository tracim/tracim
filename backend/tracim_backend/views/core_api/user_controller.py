from pyramid.config import Configurator

from tracim_backend.models.auth import AuthType
from tracim_backend.exceptions import ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import UserAuthTypeDisabled
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import EmailAlreadyExistInDb
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import UserCantChangeIsOwnProfile
from tracim_backend.exceptions import UserCantDeleteHimself
from tracim_backend.exceptions import UserCantDisableHimself
from tracim_backend.exceptions import WrongUserPassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.authorization import is_administrator
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import \
    ActiveContentFilterQuerySchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentIdsQuerySchema
from tracim_backend.views.core_api.schemas import KnownMemberQuerySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ReadStatusSchema
from tracim_backend.views.core_api.schemas import SetEmailSchema
from tracim_backend.views.core_api.schemas import SetPasswordSchema
from tracim_backend.views.core_api.schemas import SetUserInfoSchema
from tracim_backend.views.core_api.schemas import SetUserProfileSchema
from tracim_backend.views.core_api.schemas import UserCreationSchema
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import \
    UserWorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import UserWorkspaceIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__ENABLE_AND_DISABLE_SECTION
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__NOTIFICATION_SECTION
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__TRASH_AND_RESTORE_SECTION

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__USER_ENDPOINTS = 'Users'
SWAGGER_TAG__USER_TRASH_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(  # nopep8
    SWAGGER_TAG__USER_ENDPOINTS,
    SWAGGER_TAG__TRASH_AND_RESTORE_SECTION
)

SWAGGER_TAG__USER_ENABLE_AND_DISABLE_ENDPOINTS = generate_documentation_swagger_tag(  # nopep8
    SWAGGER_TAG__USER_ENDPOINTS,
    SWAGGER_TAG__ENABLE_AND_DISABLE_SECTION
)
SWAGGER_TAG__USER_CONTENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS,
    SWAGGER_TAG__CONTENT_ENDPOINTS,
)
SWAGGER_TAG__USER_NOTIFICATION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS,
    SWAGGER_TAG__NOTIFICATION_SECTION,
)


class UserController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(WorkspaceDigestSchema(many=True),)
    def user_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of user workspaces
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        
        workspaces = wapi.get_all_for_user(request.candidate_user)
        return [
            wapi.get_workspace_with_context(workspace)
            for workspace in workspaces
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(has_personal_access)
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.output_body(UserDigestSchema(many=True))
    def users(self, context, request: TracimRequest, hapic_data=None):
        """
        Get all users
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        users = uapi.get_all()
        context_users = [
            uapi.get_user_with_context(user) for user in users
        ]
        return context_users

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(KnownMemberQuerySchema())  # nopep8
    @hapic.output_body(UserDigestSchema(many=True))
    def known_members(self, context, request: TracimRequest, hapic_data=None):
        """
        Get known users list
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
            show_deactivated=False,
        )
        users = uapi.get_known_user(
            acp=hapic_data.query.acp,
            exclude_user_ids=hapic_data.query.exclude_user_ids,
            exclude_workspace_ids=hapic_data.query.exclude_workspace_ids,
        )
        context_users = [
            uapi.get_user_with_context(user) for user in users
        ]
        return context_users

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(EmailAlreadyExistInDb, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ExternalAuthUserEmailModificationDisallowed, HTTPStatus.BAD_REQUEST)
    @check_right(has_personal_access)
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(PasswordDoNotMatch, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ExternalAuthUserPasswordModificationDisallowed, HTTPStatus.BAD_REQUEST)
    @check_right(has_personal_access)
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_body(SetUserInfoSchema())
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
            auth_type=request.candidate_user.auth_type,
            name=hapic_data.body.public_name,
            timezone=hapic_data.body.timezone,
            lang=hapic_data.body.lang,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(EmailAlreadyExistInDb, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
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
        password = hapic_data.body.password
        if not password and hapic_data.body.email_notification:
            password = password_generator()

        user = uapi.create_user(
            auth_type=AuthType.UNKNOWN,
            email=hapic_data.body.email,
            password=password,
            timezone=hapic_data.body.timezone,
            lang=hapic_data.body.lang,
            name=hapic_data.body.public_name,
            do_notify=hapic_data.body.email_notification,
            groups=groups,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENABLE_AND_DISABLE_ENDPOINTS])
    @check_right(is_administrator)
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(UserCantDeleteHimself, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def delete_user(self, context, request: TracimRequest, hapic_data=None):
        """
        delete user
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        uapi.delete(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_TRASH_AND_RESTORE_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def undelete_user(self, context, request: TracimRequest, hapic_data=None):
        """
        undelete user
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
            show_deleted=True,
        )
        uapi.undelete(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENABLE_AND_DISABLE_ENDPOINTS])
    @hapic.handle_exception(UserCantDisableHimself, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(UserCantChangeIsOwnProfile, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(SetUserProfileSchema())
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
            auth_type=request.candidate_user.auth_type,
            groups=groups,
            do_save=True,
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.input_query(ActiveContentFilterQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def last_active_content(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Get last_active_content for user
        """
        app_config = request.registry.settings['CFG']
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = None
        if hapic_data.path.workspace_id:
            workspace = wapi.get_one(hapic_data.path.workspace_id)
        before_content = None
        if content_filter.before_content_id:
            before_content = api.get_one(
                content_id=content_filter.before_content_id,
                workspace=workspace,
                content_type=content_type_list.Any_SLUG
            )
        last_actives = api.get_last_active(
            workspace=workspace,
            limit=content_filter.limit or None,
            before_content=before_content,
        )
        return [
            api.get_content_in_context(content)
            for content in last_actives
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.input_query(ContentIdsQuerySchema())
    @hapic.output_body(ReadStatusSchema(many=True))  # nopep8
    def contents_read_status(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        get user_read status of contents
        """
        app_config = request.registry.settings['CFG']
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = None
        if hapic_data.path.workspace_id:
            workspace = wapi.get_one(hapic_data.path.workspace_id)
        last_actives = api.get_last_active(
            workspace=workspace,
            limit=None,
            before_content=None,
            content_ids=hapic_data.query.content_ids or None
        )
        return [
            api.get_content_in_context(content)
            for content in last_actives
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_content_as_read(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of content to read
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.candidate_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_read(request.current_content, do_flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_content_as_unread(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of content to unread
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.candidate_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_unread(request.current_content, do_flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_workspace_as_read(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of all content of workspace to read
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.candidate_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_read__workspace(request.current_workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_NOTIFICATION_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def enable_workspace_notification(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        enable workspace notification
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.enable_notifications(request.candidate_user, workspace)
        rapi = RoleApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        role = rapi.get_one(request.candidate_user.user_id, workspace.workspace_id)
        wapi.save(workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_NOTIFICATION_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def disable_workspace_notification(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        disable workspace notification
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.disable_notifications(request.candidate_user, workspace)
        wapi.save(workspace)
        return

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # user workspace
        configurator.add_route('user_workspace', '/users/{user_id:\d+}/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.user_workspace, route_name='user_workspace')

        # user info
        configurator.add_route('user', '/users/{user_id:\d+}', request_method='GET')  # nopep8
        configurator.add_view(self.user, route_name='user')

        # users lists
        configurator.add_route('users', '/users', request_method='GET')  # nopep8
        configurator.add_view(self.users, route_name='users')

        # known members lists
        configurator.add_route('known_members', '/users/{user_id:\d+}/known_members', request_method='GET')  # nopep8
        configurator.add_view(self.known_members, route_name='known_members')

        # set user email
        configurator.add_route('set_user_email', '/users/{user_id:\d+}/email', request_method='PUT')  # nopep8
        configurator.add_view(self.set_user_email, route_name='set_user_email')

        # set user password
        configurator.add_route('set_user_password', '/users/{user_id:\d+}/password', request_method='PUT')  # nopep8
        configurator.add_view(self.set_user_password, route_name='set_user_password')  # nopep8

        # set user_info
        configurator.add_route('set_user_info', '/users/{user_id:\d+}', request_method='PUT')  # nopep8
        configurator.add_view(self.set_user_infos, route_name='set_user_info')

        # create user
        configurator.add_route('create_user', '/users', request_method='POST')
        configurator.add_view(self.create_user, route_name='create_user')

        # enable user
        configurator.add_route('enable_user', '/users/{user_id:\d+}/enabled', request_method='PUT')  # nopep8
        configurator.add_view(self.enable_user, route_name='enable_user')

        # disable user
        configurator.add_route('disable_user', '/users/{user_id:\d+}/disabled', request_method='PUT')  # nopep8
        configurator.add_view(self.disable_user, route_name='disable_user')

        # delete user
        configurator.add_route('delete_user', '/users/{user_id:\d+}/trashed', request_method='PUT')  # nopep8
        configurator.add_view(self.delete_user, route_name='delete_user')

        # undelete user
        configurator.add_route('undelete_user', '/users/{user_id:\d+}/trashed/restore', request_method='PUT')  # nopep8
        configurator.add_view(self.undelete_user, route_name='undelete_user')

        # set user profile
        configurator.add_route('set_user_profile', '/users/{user_id:\d+}/profile', request_method='PUT')  # nopep8
        configurator.add_view(self.set_profile, route_name='set_user_profile')

        # user content
        configurator.add_route('contents_read_status', '/users/{user_id:\d+}/workspaces/{workspace_id}/contents/read_status', request_method='GET')  # nopep8
        configurator.add_view(self.contents_read_status, route_name='contents_read_status')  # nopep8
        # last active content for user
        configurator.add_route('last_active_content', '/users/{user_id:\d+}/workspaces/{workspace_id}/contents/recently_active', request_method='GET')  # nopep8
        configurator.add_view(self.last_active_content, route_name='last_active_content')  # nopep8

        # set content as read/unread
        configurator.add_route('read_content', '/users/{user_id:\d+}/workspaces/{workspace_id}/contents/{content_id}/read', request_method='PUT')  # nopep8
        configurator.add_view(self.set_content_as_read, route_name='read_content')  # nopep8
        configurator.add_route('unread_content', '/users/{user_id:\d+}/workspaces/{workspace_id}/contents/{content_id}/unread', request_method='PUT')  # nopep8
        configurator.add_view(self.set_content_as_unread, route_name='unread_content')  # nopep8

        # set workspace as read
        configurator.add_route('read_workspace', '/users/{user_id:\d+}/workspaces/{workspace_id}/read', request_method='PUT')  # nopep8
        configurator.add_view(self.set_workspace_as_read, route_name='read_workspace')  # nopep8

        # enable workspace notification
        configurator.add_route('enable_workspace_notification', '/users/{user_id:\d+}/workspaces/{workspace_id}/notifications/activate', request_method='PUT')  # nopep8
        configurator.add_view(self.enable_workspace_notification, route_name='enable_workspace_notification')  # nopep8

        # enable workspace notification
        configurator.add_route('disable_workspace_notification', '/users/{user_id:\d+}/workspaces/{workspace_id}/notifications/deactivate', request_method='PUT')  # nopep8
        configurator.add_view(self.disable_workspace_notification, route_name='disable_workspace_notification')  # nopep8
