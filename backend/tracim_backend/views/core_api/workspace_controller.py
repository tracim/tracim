from http import HTTPStatus
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPFound
import transaction
import typing

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG  # noqa: F401
from tracim_backend.exceptions import ConflictingMoveInChild
from tracim_backend.exceptions import ConflictingMoveInItself
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import DisallowedWorkspaceAccessType
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import LastWorkspaceManagerRoleCantBeModified
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.exceptions import RoleAlreadyExistError
from tracim_backend.exceptions import UnallowedSubContent
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserIsDeleted
from tracim_backend.exceptions import UserIsNotActive
from tracim_backend.exceptions import UserNotAllowedToCreateMoreWorkspace
from tracim_backend.exceptions import UserRoleNotFound
from tracim_backend.exceptions import WorkspaceFeatureDisabled
from tracim_backend.exceptions import WorkspacesDoNotMatch
from tracim_backend.extensions import hapic
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.subscription import SubscriptionLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import UserWorkspaceConfigApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import can_create_content
from tracim_backend.lib.utils.authorization import can_delete_workspace
from tracim_backend.lib.utils.authorization import can_leave_workspace
from tracim_backend.lib.utils.authorization import can_modify_workspace
from tracim_backend.lib.utils.authorization import can_move_content
from tracim_backend.lib.utils.authorization import can_see_workspace_information
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.authorization import is_administrator
from tracim_backend.lib.utils.authorization import is_content_manager
from tracim_backend.lib.utils.authorization import is_contributor
from tracim_backend.lib.utils.authorization import is_reader
from tracim_backend.lib.utils.authorization import is_trusted_user
from tracim_backend.lib.utils.authorization import is_workspace_manager
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.models.auth import AuthType
from tracim_backend.models.auth import UserCreationType
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import ListItemsObject
from tracim_backend.models.context_models import PaginatedObject
from tracim_backend.models.context_models import UserWorkspaceConfigInContext
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import EmailNotificationType
from tracim_backend.models.data import WorkspaceSubscription
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import unprotected_content_revision
from tracim_backend.models.utils import get_sort_expression
from tracim_backend.views import BASE_API
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentCreationSchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentIdPathSchema
from tracim_backend.views.core_api.schemas import ContentMoveSchema
from tracim_backend.views.core_api.schemas import ContentPathInfoSchema
from tracim_backend.views.core_api.schemas import FilterContentQuerySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import PaginatedContentDigestSchema
from tracim_backend.views.core_api.schemas import RoleUpdateSchema
from tracim_backend.views.core_api.schemas import SetContentIsTemplateSchema
from tracim_backend.views.core_api.schemas import TemplateQuerySchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import UserWorkspaceConfigSchema
from tracim_backend.views.core_api.schemas import UserWorkspaceRoleSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndUserIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceDiskSpaceSchema
from tracim_backend.views.core_api.schemas import WorkspaceFilterQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberFilterQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberInviteSchema
from tracim_backend.views.core_api.schemas import WorkspaceModifySchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema
from tracim_backend.views.core_api.schemas import WorkspaceSubscriptionSchema
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__ALL_SECTION
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__ARCHIVE_AND_RESTORE_SECTION
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import SWAGGER_TAG__TRASH_AND_RESTORE_SECTION

SWAGGER_TAG__WORKSPACE_MEMBERS_SECTION = "Members"
SWAGGER_TAG__WORKSPACE_SUBSCRIPTION_SECTION = "Subscriptions"

SWAGGER_TAG__WORKSPACE_ENDPOINTS = "Workspaces"
SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS, SWAGGER_TAG__WORKSPACE_MEMBERS_SECTION
)
SWAGGER_TAG__WORKSPACE_SUBSCRIPTION_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS, SWAGGER_TAG__WORKSPACE_SUBSCRIPTION_SECTION
)
SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS, SWAGGER_TAG__TRASH_AND_RESTORE_SECTION
)
SWAGGER_TAG__CONTENT_ALL_TRASH_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS,
    SWAGGER_TAG__ALL_SECTION,
    SWAGGER_TAG__TRASH_AND_RESTORE_SECTION,
)
SWAGGER_TAG__CONTENT_ALL_ARCHIVE_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__CONTENT_ENDPOINTS,
    SWAGGER_TAG__ALL_SECTION,
    SWAGGER_TAG__ARCHIVE_AND_RESTORE_SECTION,
)


class WorkspaceController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @check_right(can_see_workspace_information)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceSchema())
    def workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get workspace informations
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,  # User
        )
        return wapi.get_workspace_with_context(request.current_workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @check_right(can_see_workspace_information)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceDiskSpaceSchema())
    def workspace_disk_space(self, context, request: TracimRequest, hapic_data=None):
        """
        Get workspace space info
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,  # User
        )
        return wapi.get_workspace_with_context(request.current_workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @check_right(is_administrator)
    @hapic.input_query(WorkspaceFilterQuerySchema())
    @hapic.output_body(WorkspaceSchema(many=True))
    def workspaces(self, context, request: TracimRequest, hapic_data=None):
        """
        Returns the list of all workspaces. This route is for admin only.
        Standard users must use their own route: /api/users/me/workspaces
        Filtering by parent_ids is possible through this endpoint
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,  # User
        )

        workspaces = wapi.get_all_children(parent_ids=hapic_data.query.parent_ids)
        return [wapi.get_workspace_with_context(workspace) for workspace in workspaces]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(DisallowedWorkspaceAccessType, HTTPStatus.BAD_REQUEST)
    @check_right(can_modify_workspace)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(WorkspaceModifySchema())
    @hapic.output_body(WorkspaceSchema())
    def update_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Update a workspace. This route is for trusted users and administrators.
        Note : a trusted user can only update spaces on which he/she is space manager
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,  # User
        )
        wapi.update_workspace(
            request.current_workspace,
            label=hapic_data.body.label,
            description=hapic_data.body.description,
            agenda_enabled=hapic_data.body.agenda_enabled,
            public_download_enabled=hapic_data.body.public_download_enabled,
            public_upload_enabled=hapic_data.body.public_upload_enabled,
            default_user_role=hapic_data.body.default_user_role,
            publication_enabled=hapic_data.body.publication_enabled,
            save_now=True,
        )
        return wapi.get_workspace_with_context(request.current_workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(DisallowedWorkspaceAccessType, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserNotAllowedToCreateMoreWorkspace, HTTPStatus.BAD_REQUEST)
    @check_right(is_trusted_user)
    @hapic.input_body(WorkspaceCreationSchema())
    @hapic.output_body(WorkspaceSchema())
    def create_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Create a workspace. This route is for trusted users and administrators.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,  # User
        )
        parent = None
        if hapic_data.body.parent_id:
            parent = wapi.get_one(workspace_id=hapic_data.body.parent_id)
        workspace = wapi.create_workspace(
            label=hapic_data.body.label,
            description=hapic_data.body.description,
            access_type=hapic_data.body.access_type,
            save_now=True,
            agenda_enabled=hapic_data.body.agenda_enabled,
            public_download_enabled=hapic_data.body.public_download_enabled,
            public_upload_enabled=hapic_data.body.public_upload_enabled,
            default_user_role=hapic_data.body.default_user_role,
            publication_enabled=hapic_data.body.publication_enabled,
            parent=parent,
        )
        return wapi.get_workspace_with_context(workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @check_right(can_delete_workspace)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Delete a workspace. This route is for trusted users and administrators.
        Note : a trusted user can only delete spaces on which he/she is space manager
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,  # User
        )
        wapi.delete(request.current_workspace, flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @check_right(can_delete_workspace)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def undelete_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Restore a deleted space.
        Note : a trusted user can only restore spaces on which he/she is space manager
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
            show_deleted=True,
        )
        wapi.undelete(request.current_workspace, flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS], deprecated=True)
    @check_right(can_see_workspace_information)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(WorkspaceMemberFilterQuerySchema())
    @hapic.output_body(UserWorkspaceConfigSchema(many=True))
    def workspaces_members(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[UserWorkspaceConfigInContext]:
        """
        DEPRECATED. Prefer using GET "/workspaces/{workspace_id}/role" instead
        Returns the list of space members with their role, avatar, etc.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        user_workspace_config_api = UserWorkspaceConfigApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_disabled_user=hapic_data.query.show_disabled_user,
        )

        configs = user_workspace_config_api.get_all_for_workspace(
            workspace=request.current_workspace
        )
        return [
            user_workspace_config_api.get_user_workspace_config_with_context(user_config)
            for user_config in configs
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @check_right(can_see_workspace_information)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(WorkspaceMemberFilterQuerySchema())
    @hapic.output_body(UserWorkspaceRoleSchema(many=True))
    def workspaces_role(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[UserWorkspaceConfigInContext]:
        """
        Returns the list of space user with their role, avatar, etc.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        user_workspace_config_api = UserWorkspaceConfigApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_disabled_user=hapic_data.query.show_disabled_user,
        )

        configs = user_workspace_config_api.get_all_for_workspace(
            workspace=request.current_workspace
        )
        return [
            user_workspace_config_api.get_user_workspace_config_with_context(user_config)
            for user_config in configs
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @check_right(can_see_workspace_information)
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.output_body(UserWorkspaceConfigSchema())
    def workspaces_member_role(
        self, context, request: TracimRequest, hapic_data=None
    ) -> UserWorkspaceConfigInContext:
        """
        Returns given space member with its role, avatar, etc.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        user_workspace_config_api = UserWorkspaceConfigApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )

        user_workspace_config = user_workspace_config_api.get_one(
            user_id=hapic_data.path.user_id, workspace_id=hapic_data.path.workspace_id
        )
        return user_workspace_config_api.get_user_workspace_config_with_context(
            user_workspace_config
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @hapic.handle_exception(UserRoleNotFound, HTTPStatus.BAD_REQUEST)
    @check_right(can_modify_workspace)
    @hapic.handle_exception(LastWorkspaceManagerRoleCantBeModified, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.input_body(RoleUpdateSchema())
    @hapic.output_body(UserWorkspaceConfigSchema())
    def update_workspaces_members_role(
        self, context, request: TracimRequest, hapic_data=None
    ) -> UserWorkspaceConfigInContext:
        """
        Update role of the given space member.
        This feature is for workspace managers, trusted users and administrators.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        user_workspace_config_api = UserWorkspaceConfigApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )

        role = user_workspace_config_api.get_one(
            user_id=hapic_data.path.user_id, workspace_id=hapic_data.path.workspace_id
        )
        role = user_workspace_config_api.update_role(role, role_level=hapic_data.body.role.level)
        return user_workspace_config_api.get_user_workspace_config_with_context(role)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @check_right(can_leave_workspace)
    @hapic.handle_exception(UserRoleNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(LastWorkspaceManagerRoleCantBeModified, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_workspaces_members_role(
        self, context, request: TracimRequest, hapic_data=None
    ) -> None:
        """
        Remove the user from the space.
        This feature is for workspace managers and administrators.
        """

        app_config = request.registry.settings["CFG"]  # type: CFG
        user_workspace_config_api = UserWorkspaceConfigApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        user_workspace_config_api.delete_one(
            user_id=hapic_data.path.user_id, workspace_id=hapic_data.path.workspace_id
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @hapic.handle_exception(EmailValidationFailed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserIsNotActive, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserIsDeleted, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(RoleAlreadyExistError, HTTPStatus.BAD_REQUEST)
    @check_right(can_modify_workspace)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(WorkspaceMemberInviteSchema())
    @hapic.output_body(WorkspaceMemberCreationSchema())
    def create_workspaces_members_role(
        self, context, request: TracimRequest, hapic_data=None
    ) -> UserWorkspaceConfigInContext:
        """
        Add a member to this workspace.
        This feature is for workspace managers and administrators.
        """
        newly_created = False
        app_config = request.registry.settings["CFG"]  # type: CFG
        user_workspace_config_api = UserWorkspaceConfigApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        uapi = UserApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_deactivated=True,
            show_deleted=True,
        )

        email = hapic_data.body.user_email.email_address if hapic_data.body.user_email else None
        public_name = (
            hapic_data.body.user_username
            or (hapic_data.body.user_email.username if hapic_data.body.user_email else None)
            or None
        )

        try:
            if hapic_data.body.user_id:
                user = uapi.get_one(hapic_data.body.user_id)
            elif email:
                user = uapi.get_one_by_email(email)
            else:
                user = uapi.get_one_by_username(hapic_data.body.user_username)
            if user.is_deleted:
                raise UserIsDeleted("This user has been deleted. Unable to invite him.")
            if not user.is_active:
                raise UserIsNotActive("This user is not activated. Unable to invite him")
        except UserDoesNotExist as exc:
            if not uapi.allowed_to_invite_new_user(email):
                raise exc

            if app_config.NEW_USER__INVITATION__DO_NOTIFY:
                user = uapi.create_user(
                    auth_type=AuthType.UNKNOWN,
                    email=email,
                    name=public_name,
                    password=password_generator(),
                    do_notify=True,
                    creation_type=UserCreationType.INVITATION,
                    creation_author=request.current_user,
                )
            else:
                user = uapi.create_user(
                    auth_type=AuthType.UNKNOWN,
                    email=email,
                    name=public_name,
                    password=None,
                    do_notify=False,
                    creation_type=UserCreationType.INVITATION,
                    creation_author=request.current_user,
                )
            newly_created = True

        user_workspace_config = user_workspace_config_api.create_one(
            user=user,
            workspace=request.current_workspace,
            role_level=WorkspaceRoles.get_role_from_slug(hapic_data.body.role).level,
            email_notification_type=EmailNotificationType(
                app_config.EMAIL__NOTIFICATION__TYPE_ON_INVITATION
            ),
            flush=True,
        )
        return user_workspace_config_api.get_user_workspace_config_with_context(
            user_workspace_config, newly_created=newly_created
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_SUBSCRIPTION_ENDPOINTS])
    @check_right(can_modify_workspace)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceSubscriptionSchema(many=True))
    def workspace_subscriptions(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[WorkspaceSubscription]:
        subscription_lib = SubscriptionLib(
            current_user=request.current_user,
            session=request.dbsession,
            config=request.app_config,
        )
        return subscription_lib.get_workspace_subscriptions(request.current_workspace.workspace_id)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_SUBSCRIPTION_ENDPOINTS])
    @check_right(can_modify_workspace)
    @hapic.handle_exception(RoleAlreadyExistError, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.input_body(RoleUpdateSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def accept_subscription(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[WorkspaceSubscription]:
        subscription_lib = SubscriptionLib(
            current_user=request.current_user,
            session=request.dbsession,
            config=request.app_config,
        )
        subscription = subscription_lib.get_one(
            author_id=hapic_data.path.user_id, workspace_id=hapic_data.path.workspace_id
        )
        subscription_lib.accept_subscription(
            subscription=subscription, user_role=hapic_data.body.role
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_SUBSCRIPTION_ENDPOINTS])
    @check_right(can_modify_workspace)
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def reject_subscription(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[WorkspaceSubscription]:
        subscription_lib = SubscriptionLib(
            current_user=request.current_user,
            session=request.dbsession,
            config=request.app_config,
        )
        subscription = subscription_lib.get_one(
            author_id=hapic_data.path.user_id, workspace_id=hapic_data.path.workspace_id
        )
        subscription_lib.reject_subscription(subscription=subscription)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(FilterContentQuerySchema())
    @hapic.output_body(PaginatedContentDigestSchema())
    def workspace_content(
        self, context, request: TracimRequest, hapic_data=None
    ) -> PaginatedObject:
        """
        return a list of contents of the space.
        This is NOT the full content list: by default, returned contents are the ones at root level.
        In order to get contents in a given folder, then use parent_id query filter.
        You can also show.hide archived/deleted contents.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        content_filter = hapic_data.query
        content_api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            namespaces_filter=content_filter.namespaces_filter or [ContentNamespaces.CONTENT],
            show_archived=content_filter.show_archived,
            show_deleted=content_filter.show_deleted,
            show_active=content_filter.show_active,
        )
        contents_page = content_api.get_all(
            parent_ids=content_filter.parent_ids,
            complete_path_to_id=content_filter.complete_path_to_id,
            workspaces=[request.current_workspace],
            content_type=content_filter.content_type or ContentTypeSlug.ANY.value,
            label=content_filter.label,
            order_by_properties=[
                get_sort_expression(content_filter.sort, Content, {"modified": "updated"}),
                Content.content_id,
            ],
            count=content_filter.count,
            page_token=content_filter.page_token,
        )
        contents = [content_api.get_content_in_context(content) for content in contents_page]
        return PaginatedObject(contents_page, contents)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UnallowedSubContent, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ParentNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WorkspaceFeatureDisabled, HTTPStatus.BAD_REQUEST)
    @check_right(can_create_content)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(ContentCreationSchema())
    @hapic.output_body(ContentDigestSchema())
    def create_generic_empty_content(
        self, context, request: TracimRequest, hapic_data=None
    ) -> ContentInContext:
        """
        Creates a generic empty content. The minimum viable content has a label and a content type.
        Creating a content generally starts with a request to this endpoint.
        For specific contents like files, it is recommended to use the dedicated endpoint.
        This feature is accessible to contributors and higher role only.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        creation_data = hapic_data.body
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        parent = None
        if creation_data.parent_id:
            try:
                parent = api.get_one(
                    content_id=creation_data.parent_id,
                    content_type=ContentTypeSlug.ANY.value,
                )
            except ContentNotFound as exc:
                raise ParentNotFound(
                    "Parent with content_id {} not found".format(creation_data.parent_id)
                ) from exc

        with request.dbsession.no_autoflush:
            content = api.create(
                content_type_slug=creation_data.content_type,
                do_save=True,
                label=creation_data.label,
                template_id=creation_data.template_id,
                workspace=request.current_workspace,
                parent=parent,
                content_namespace=creation_data.content_namespace,
            )

        if creation_data.template_id:
            api.copy_tags(
                destination=content,
                source_content_id=creation_data.template_id,
            )

            api.copy_todos(
                new_parent=content,
                template_id=creation_data.template_id,
            )

        content = api.get_content_in_context(content)
        return content

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @check_right(is_reader)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.FOUND)
    def get_content_from_workspace(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Convenient route allowing to get detail about a content without knowing routes associated to its content type.
        This route generates a HTTP 302 with the right url
        """
        content = request.current_content
        content_type = content_type_list.get_one_by_slug(content.type).slug
        # TODO - G.M - 2018-08-03 - Jsonify redirect response ?
        raise HTTPFound(
            "{base_url}workspaces/{workspace_id}/{content_type}s/{content_id}".format(
                base_url=BASE_API,
                workspace_id=content.workspace_id,
                content_type=content_type,
                content_id=content.content_id,
            )
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.input_path(ContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.FOUND)
    def get_content(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Convenient route allowing to get detail about a content without knowing routes associated to its content type.
        This route generates a HTTP 302 with the right url
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )

        content_property = api.get_content_property(
            property_list=["type", "workspace_id"],
            content_id=hapic_data.path["content_id"],
        )
        content_type = content_type_list.get_one_by_slug(content_property["type"]).slug
        workspace_id = content_property["workspace_id"]
        if (
            content_type == ContentTypeSlug.KANBAN.value
            or content_type == ContentTypeSlug.LOGBOOK.value
        ):
            content_type = ContentTypeSlug.FILE.value

        # TODO - G.M - 2018-08-03 - Jsonify redirect response ?
        raise HTTPFound(
            "{base_url}workspaces/{workspace_id}/{content_type}s/{content_id}".format(
                base_url=BASE_API,
                workspace_id=workspace_id,
                content_type=content_type,
                content_id=hapic_data.path["content_id"],
            )
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.input_path(ContentIdPathSchema())
    @hapic.output_body(ContentPathInfoSchema())
    def get_content_path(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Get Content Path : return all hierarchy of content from workspace root to content
        """
        content = request.current_content
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        return ListItemsObject(
            [api.get_content_in_context(path_content) for path_content in content.content_path]
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.FOUND)
    def get_workspace_content_path(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        DEPRECATED. Here for retro-compatibility. get_content_path formerly required providing the
        workspace id. This route 302-redirects to the right URL.
        """
        content = request.current_content
        raise HTTPFound(
            "{base_url}contents/{content_id}/path".format(
                base_url=BASE_API,
                content_id=content.content_id,
            )
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.handle_exception(WorkspacesDoNotMatch, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UnallowedSubContent, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ConflictingMoveInItself, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ConflictingMoveInChild, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WorkspaceFeatureDisabled, HTTPStatus.BAD_REQUEST)
    @check_right(can_move_content)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(ContentMoveSchema())
    @hapic.output_body(ContentDigestSchema())
    def move_content(self, context, request: TracimRequest, hapic_data=None) -> ContentInContext:
        """
        Move a content to specified new place.
        This requires to be content manager in both input and output spaces (which may be the same)
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        path_data = hapic_data.path
        move_data = hapic_data.body

        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)
        new_parent = api.get_one(move_data.new_parent_id, content_type=ContentTypeSlug.ANY.value)

        new_workspace = request.candidate_workspace

        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.move(
                content,
                new_parent=new_parent,
                new_workspace=new_workspace,
                new_content_namespace=ContentNamespaces.CONTENT,
                must_stay_in_same_workspace=False,
            )
        updated_content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)
        return api.get_content_in_context(updated_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_TRASH_AND_RESTORE_ENDPOINTS])
    @check_right(is_content_manager)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_content(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Move a content to the trash. After that, the content will be invisible by default.
        This action requires the user to be a content manager.
        Note: the content is still accessible but becomes read-only.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        path_data = hapic_data.path
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.delete(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_TRASH_AND_RESTORE_ENDPOINTS])
    @check_right(is_content_manager)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def undelete_content(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Restore a content from the trash. The content will be visible and editable again.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        path_data = hapic_data.path
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_deleted=True,
            show_archived=True,
        )
        content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.undelete(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_ARCHIVE_AND_RESTORE_ENDPOINTS])
    @check_right(is_content_manager)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def archive_content(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Archives a content. The content will be invisible but still available.
        Difference with delete is that optimizing workspace will not delete archived contents
        This action requires the user to be a content manager.
        Note: the content is still accessible but becomes read-only.
        the difference with delete is that optimizing workspace will not delete archived contents
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        path_data = hapic_data.path
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.archive(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_ARCHIVE_AND_RESTORE_ENDPOINTS])
    @check_right(is_content_manager)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def unarchive_content(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Restore a content from archive. The content will be visible and editable again.
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        path_data = hapic_data.path
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_archived=True,
            show_deleted=True,
        )
        content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.unarchive(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @check_right(is_contributor)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(SetContentIsTemplateSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def set_content_template(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Set content as template
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(hapic_data.path.content_id, content_type=ContentTypeSlug.ANY.value)
        with new_revision(session=request.dbsession, tm=transaction.manager, content=content):
            api.set_template(content, hapic_data.body.is_template)
            api.save(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(TemplateQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True), default_http_code=HTTPStatus.OK)
    def get_templates(
        self, context, request: TracimRequest, hapic_data=None
    ) -> typing.List[Content]:
        """
        Get all templates
        """
        app_config = request.registry.settings["CFG"]  # type: CFG
        api = ContentApi(
            show_archived=False,
            show_deleted=False,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        user = UserApi(current_user=None, session=request.dbsession, config=app_config).get_one(
            hapic_data.path["user_id"]
        )
        return api.get_templates(user=user, template_type=hapic_data.query["type"])

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @check_right(is_workspace_manager)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def delete_content_permanently(self, context, request: TracimRequest, hapic_data=None):
        """
        Delete a content permanently. This route is for administrators.
        """
        # INFO - F.S - 2024-02-29 - With sqlite if the content deleted is the last created, the next content created will have the same id
        app_config = request.registry.settings["CFG"]  # type: CFG
        session = request.dbsession
        path_data = hapic_data.path

        api = ContentApi(
            config=app_config, session=session, current_user=request.current_user, show_deleted=True
        )

        content = api.get_one(path_data.content_id, content_type=ContentTypeSlug.ANY.value)

        if session.bind.dialect.name == "sqlite":
            session.execute("PRAGMA foreign_keys=ON")

        cleanup_lib = CleanupLib(session, app_config)

        cleanup_lib.soft_delete_content(content)
        session.flush()
        session.expire_all()

        with unprotected_content_revision(session) as session:
            cleanup_lib_unprotected = CleanupLib(session, app_config)
            cleanup_lib_unprotected.delete_content(content)
            session.flush()

        if session.bind.dialect.name == "sqlite":
            session.execute("PRAGMA foreign_keys=OFF")

        return

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using
        pyramid configurator for this controller
        """

        # Workspaces
        configurator.add_route("workspaces", "/workspaces", request_method="GET")
        configurator.add_view(self.workspaces, route_name="workspaces")
        # Workspace
        configurator.add_route("workspace", "/workspaces/{workspace_id}", request_method="GET")
        configurator.add_view(self.workspace, route_name="workspace")
        # Workspace space
        configurator.add_route(
            "workspace_disk_space",
            "/workspaces/{workspace_id}/disk_space",
            request_method="GET",
        )
        configurator.add_view(self.workspace_disk_space, route_name="workspace_disk_space")
        # Create workspace
        configurator.add_route("create_workspace", "/workspaces", request_method="POST")
        configurator.add_view(self.create_workspace, route_name="create_workspace")
        # Delete/Undelete workpace
        configurator.add_route(
            "delete_workspace",
            "/workspaces/{workspace_id}/trashed",
            request_method="PUT",
        )
        configurator.add_view(self.delete_workspace, route_name="delete_workspace")
        configurator.add_route(
            "undelete_workspace",
            "/workspaces/{workspace_id}/trashed/restore",
            request_method="PUT",
        )
        configurator.add_view(self.undelete_workspace, route_name="undelete_workspace")
        # Update Workspace
        configurator.add_route(
            "update_workspace", "/workspaces/{workspace_id}", request_method="PUT"
        )
        configurator.add_view(self.update_workspace, route_name="update_workspace")
        # Workspace Members (Roles)
        configurator.add_route(
            "workspace_members",
            "/workspaces/{workspace_id}/members",
            request_method="GET",
        )
        configurator.add_view(self.workspaces_members, route_name="workspace_members")
        # Workspace Roles
        configurator.add_route(
            "workspaces_role",
            "/workspaces/{workspace_id}/role",
            request_method="GET",
        )
        configurator.add_view(self.workspaces_role, route_name="workspaces_role")
        # Workspace Members (Role) Individual
        configurator.add_route(
            "workspace_member_role",
            "/workspaces/{workspace_id}/members/{user_id}",
            request_method="GET",
        )
        configurator.add_view(self.workspaces_member_role, route_name="workspace_member_role")
        # Update Workspace Members roles
        configurator.add_route(
            "update_workspace_member",
            "/workspaces/{workspace_id}/members/{user_id}",
            request_method="PUT",
        )
        configurator.add_view(
            self.update_workspaces_members_role, route_name="update_workspace_member"
        )
        # Create Workspace Members roles
        configurator.add_route(
            "create_workspace_member",
            "/workspaces/{workspace_id}/members",
            request_method="POST",
        )
        configurator.add_view(
            self.create_workspaces_members_role, route_name="create_workspace_member"
        )
        # Delete Workspace Members roles
        configurator.add_route(
            "delete_workspace_member",
            "/workspaces/{workspace_id}/members/{user_id}",
            request_method="DELETE",
        )
        configurator.add_view(
            self.delete_workspaces_members_role, route_name="delete_workspace_member"
        )
        # Workspace Content
        configurator.add_route(
            "workspace_content",
            "/workspaces/{workspace_id}/contents",
            request_method="GET",
        )
        configurator.add_view(self.workspace_content, route_name="workspace_content")
        # Create Generic Content
        configurator.add_route(
            "create_generic_content",
            "/workspaces/{workspace_id}/contents",
            request_method="POST",
        )
        configurator.add_view(
            self.create_generic_empty_content, route_name="create_generic_content"
        )
        # Get Content
        configurator.add_route("get_content", "/contents/{content_id}", request_method="GET")
        configurator.add_view(self.get_content, route_name="get_content")
        # Get Content From workspace
        configurator.add_route(
            "get_content_from_workspace",
            "/workspaces/{workspace_id}/contents/{content_id}",
            request_method="GET",
        )
        configurator.add_view(
            self.get_content_from_workspace, route_name="get_content_from_workspace"
        )
        # Move Content
        configurator.add_route(
            "move_content",
            "/workspaces/{workspace_id}/contents/{content_id}/move",
            request_method="PUT",
        )
        configurator.add_view(self.move_content, route_name="move_content")
        # Delete/Undelete Content
        configurator.add_route(
            "delete_content",
            "/workspaces/{workspace_id}/contents/{content_id}/trashed",
            request_method="PUT",
        )
        configurator.add_view(self.delete_content, route_name="delete_content")
        configurator.add_route(
            "undelete_content",
            "/workspaces/{workspace_id}/contents/{content_id}/trashed/restore",
            request_method="PUT",
        )
        configurator.add_view(self.undelete_content, route_name="undelete_content")
        # Archive/Unarchive Content
        configurator.add_route(
            "archive_content",
            "/workspaces/{workspace_id}/contents/{content_id}/archived",
            request_method="PUT",
        )
        configurator.add_view(self.archive_content, route_name="archive_content")
        configurator.add_route(
            "unarchive_content",
            "/workspaces/{workspace_id}/contents/{content_id}/archived/restore",
            request_method="PUT",
        )
        configurator.add_view(self.unarchive_content, route_name="unarchive_content")

        # Mark/unmark Content as template
        configurator.add_route(
            "set_content_template",
            "/workspaces/{workspace_id}/contents/{content_id}/template",
            request_method="PUT",
        )
        configurator.add_view(self.set_content_template, route_name="set_content_template")

        # Get every template
        configurator.add_route(
            "get_templates", "/users/{user_id}/template_contents", request_method="GET"
        )
        configurator.add_view(self.get_templates, route_name="get_templates")

        # Subscriptions
        configurator.add_route(
            "workspace_subscriptions",
            "/workspaces/{workspace_id}/subscriptions",
            request_method="GET",
        )
        configurator.add_view(self.workspace_subscriptions, route_name="workspace_subscriptions")
        configurator.add_route(
            "accept_subscription",
            "/workspaces/{workspace_id}/subscriptions/{user_id}/accept",
            request_method="PUT",
        )
        configurator.add_view(self.accept_subscription, route_name="accept_subscription")

        configurator.add_route(
            "reject_subscription",
            "/workspaces/{workspace_id}/subscriptions/{user_id}/reject",
            request_method="PUT",
        )

        configurator.add_view(self.reject_subscription, route_name="reject_subscription")

        # Content path
        configurator.add_route(
            "get_content_path",
            "/contents/{content_id}/path",
            request_method="GET",
        )
        configurator.add_view(self.get_content_path, route_name="get_content_path")

        configurator.add_route(
            "get_workspace_content_path",
            "/workspaces/{workspace_id}/contents/{content_id}/path",
            request_method="GET",
        )
        configurator.add_view(
            self.get_workspace_content_path, route_name="get_workspace_content_path"
        )

        # Permanent delete
        configurator.add_route(
            "delete_content_permanently",
            "/workspaces/{workspace_id}/contents/{content_id}/permanently",
            request_method="DELETE",
        )
        configurator.add_view(
            self.delete_content_permanently, route_name="delete_content_permanently"
        )
