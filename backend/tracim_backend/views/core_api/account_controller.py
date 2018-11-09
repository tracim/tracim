from pyramid.config import Configurator

from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import EmailAlreadyExistInDb
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import WrongUserPassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.group import GroupApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import require_profile
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models import Group
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import \
    ActiveContentFilterQuerySchema
from tracim_backend.views.core_api.schemas import KnownMemberQuerySchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentIdsQuerySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ReadStatusSchema
from tracim_backend.views.core_api.schemas import SetEmailSchema
from tracim_backend.views.core_api.schemas import SetPasswordSchema
from tracim_backend.views.core_api.schemas import SetUserInfoSchema
from tracim_backend.views.core_api.schemas import SetUserProfileSchema
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import \
    WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__NOTIFICATION_SECTION

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

SWAGGER_TAG__ACCOUNT_ENDPOINTS = 'Account'
SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__ACCOUNT_ENDPOINTS,
    SWAGGER_TAG__CONTENT_ENDPOINTS,
)
SWAGGER_TAG__ACCOUNT_NOTIFICATION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__ACCOUNT_ENDPOINTS,
    SWAGGER_TAG__NOTIFICATION_SECTION,
)


class AccountController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.output_body(UserSchema())
    def account(self, context, request: TracimRequest, hapic_data=None):
        """
        Get user infos.
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        return uapi.get_user_with_context(request.current_user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_body(SetUserInfoSchema())
    @hapic.output_body(UserSchema())
    def set_account_infos(self, context, request: TracimRequest, hapic_data=None):
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
            request.current_user,
            name=hapic_data.body.public_name,
            timezone=hapic_data.body.timezone,
            lang=hapic_data.body.lang,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_query(KnownMemberQuerySchema())
    @hapic.output_body(UserDigestSchema(many=True))
    def account_known_members(self, context, request: TracimRequest, hapic_data=None):
        """
        Get known users list
        """
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            current_user=request.current_user,  # User
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(EmailAlreadyExistInDb, HTTPStatus.BAD_REQUEST)
    @require_profile(Group.TIM_USER)
    @hapic.input_body(SetEmailSchema())
    @hapic.output_body(UserSchema())
    def set_account_email(self, context, request: TracimRequest, hapic_data=None):
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
            request.current_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.email,
            do_save=True
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(PasswordDoNotMatch, HTTPStatus.BAD_REQUEST)
    @require_profile(Group.TIM_USER)
    @hapic.input_body(SetPasswordSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_account_password(self, context, request: TracimRequest, hapic_data=None):  # nopep8
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
            request.current_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.new_password,
            hapic_data.body.new_password2,
            do_save=True
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.output_body(WorkspaceDigestSchema(many=True),)
    def account_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of auth user workspaces
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )

        workspaces = wapi.get_all_for_user(request.current_user)
        return [
            wapi.get_workspace_with_context(workspace)
            for workspace in workspaces
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(ActiveContentFilterQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def account_last_active_content(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Get last_active_content for user
        """
        app_config = request.registry.settings['CFG']
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(ContentIdsQuerySchema())
    @hapic.output_body(ReadStatusSchema(many=True))  # nopep8
    def account_contents_read_status(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        get user_read status of contents
        """
        app_config = request.registry.settings['CFG']
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_account_content_as_read(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of content to read
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_read(request.current_content, do_flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_account_content_as_unread(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of content to unread
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_unread(request.current_content, do_flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_account_workspace_as_read(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of all content of workspace to read
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_read__workspace(request.current_workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_NOTIFICATION_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def enable_account_workspace_notification(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        enable workspace notification
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.enable_notifications(request.current_user, workspace)
        rapi = RoleApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        role = rapi.get_one(request.current_user.user_id, workspace.workspace_id)  # nopep8
        wapi.save(workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_NOTIFICATION_ENDPOINTS])
    @require_profile(Group.TIM_USER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def disable_account_workspace_notification(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        disable workspace notification
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.disable_notifications(request.current_user, workspace)
        wapi.save(workspace)
        return

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # account workspace
        configurator.add_route('account_workspace', '/users/me/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.account_workspace, route_name='account_workspace')

        # account info
        configurator.add_route('account', '/users/me', request_method='GET')  # nopep8
        configurator.add_view(self.account, route_name='account')
        #
        #
        # known members lists
        configurator.add_route('account_known_members', '/users/me/known_members', request_method='GET')  # nopep8
        configurator.add_view(self.account_known_members, route_name='account_known_members')
        #
        # set account email
        configurator.add_route('set_account_email', '/users/me/email', request_method='PUT')  # nopep8
        configurator.add_view(self.set_account_email, route_name='set_account_email')

        # set account password
        configurator.add_route('set_account_password', '/users/me/password', request_method='PUT')  # nopep8
        configurator.add_view(self.set_account_password, route_name='set_account_password')  # nopep8

        # set account_infos
        configurator.add_route('set_account_info', '/users/me', request_method='PUT')  # nopep8
        configurator.add_view(self.set_account_infos, route_name='set_account_info')

        # account content
        configurator.add_route('account_contents_read_status', '/users/me/workspaces/{workspace_id}/contents/read_status', request_method='GET')  # nopep8
        configurator.add_view(self.account_contents_read_status, route_name='account_contents_read_status')  # nopep8
        # last active content for user
        configurator.add_route('account_last_active_content', '/users/me/workspaces/{workspace_id}/contents/recently_active', request_method='GET')  # nopep8
        configurator.add_view(self.account_last_active_content, route_name='account_last_active_content')  # nopep8

        # set content as read/unread
        configurator.add_route('account_read_content', '/users/me/workspaces/{workspace_id}/contents/{content_id}/read', request_method='PUT')  # nopep8
        configurator.add_view(self.set_account_content_as_read, route_name='account_read_content')  # nopep8

        configurator.add_route('account_unread_content', '/users/me/workspaces/{workspace_id}/contents/{content_id}/unread', request_method='PUT')  # nopep8
        configurator.add_view(self.set_account_content_as_unread, route_name='account_unread_content')  # nopep8

        # set workspace as read
        configurator.add_route('account_read_workspace', '/users/me/workspaces/{workspace_id}/read', request_method='PUT')  # nopep8
        configurator.add_view(self.set_account_workspace_as_read, route_name='account_read_workspace')  # nopep8

        # enable workspace notification
        configurator.add_route('enable_account_workspace_notification', '/users/me/workspaces/{workspace_id}/notifications/activate', request_method='PUT')  # nopep8
        configurator.add_view(self.enable_account_workspace_notification, route_name='enable_account_workspace_notification')  # nopep8

        # disable workspace notification
        configurator.add_route('disable_account_workspace_notification', '/users/me/workspaces/{workspace_id}/notifications/deactivate', request_method='PUT')  # nopep8
        configurator.add_view(self.disable_account_workspace_notification, route_name='disable_account_workspace_notification')  # nopep8
