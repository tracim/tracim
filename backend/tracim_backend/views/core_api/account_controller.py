from pyramid.config import Configurator

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import EmailAlreadyExistInDb
from tracim_backend.exceptions import ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import WrongUserPassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ActiveContentFilterQuerySchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentIdsQuerySchema
from tracim_backend.views.core_api.schemas import KnownMemberQuerySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ReadStatusSchema
from tracim_backend.views.core_api.schemas import SetEmailSchema
from tracim_backend.views.core_api.schemas import SetPasswordSchema
from tracim_backend.views.core_api.schemas import SetUserInfoSchema
from tracim_backend.views.core_api.schemas import UserAllowedSpaceSchema
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import UserWorkspaceFilterQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__NOTIFICATION_SECTION

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

SWAGGER_TAG__ACCOUNT_ENDPOINTS = "Account"
SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__ACCOUNT_ENDPOINTS, SWAGGER_TAG__CONTENT_ENDPOINTS
)
SWAGGER_TAG__ACCOUNT_NOTIFICATION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__ACCOUNT_ENDPOINTS, SWAGGER_TAG__NOTIFICATION_SECTION
)


class AccountController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(UserSchema())
    def account(self, context, request: TracimRequest, hapic_data=None):
        """
        Get user infos.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        return uapi.get_user_with_context(request.current_user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @check_right(is_user)
    @hapic.output_body(UserAllowedSpaceSchema())
    def account_allowed_space(self, context, request: TracimRequest, hapic_data=None):
        """
        Get user space infos.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        return uapi.get_user_with_context(request.current_user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_body(SetUserInfoSchema())
    @hapic.output_body(UserSchema())
    def set_account_infos(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user info data
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        user = uapi.update(
            request.current_user,
            name=hapic_data.body.public_name,
            timezone=hapic_data.body.timezone,
            lang=hapic_data.body.lang,
            do_save=True,
        )
        uapi.execute_updated_user_actions(user)
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_query(KnownMemberQuerySchema())
    @hapic.output_body(UserDigestSchema(many=True))
    def account_known_members(self, context, request: TracimRequest, hapic_data=None):
        """
        Get known users list
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
            filter_results=app_config.KNOWN_MEMBERS__FILTER,
        )
        context_users = [uapi.get_user_with_context(user) for user in users]
        return context_users

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(EmailAlreadyExistInDb, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ExternalAuthUserEmailModificationDisallowed, HTTPStatus.BAD_REQUEST)
    @check_right(is_user)
    @hapic.input_body(SetEmailSchema())
    @hapic.output_body(UserSchema())
    def set_account_email(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user Email
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        user = uapi.set_email(
            request.current_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.email,
            do_save=True,
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(PasswordDoNotMatch, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ExternalAuthUserPasswordModificationDisallowed, HTTPStatus.BAD_REQUEST)
    @check_right(is_user)
    @hapic.input_body(SetPasswordSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_account_password(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user password
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        uapi.set_password(
            request.current_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.new_password,
            hapic_data.body.new_password2,
            do_save=True,
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_query(UserWorkspaceFilterQuerySchema())
    @hapic.output_body(WorkspaceDigestSchema(many=True))
    def account_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of auth user workspaces
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        workspaces = wapi.get_all_for_user(
            request.current_user,
            include_owned=hapic_data.query.show_owned_workspace,
            include_with_role=hapic_data.query.show_workspace_with_role,
        )
        return [wapi.get_workspace_with_context(workspace) for workspace in workspaces]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(ActiveContentFilterQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def account_last_active_content(self, context, request: TracimRequest, hapic_data=None):
        """
        Get last_active_content for user
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        wapi = WorkspaceApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        workspace = None
        if hapic_data.path.workspace_id:
            workspace = wapi.get_one(hapic_data.path.workspace_id)
        before_content = None
        if content_filter.before_content_id:
            before_content = api.get_one(
                content_id=content_filter.before_content_id,
                workspace=workspace,
                content_type=content_type_list.Any_SLUG,
            )
        last_actives = api.get_last_active(
            workspace=workspace, limit=content_filter.limit or None, before_content=before_content
        )
        return [api.get_content_in_context(content) for content in last_actives]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(ContentIdsQuerySchema())
    @hapic.output_body(ReadStatusSchema(many=True))
    def account_contents_read_status(self, context, request: TracimRequest, hapic_data=None):
        """
        get user_read status of contents
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        wapi = WorkspaceApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        workspace = None
        if hapic_data.path.workspace_id:
            workspace = wapi.get_one(hapic_data.path.workspace_id)
        last_actives = api.get_last_active(
            workspace=workspace,
            limit=None,
            before_content=None,
            content_ids=hapic_data.query.content_ids or None,
        )
        return [api.get_content_in_context(content) for content in last_actives]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_CONTENT_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_account_content_as_read(self, context, request: TracimRequest, hapic_data=None):
        """
        set user_read status of content to read
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @check_right(is_user)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_account_content_as_unread(self, context, request: TracimRequest, hapic_data=None):
        """
        set user_read status of content to unread
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @check_right(is_user)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_account_workspace_as_read(self, context, request: TracimRequest, hapic_data=None):
        """
        set user_read status of all content of workspace to read
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @check_right(is_user)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def enable_account_workspace_notification(
        self, context, request: TracimRequest, hapic_data=None
    ):
        """
        enable workspace notification
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.enable_notifications(request.current_user, workspace)
        rapi = RoleApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        rapi.get_one(request.current_user.user_id, workspace.workspace_id)
        wapi.save(workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__ACCOUNT_NOTIFICATION_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def disable_account_workspace_notification(
        self, context, request: TracimRequest, hapic_data=None
    ):
        """
        disable workspace notification
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
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
        configurator.add_route("account_workspace", "/users/me/workspaces", request_method="GET")
        configurator.add_view(self.account_workspace, route_name="account_workspace")

        # account info
        configurator.add_route("account", "/users/me", request_method="GET")
        configurator.add_view(self.account, route_name="account")

        # account space info
        configurator.add_route(
            "account_allowed_space", "/users/me/allowed_space", request_method="GET"
        )
        configurator.add_view(self.account_allowed_space, route_name="account_allowed_space")

        # known members lists
        configurator.add_route(
            "account_known_members", "/users/me/known_members", request_method="GET"
        )
        configurator.add_view(self.account_known_members, route_name="account_known_members")
        #
        # set account email
        configurator.add_route("set_account_email", "/users/me/email", request_method="PUT")
        configurator.add_view(self.set_account_email, route_name="set_account_email")

        # set account password
        configurator.add_route("set_account_password", "/users/me/password", request_method="PUT")
        configurator.add_view(self.set_account_password, route_name="set_account_password")

        # set account_infos
        configurator.add_route("set_account_info", "/users/me", request_method="PUT")
        configurator.add_view(self.set_account_infos, route_name="set_account_info")

        # account content
        configurator.add_route(
            "account_contents_read_status",
            "/users/me/workspaces/{workspace_id}/contents/read_status",
            request_method="GET",
        )
        configurator.add_view(
            self.account_contents_read_status, route_name="account_contents_read_status"
        )
        # last active content for user
        configurator.add_route(
            "account_last_active_content",
            "/users/me/workspaces/{workspace_id}/contents/recently_active",
            request_method="GET",
        )
        configurator.add_view(
            self.account_last_active_content, route_name="account_last_active_content"
        )

        # set content as read/unread
        configurator.add_route(
            "account_read_content",
            "/users/me/workspaces/{workspace_id}/contents/{content_id}/read",
            request_method="PUT",
        )
        configurator.add_view(self.set_account_content_as_read, route_name="account_read_content")

        configurator.add_route(
            "account_unread_content",
            "/users/me/workspaces/{workspace_id}/contents/{content_id}/unread",
            request_method="PUT",
        )
        configurator.add_view(
            self.set_account_content_as_unread, route_name="account_unread_content"
        )

        # set workspace as read
        configurator.add_route(
            "account_read_workspace",
            "/users/me/workspaces/{workspace_id}/read",
            request_method="PUT",
        )
        configurator.add_view(
            self.set_account_workspace_as_read, route_name="account_read_workspace"
        )

        # enable workspace notification
        configurator.add_route(
            "enable_account_workspace_notification",
            "/users/me/workspaces/{workspace_id}/notifications/activate",
            request_method="PUT",
        )
        configurator.add_view(
            self.enable_account_workspace_notification,
            route_name="enable_account_workspace_notification",
        )

        # disable workspace notification
        configurator.add_route(
            "disable_account_workspace_notification",
            "/users/me/workspaces/{workspace_id}/notifications/deactivate",
            request_method="PUT",
        )
        configurator.add_view(
            self.disable_account_workspace_notification,
            route_name="disable_account_workspace_notification",
        )
