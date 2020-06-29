import typing

from hapic import HapicData
from pyramid.config import Configurator
from pyramid.response import Response

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import EmailAlreadyExistInDb
from tracim_backend.exceptions import ExternalAuthUserEmailModificationDisallowed
from tracim_backend.exceptions import ExternalAuthUserPasswordModificationDisallowed
from tracim_backend.exceptions import PasswordDoNotMatch
from tracim_backend.exceptions import TracimValidationFailed
from tracim_backend.exceptions import UserCantChangeIsOwnProfile
from tracim_backend.exceptions import UserCantDeleteHimself
from tracim_backend.exceptions import UserCantDisableHimself
from tracim_backend.exceptions import UsernameAlreadyExistInDb
from tracim_backend.exceptions import WrongUserPassword
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.event import EventApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.authorization import is_administrator
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import Profile
from tracim_backend.models.event import Message
from tracim_backend.models.event import ReadStatus
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ActiveContentFilterQuerySchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentIdsQuerySchema
from tracim_backend.views.core_api.schemas import GetLiveMessageQuerySchema
from tracim_backend.views.core_api.schemas import KnownMemberQuerySchema
from tracim_backend.views.core_api.schemas import LiveMessageSchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ReadStatusSchema
from tracim_backend.views.core_api.schemas import SetEmailSchema
from tracim_backend.views.core_api.schemas import SetPasswordSchema
from tracim_backend.views.core_api.schemas import SetUserAllowedSpaceSchema
from tracim_backend.views.core_api.schemas import SetUserInfoSchema
from tracim_backend.views.core_api.schemas import SetUsernameSchema
from tracim_backend.views.core_api.schemas import SetUserProfileSchema
from tracim_backend.views.core_api.schemas import TracimLiveEventHeaderSchema
from tracim_backend.views.core_api.schemas import UserCreationSchema
from tracim_backend.views.core_api.schemas import UserDigestSchema
from tracim_backend.views.core_api.schemas import UserDiskSpaceSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import UserSchema
from tracim_backend.views.core_api.schemas import UserWorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import UserWorkspaceFilterQuerySchema
from tracim_backend.views.core_api.schemas import UserWorkspaceIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceDigestSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__ENABLE_AND_DISABLE_SECTION
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__NOTIFICATION_SECTION
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__TRASH_AND_RESTORE_SECTION
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG_EVENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__USER_ENDPOINTS = "Users"
SWAGGER_TAG__USER_TRASH_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS, SWAGGER_TAG__TRASH_AND_RESTORE_SECTION
)

SWAGGER_TAG__USER_ENABLE_AND_DISABLE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS, SWAGGER_TAG__ENABLE_AND_DISABLE_SECTION
)
SWAGGER_TAG__USER_CONTENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS, SWAGGER_TAG__CONTENT_ENDPOINTS
)
SWAGGER_TAG__USER_NOTIFICATION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS, SWAGGER_TAG__NOTIFICATION_SECTION
)

SWAGGER_TAG__USER_EVENT_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_ENDPOINTS, SWAGGER_TAG_EVENT_ENDPOINTS
)


class UserController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(UserWorkspaceFilterQuerySchema())
    @hapic.output_body(WorkspaceDigestSchema(many=True))
    def user_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of user workspaces
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )

        workspaces = wapi.get_all_for_user(
            request.candidate_user,
            include_owned=hapic_data.query.show_owned_workspace,
            include_with_role=hapic_data.query.show_workspace_with_role,
        )
        return [wapi.get_workspace_with_context(workspace) for workspace in workspaces]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(UserSchema())
    def user(self, context, request: TracimRequest, hapic_data=None):
        """
        Get user infos.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        return uapi.get_user_with_context(request.candidate_user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(UserDiskSpaceSchema())
    def user_disk_space(self, context, request: TracimRequest, hapic_data=None):
        """
        Get user space infos.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        return uapi.get_user_with_context(request.candidate_user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.output_body(UserDigestSchema(many=True))
    def users(self, context, request: TracimRequest, hapic_data=None):
        """
        Get all users
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        users = uapi.get_all()
        context_users = [uapi.get_user_with_context(user) for user in users]
        return context_users

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(KnownMemberQuerySchema())
    @hapic.output_body(UserDigestSchema(many=True))
    def known_members(self, context, request: TracimRequest, hapic_data=None):
        """
        Get known users list
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
            filter_results=app_config.KNOWN_MEMBERS__FILTER,
        )
        context_users = [uapi.get_user_with_context(user) for user in users]
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
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        user = uapi.set_email(
            request.candidate_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.email,
            do_save=True,
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(UsernameAlreadyExistInDb, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(TracimValidationFailed, HTTPStatus.BAD_REQUEST)
    @check_right(has_personal_access)
    @hapic.input_body(SetUsernameSchema())
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(UserSchema())
    def set_user_username(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user username
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        user = uapi.set_username(
            request.candidate_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.username,
            do_save=True,
        )
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(WrongUserPassword, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(PasswordDoNotMatch, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ExternalAuthUserPasswordModificationDisallowed, HTTPStatus.BAD_REQUEST)
    @check_right(has_personal_access)
    @hapic.input_body(SetPasswordSchema())
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_user_password(self, context, request: TracimRequest, hapic_data=None):
        """
        Set user password
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        uapi.set_password(
            request.candidate_user,
            hapic_data.body.loggedin_user_password,
            hapic_data.body.new_password,
            hapic_data.body.new_password2,
            do_save=True,
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
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        user = uapi.update(
            request.candidate_user,
            auth_type=request.candidate_user.auth_type,
            name=hapic_data.body.public_name,
            timezone=hapic_data.body.timezone,
            lang=hapic_data.body.lang,
            do_save=True,
        )
        uapi.execute_updated_user_actions(user)
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(EmailAlreadyExistInDb, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(TracimValidationFailed, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
    @hapic.input_body(UserCreationSchema())
    @hapic.output_body(UserSchema())
    def create_user(self, context, request: TracimRequest, hapic_data=None):
        """
        Create new user. Note: One of username or email required.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        if hapic_data.body.profile:
            profile = Profile.get_profile_from_slug(hapic_data.body.profile)
        else:
            profile = None
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
            username=hapic_data.body.username,
            do_notify=hapic_data.body.email_notification,
            allowed_space=hapic_data.body.allowed_space,
            profile=profile,
            do_save=True,
        )
        uapi.execute_created_user_actions(user)
        return uapi.get_user_with_context(user)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENABLE_AND_DISABLE_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def enable_user(self, context, request: TracimRequest, hapic_data=None):
        """
        enable user
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        uapi.enable(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(UserCantDeleteHimself, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_user(self, context, request: TracimRequest, hapic_data=None):
        """
        delete user
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        uapi.delete(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_TRASH_AND_RESTORE_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def undelete_user(self, context, request: TracimRequest, hapic_data=None):
        """
        undelete user
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def disable_user(self, context, request: TracimRequest, hapic_data=None):
        """
        disable user
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        uapi.disable(user=request.candidate_user, do_save=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @hapic.handle_exception(UserCantChangeIsOwnProfile, HTTPStatus.BAD_REQUEST)
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(SetUserProfileSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_profile(self, context, request: TracimRequest, hapic_data=None):
        """
        set user profile
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        profile = Profile.get_profile_from_slug(hapic_data.body.profile)
        uapi.update(
            user=request.candidate_user,
            auth_type=request.candidate_user.auth_type,
            profile=profile,
            do_save=True,
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(SetUserAllowedSpaceSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_allowed_space(self, context, request: TracimRequest, hapic_data=None):
        """
        set user allowed_space
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        uapi.update(
            user=request.candidate_user,
            auth_type=request.candidate_user.auth_type,
            allowed_space=hapic_data.body.allowed_space,
            do_save=True,
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.input_query(ActiveContentFilterQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def last_active_content(self, context, request: TracimRequest, hapic_data=None):
        """
        Get last_active_content for user
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
                content_type=content_type_list.Any_SLUG,
            )
        last_actives = api.get_last_active(
            workspace=workspace, limit=content_filter.limit or None, before_content=before_content
        )
        return [api.get_content_in_context(content) for content in last_actives]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.input_query(ContentIdsQuerySchema())
    @hapic.output_body(ReadStatusSchema(many=True))
    def contents_read_status(self, context, request: TracimRequest, hapic_data=None):
        """
        get user_read status of contents
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
            content_ids=hapic_data.query.content_ids or None,
        )
        return [api.get_content_in_context(content) for content in last_actives]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_content_as_read(self, context, request: TracimRequest, hapic_data=None):
        """
        set user_read status of content to read
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_content_as_unread(self, context, request: TracimRequest, hapic_data=None):
        """
        set user_read status of content to unread
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_workspace_as_read(self, context, request: TracimRequest, hapic_data=None):
        """
        set user_read status of all content of workspace to read
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
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
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def enable_workspace_notification(self, context, request: TracimRequest, hapic_data=None):
        """
        enable workspace notification
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.enable_notifications(request.candidate_user, workspace)
        wapi.save(workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_NOTIFICATION_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def disable_workspace_notification(self, context, request: TracimRequest, hapic_data=None):
        """
        disable workspace notification
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.get_one(hapic_data.path.workspace_id)
        wapi.disable_notifications(request.candidate_user, workspace)
        wapi.save(workspace)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_EVENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(GetLiveMessageQuerySchema())
    @hapic.output_body(LiveMessageSchema(many=True))
    def get_user_messages(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> typing.List[Message]:
        """
        Returns user messages matching the given query
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        event_api = EventApi(request.current_user, request.dbsession, app_config)
        return event_api.get_messages_for_user(
            request.candidate_user.user_id, ReadStatus(hapic_data.query["read_status"])
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_EVENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_headers(TracimLiveEventHeaderSchema())
    def open_message_stream(self, context, request: TracimRequest, hapic_data=None) -> Response:
        """
        Open the message stream for the given user.
        Tracim Live Message Events as ServerSide Event Stream
        """
        stream_opened_event = ":Tracim Live Messages for user {}\n\nevent: stream-open\ndata:\n\n".format(
            str(request.candidate_user.user_id)
        )
        escaped_keealive_event = "event: keep-alive\\ndata:\\n\\n"
        user_channel_name = "user_{}".format(request.candidate_user.user_id)
        headers = [
            # Here we ask push pin to keep the connection open
            ("Grip-Hold", "stream"),
            # and register this connection on the given channel
            # multiple channels subscription is possible
            ("Grip-Channel", user_channel_name),
            ("Grip-Keep-Alive", "{}; format=cstring; timeout=30".format(escaped_keealive_event)),
            # content type for SSE
            ("Content-Type", "text/event-stream"),
            # do not cache the events
            ("Cache-Control", "no-cache"),
        ]
        return Response(
            headerlist=headers, charset="utf-8", status_code=200, body=stream_opened_event
        )

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # user workspace
        configurator.add_route(
            "user_workspace", "/users/{user_id:\d+}/workspaces", request_method="GET"  # noqa: W605
        )
        configurator.add_view(self.user_workspace, route_name="user_workspace")

        # user info
        configurator.add_route("user", "/users/{user_id:\d+}", request_method="GET")  # noqa: W605
        configurator.add_view(self.user, route_name="user")

        # user space info
        configurator.add_route(
            "user_disk_space", "/users/{user_id:\d+}/disk_space", request_method="GET"
        )  # noqa: W605
        configurator.add_view(self.user_disk_space, route_name="user_disk_space")

        # users lists
        configurator.add_route("users", "/users", request_method="GET")
        configurator.add_view(self.users, route_name="users")

        # known members lists
        configurator.add_route(
            "known_members",
            "/users/{user_id:\d+}/known_members",
            request_method="GET",  # noqa: W605
        )
        configurator.add_view(self.known_members, route_name="known_members")

        # set user email
        configurator.add_route(
            "set_user_email", "/users/{user_id:\d+}/email", request_method="PUT"
        )  # noqa: W605
        configurator.add_view(self.set_user_email, route_name="set_user_email")

        # set user username
        configurator.add_route(
            "set_user_username", "/users/{user_id:\d+}/username", request_method="PUT"
        )  # noqa: W605
        configurator.add_view(self.set_user_username, route_name="set_user_username")

        # set user password
        configurator.add_route(
            "set_user_password", "/users/{user_id:\d+}/password", request_method="PUT"  # noqa: W605
        )
        configurator.add_view(self.set_user_password, route_name="set_user_password")

        # set user_info
        configurator.add_route(
            "set_user_info", "/users/{user_id:\d+}", request_method="PUT"
        )  # noqa: W605
        configurator.add_view(self.set_user_infos, route_name="set_user_info")

        # create user
        configurator.add_route("create_user", "/users", request_method="POST")
        configurator.add_view(self.create_user, route_name="create_user")

        # enable user
        configurator.add_route(
            "enable_user", "/users/{user_id:\d+}/enabled", request_method="PUT"
        )  # noqa: W605
        configurator.add_view(self.enable_user, route_name="enable_user")

        # disable user
        configurator.add_route(
            "disable_user", "/users/{user_id:\d+}/disabled", request_method="PUT"  # noqa: W605
        )
        configurator.add_view(self.disable_user, route_name="disable_user")

        # delete user
        configurator.add_route(
            "delete_user", "/users/{user_id:\d+}/trashed", request_method="PUT"
        )  # noqa: W605
        configurator.add_view(self.delete_user, route_name="delete_user")

        # undelete user
        configurator.add_route(
            "undelete_user",
            "/users/{user_id:\d+}/trashed/restore",
            request_method="PUT",  # noqa: W605
        )
        configurator.add_view(self.undelete_user, route_name="undelete_user")

        # set user profile
        configurator.add_route(
            "set_user_profile", "/users/{user_id:\d+}/profile", request_method="PUT"  # noqa: W605
        )
        configurator.add_view(self.set_profile, route_name="set_user_profile")

        # set user allowed_space
        configurator.add_route(
            "set_user_allowed_space",
            "/users/{user_id:\d+}/allowed_space",
            request_method="PUT",  # noqa: W605
        )
        configurator.add_view(self.set_allowed_space, route_name="set_user_allowed_space")

        # user content
        configurator.add_route(
            "contents_read_status",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/contents/read_status",  # noqa: W605
            request_method="GET",
        )
        configurator.add_view(self.contents_read_status, route_name="contents_read_status")
        # last active content for user
        configurator.add_route(
            "last_active_content",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/contents/recently_active",  # noqa: W605
            request_method="GET",
        )
        configurator.add_view(self.last_active_content, route_name="last_active_content")

        # set content as read/unread
        configurator.add_route(
            "read_content",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/contents/{content_id}/read",  # noqa: W605
            request_method="PUT",
        )
        configurator.add_view(self.set_content_as_read, route_name="read_content")
        configurator.add_route(
            "unread_content",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/contents/{content_id}/unread",  # noqa: W605
            request_method="PUT",
        )
        configurator.add_view(self.set_content_as_unread, route_name="unread_content")

        # set workspace as read
        configurator.add_route(
            "read_workspace",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/read",  # noqa: W605
            request_method="PUT",
        )
        configurator.add_view(self.set_workspace_as_read, route_name="read_workspace")

        # enable workspace notification
        configurator.add_route(
            "enable_workspace_notification",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/notifications/activate",  # noqa: W605
            request_method="PUT",
        )
        configurator.add_view(
            self.enable_workspace_notification, route_name="enable_workspace_notification"
        )

        # enable workspace notification
        configurator.add_route(
            "disable_workspace_notification",
            "/users/{user_id:\d+}/workspaces/{workspace_id}/notifications/deactivate",  # noqa: W605
            request_method="PUT",
        )
        configurator.add_view(
            self.disable_workspace_notification, route_name="disable_workspace_notification"
        )
        # TracimLiveMessages notification
        configurator.add_route(
            "live_messages",
            "/users/{user_id:\d+}/live_messages",  # noqa: W605
            request_method="GET",
        )
        configurator.add_view(self.open_message_stream, route_name="live_messages")

        # Tracim user messages
        configurator.add_route(
            "messages", "/users/{user_id:\d+}/messages", request_method="GET",  # noqa: W605
        )
        configurator.add_view(self.get_user_messages, route_name="messages")
