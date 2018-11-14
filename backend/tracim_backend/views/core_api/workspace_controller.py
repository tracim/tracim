import typing

import transaction
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPFound

from tracim_backend import BASE_API_V2
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.exceptions import RoleAlreadyExistError
from tracim_backend.exceptions import UnallowedSubContent
from tracim_backend.exceptions import UserCantRemoveHisOwnRoleInWorkspace
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import UserIsDeleted
from tracim_backend.exceptions import UserIsNotActive
from tracim_backend.exceptions import UserRoleNotFound
from tracim_backend.exceptions import WorkspaceLabelAlreadyUsed
from tracim_backend.exceptions import WorkspacesDoNotMatch
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.authorization import \
    require_candidate_workspace_role
from tracim_backend.lib.utils.authorization import require_profile
from tracim_backend.lib.utils.authorization import \
    require_profile_and_workspace_role
from tracim_backend.lib.utils.authorization import require_workspace_role
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.models import Group
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import UserRoleWorkspaceInContext
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentCreationSchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import ContentIdPathSchema
from tracim_backend.views.core_api.schemas import ContentMoveSchema
from tracim_backend.views.core_api.schemas import FilterContentQuerySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import RoleUpdateSchema
from tracim_backend.views.core_api.schemas import \
    WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndUserIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberInviteSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberSchema
from tracim_backend.views.core_api.schemas import WorkspaceModifySchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__ALL_SECTION
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__ARCHIVE_AND_RESTORE_SECTION
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__CONTENT_ENDPOINTS
from tracim_backend.views.swagger_generic_section import \
    SWAGGER_TAG__TRASH_AND_RESTORE_SECTION

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

SWAGGER_TAG__WORKSPACE_MEMBERS_SECTION = 'Members'

SWAGGER_TAG__WORKSPACE_ENDPOINTS = 'Workspaces'
SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__WORKSPACE_ENDPOINTS,
    SWAGGER_TAG__WORKSPACE_MEMBERS_SECTION
)
SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(  # nopep8
    SWAGGER_TAG__WORKSPACE_ENDPOINTS,
    SWAGGER_TAG__TRASH_AND_RESTORE_SECTION
)
SWAGGER_TAG__CONTENT_ALL_TRASH_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(  # nopep8
    SWAGGER_TAG__CONTENT_ENDPOINTS,
    SWAGGER_TAG__ALL_SECTION,
    SWAGGER_TAG__TRASH_AND_RESTORE_SECTION
)
SWAGGER_TAG__CONTENT_ALL_ARCHIVE_AND_RESTORE_ENDPOINTS = generate_documentation_swagger_tag(  # nopep8
    SWAGGER_TAG__CONTENT_ENDPOINTS,
    SWAGGER_TAG__ALL_SECTION,
    SWAGGER_TAG__ARCHIVE_AND_RESTORE_SECTION
)


class WorkspaceController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.READER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceSchema())
    def workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get workspace informations
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        return wapi.get_workspace_with_context(request.current_workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @require_profile(Group.TIM_ADMIN)
    @hapic.output_body(WorkspaceSchema(many=True), )
    def workspaces(self, context, request: TracimRequest, hapic_data=None):
        """
        Returns the list of all workspaces. This route is for admin only.
        Standard users must use their own route: /api/v2/users/me/workspaces
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )

        workspaces = wapi.get_all()
        return [
            wapi.get_workspace_with_context(workspace)
            for workspace in workspaces
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.WORKSPACE_MANAGER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(WorkspaceModifySchema())
    @hapic.output_body(WorkspaceSchema())
    def update_workspace(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Update a workspace. This route is for trusted users and administrators.
        Note : a trusted user can only update spaces on which he/she is space manager
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi.update_workspace(
            request.current_workspace,
            label=hapic_data.body.label,
            description=hapic_data.body.description,
            save_now=True,
        )
        return wapi.get_workspace_with_context(request.current_workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(WorkspaceLabelAlreadyUsed, HTTPStatus.BAD_REQUEST)
    @require_profile(Group.TIM_MANAGER)
    @hapic.input_body(WorkspaceCreationSchema())
    @hapic.output_body(WorkspaceSchema())
    def create_workspace(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Create a workspace. This route is for trusted users and administrators.
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = wapi.create_workspace(
            label=hapic_data.body.label,
            description=hapic_data.body.description,
            save_now=True,
        )
        return wapi.get_workspace_with_context(workspace)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_MANAGER,
        minimal_required_role=UserRoleInWorkspace.WORKSPACE_MANAGER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def delete_workspace(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Delete a workspace. This route is for trusted users and administrators.
        Note : a trusted user can only delete spaces on which he/she is space manager
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        wapi.delete(request.current_workspace, flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_TRASH_AND_RESTORE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_MANAGER,
        minimal_required_role=UserRoleInWorkspace.WORKSPACE_MANAGER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def undelete_workspace(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Restore a deleted space.
        Note : a trusted user can only restore spaces on which he/she is space manager
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
            show_deleted=True,
        )
        wapi.undelete(request.current_workspace, flush=True)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.READER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceMemberSchema(many=True))
    def workspaces_members(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> typing.List[UserRoleWorkspaceInContext]:
        """
        Returns the list of space members with their role, avatar, etc.
        """
        app_config = request.registry.settings['CFG']
        rapi = RoleApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        
        roles = rapi.get_all_for_workspace(request.current_workspace)
        return [
            rapi.get_user_role_workspace_with_context(user_role)
            for user_role in roles
        ]

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.READER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.output_body(WorkspaceMemberSchema())
    def workspaces_member_role(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> UserRoleWorkspaceInContext:
        """
        Returns given space member with its role, avatar, etc.
        """
        app_config = request.registry.settings['CFG']
        rapi = RoleApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )

        role = rapi.get_one(
            user_id=hapic_data.path.user_id,
            workspace_id=hapic_data.path.workspace_id,
        )
        return rapi.get_user_role_workspace_with_context(role)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @hapic.handle_exception(UserRoleNotFound, HTTPStatus.BAD_REQUEST)
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.WORKSPACE_MANAGER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.input_body(RoleUpdateSchema())
    @hapic.output_body(WorkspaceMemberSchema())
    def update_workspaces_members_role(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> UserRoleWorkspaceInContext:
        """
        Update role of the given space member.
        This feature is for workspace managers, trusted users and administrators.
        """
        app_config = request.registry.settings['CFG']
        rapi = RoleApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )

        role = rapi.get_one(
            user_id=hapic_data.path.user_id,
            workspace_id=hapic_data.path.workspace_id,
        )
        workspace_role = WorkspaceRoles.get_role_from_slug(hapic_data.body.role)
        role = rapi.update_role(
            role,
            role_level=workspace_role.level
        )
        return rapi.get_user_role_workspace_with_context(role)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.WORKSPACE_MANAGER,
        allow_superadmin=True
    )
    @hapic.handle_exception(UserRoleNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserCantRemoveHisOwnRoleInWorkspace, HTTPStatus.BAD_REQUEST)  # nopep8
    @hapic.input_path(WorkspaceAndUserIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def delete_workspaces_members_role(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> None:
        """
        Remove the user from the space.
        This feature is for workspace managers and administrators.
        """

        app_config = request.registry.settings['CFG']
        rapi = RoleApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        rapi.delete_one(
            user_id=hapic_data.path.user_id,
            workspace_id=hapic_data.path.workspace_id,
        )
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__WORKSPACE_MEMBERS_ENDPOINTS])
    @hapic.handle_exception(EmailValidationFailed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserDoesNotExist, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserIsNotActive, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UserIsDeleted, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(RoleAlreadyExistError, HTTPStatus.BAD_REQUEST)
    @require_profile_and_workspace_role(
        minimal_profile=Group.TIM_USER,
        minimal_required_role=UserRoleInWorkspace.WORKSPACE_MANAGER,
        allow_superadmin=True
    )
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(WorkspaceMemberInviteSchema())
    @hapic.output_body(WorkspaceMemberCreationSchema())
    def create_workspaces_members_role(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> UserRoleWorkspaceInContext:
        """
        Add a member to this workspace.
        This feature is for workspace managers and administrators.
        """
        newly_created = False
        email_sent = False
        app_config = request.registry.settings['CFG']
        rapi = RoleApi(
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
        try:
            _, user = uapi.find(
                user_id=hapic_data.body.user_id,
                email=hapic_data.body.user_email,
                public_name=hapic_data.body.user_public_name
            )
            if user.is_deleted:
                raise UserIsDeleted('This user has been deleted. Unable to invite him.')  # nopep8
            if not user.is_active:
                raise UserIsNotActive('This user is not activated. Unable to invite him')  # nopep8
        except UserDoesNotExist as exc:
            if not uapi.allowed_to_invite_new_user(hapic_data.body.user_email):
                raise exc

            user = uapi.create_user(
                email=hapic_data.body.user_email,
                password=password_generator(),
                do_notify=True
            )
            newly_created = True
            if app_config.EMAIL_NOTIFICATION_ACTIVATED and \
                app_config.EMAIL_NOTIFICATION_PROCESSING_MODE.lower() == 'sync':
                email_sent = True

        role = rapi.create_one(
            user=user,
            workspace=request.current_workspace,
            role_level=WorkspaceRoles.get_role_from_slug(hapic_data.body.role).level,  # nopep8
            with_notif=False,
            flush=True,
        )
        return rapi.get_user_role_workspace_with_context(
            role,
            newly_created=newly_created,
            email_sent=email_sent,
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_query(FilterContentQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def workspace_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> typing.List[ContentInContext]:
        """
        return a list of contents of the space.
        This is NOT the full content list: by default, returned contents are the ones at root level.
        In order to get contents in a given folder, then use parent_id query filter.
        You can also show.hide archived/deleted contents.
        """
        app_config = request.registry.settings['CFG']
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_archived=content_filter.show_archived,
            show_deleted=content_filter.show_deleted,
            show_active=content_filter.show_active,
        )
        contents = api.get_all(
            parent_id=content_filter.parent_id,
            workspace=request.current_workspace,
            content_type=content_filter.content_type or content_type_list.Any_SLUG,
            label=content_filter.label,
            order_by_properties=[Content.label]
        )
        contents = [
            api.get_content_in_context(content) for content in contents
        ]
        return contents

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UnallowedSubContent, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ParentNotFound, HTTPStatus.BAD_REQUEST)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(ContentCreationSchema())
    @hapic.output_body(ContentDigestSchema())
    def create_generic_empty_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> ContentInContext:
        """
        Creates a generic empty content. The minimum viable content has a label and a content type.
        Creating a content generally starts with a request to this endpoint.
        For specific contents like files, it is recommended to use the dedicated endpoint.
        This feature is accessible to contributors and higher role only.
        """
        app_config = request.registry.settings['CFG']
        creation_data = hapic_data.body
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config
        )
        parent = None
        if creation_data.parent_id:
            try:
                parent = api.get_one(content_id=creation_data.parent_id, content_type=content_type_list.Any_SLUG)  # nopep8
            except ContentNotFound as exc:
                raise ParentNotFound(
                    'Parent with content_id {} not found'.format(creation_data.parent_id)
                ) from exc
        content = api.create(
            label=creation_data.label,
            content_type_slug=creation_data.content_type,
            workspace=request.current_workspace,
            parent=parent,
        )
        api.save(content, ActionDescription.CREATION)
        content = api.get_content_in_context(content)
        return content

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.FOUND)  # nopep8
    def get_content_from_workspace(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> None:
        """
        Convenient route allowing to get detail about a content without to known routes associated to its content type.
        This route generate a HTTP 302 with the right url
        """
        app_config = request.registry.settings['CFG']
        content = request.current_content
        content_type = content_type_list.get_one_by_slug(content.type).slug
        # TODO - G.M - 2018-08-03 - Jsonify redirect response ?
        raise HTTPFound(
            "{base_url}workspaces/{workspace_id}/{content_type}s/{content_id}".format(
                base_url=BASE_API_V2,
                workspace_id=content.workspace_id,
                content_type=content_type,
                content_id=content.content_id,
            )
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.input_path(ContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.FOUND)  # nopep8
    def get_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> None:
        """
        Convenient route allowing to get detail about a content without to known routes associated to its content type.
        This route generate a HTTP 302 with the right url
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            content_id=hapic_data.path['content_id'],
            content_type=content_type_list.Any_SLUG
        )
        content_type = content_type_list.get_one_by_slug(content.type).slug
        # TODO - G.M - 2018-08-03 - Jsonify redirect response ?
        raise HTTPFound(
            "{base_url}workspaces/{workspace_id}/{content_type}s/{content_id}".format(
                base_url=BASE_API_V2,
                workspace_id=content.workspace_id,
                content_type=content_type,
                content_id=content.content_id,
            )
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ENDPOINTS])
    @hapic.handle_exception(WorkspacesDoNotMatch, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(ContentFilenameAlreadyUsedInFolder, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @require_candidate_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.input_body(ContentMoveSchema())
    @hapic.output_body(ContentDigestSchema())
    def move_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> ContentInContext:
        """
        Move a content to specified new place.
        This requires to be content manager in both input and output spaces (which may be the same)
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        move_data = hapic_data.body

        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            path_data.content_id,
            content_type=content_type_list.Any_SLUG
        )
        new_parent = api.get_one(
            move_data.new_parent_id, content_type=content_type_list.Any_SLUG
        )

        new_workspace = request.candidate_workspace

        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.move(
                content,
                new_parent=new_parent,
                new_workspace=new_workspace,
                must_stay_in_same_workspace=False,
            )
        updated_content = api.get_one(
            path_data.content_id,
            content_type=content_type_list.Any_SLUG
        )
        return api.get_content_in_context(updated_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_TRASH_AND_RESTORE_ENDPOINTS])  # nopep8
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def delete_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> None:
        """
        Move a content to the trash. After that, the content will be invisible by default.
        This action requires the user to be a content manager.
        Note: the content is still accessible but becomes read-only.
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            path_data.content_id,
            content_type=content_type_list.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.delete(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_TRASH_AND_RESTORE_ENDPOINTS])  # nopep8
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def undelete_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> None:
        """
        Restore a content from the trash. The content will be visible and editable again.
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_deleted=True,
            show_archived=True,
        )
        content = api.get_one(
            path_data.content_id,
            content_type=content_type_list.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.undelete(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_ARCHIVE_AND_RESTORE_ENDPOINTS])  # nopep8
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def archive_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> None:
        """
        Archives a content. The content will be invisible but still available.
        Difference with delete is that optimizing workspace will not delete archived contents
        This action requires the user to be a content manager.
        Note: the content is still accessible but becomes read-only.
        the difference with delete is that optimizing workspace will not delete archived contents
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        api = ContentApi(
            show_archived=True,
            show_deleted=True,
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(path_data.content_id, content_type=content_type_list.Any_SLUG)  # nopep8
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.archive(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG__CONTENT_ALL_ARCHIVE_AND_RESTORE_ENDPOINTS])  # nopep8
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def unarchive_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> None:
        """
        Restore a content from archive. The content will be visible and editable again.
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
            show_archived=True,
            show_deleted=True,
        )
        content = api.get_one(
            path_data.content_id,
            content_type=content_type_list.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.unarchive(content)
        return

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using
        pyramid configurator for this controller
        """

        # Workspaces
        configurator.add_route('workspaces', '/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces, route_name='workspaces')
        # Workspace
        configurator.add_route('workspace', '/workspaces/{workspace_id}', request_method='GET')  # nopep8
        configurator.add_view(self.workspace, route_name='workspace')
        # Create workspace
        configurator.add_route('create_workspace', '/workspaces', request_method='POST')  # nopep8
        configurator.add_view(self.create_workspace, route_name='create_workspace')  # nopep8
        # Delete/Undelete workpace
        configurator.add_route('delete_workspace', '/workspaces/{workspace_id}/trashed', request_method='PUT')  # nopep8
        configurator.add_view(self.delete_workspace, route_name='delete_workspace')  # nopep8
        configurator.add_route('undelete_workspace', '/workspaces/{workspace_id}/trashed/restore', request_method='PUT')  # nopep8
        configurator.add_view(self.undelete_workspace, route_name='undelete_workspace')  # nopep8
        # Update Workspace
        configurator.add_route('update_workspace', '/workspaces/{workspace_id}', request_method='PUT')  # nopep8
        configurator.add_view(self.update_workspace, route_name='update_workspace')  # nopep8
        # Workspace Members (Roles)
        configurator.add_route('workspace_members', '/workspaces/{workspace_id}/members', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces_members, route_name='workspace_members')  # nopep8
        # Workspace Members (Role) Individual
        configurator.add_route('workspace_member_role', '/workspaces/{workspace_id}/members/{user_id}', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces_member_role, route_name='workspace_member_role')  # nopep8
        # Update Workspace Members roles
        configurator.add_route('update_workspace_member', '/workspaces/{workspace_id}/members/{user_id}', request_method='PUT')  # nopep8
        configurator.add_view(self.update_workspaces_members_role, route_name='update_workspace_member')  # nopep8
        # Create Workspace Members roles
        configurator.add_route('create_workspace_member', '/workspaces/{workspace_id}/members', request_method='POST')  # nopep8
        configurator.add_view(self.create_workspaces_members_role, route_name='create_workspace_member')  # nopep8
        # Delete Workspace Members roles
        configurator.add_route('delete_workspace_member', '/workspaces/{workspace_id}/members/{user_id}', request_method='DELETE')  # nopep8
        configurator.add_view(self.delete_workspaces_members_role, route_name='delete_workspace_member')  # nopep8
        # Workspace Content
        configurator.add_route('workspace_content', '/workspaces/{workspace_id}/contents', request_method='GET')  # nopep8
        configurator.add_view(self.workspace_content, route_name='workspace_content')  # nopep8
        # Create Generic Content
        configurator.add_route('create_generic_content', '/workspaces/{workspace_id}/contents', request_method='POST')  # nopep8
        configurator.add_view(self.create_generic_empty_content, route_name='create_generic_content')  # nopep8
        # Get Content
        configurator.add_route('get_content', '/contents/{content_id}', request_method='GET')  # nopep8
        configurator.add_view(self.get_content, route_name='get_content')
        # Get Content From workspace
        configurator.add_route('get_content_from_workspace', '/workspaces/{workspace_id}/contents/{content_id}', request_method='GET')  # nopep8
        configurator.add_view(self.get_content_from_workspace, route_name='get_content_from_workspace')  # nopep8
        # Move Content
        configurator.add_route('move_content', '/workspaces/{workspace_id}/contents/{content_id}/move', request_method='PUT')  # nopep8
        configurator.add_view(self.move_content, route_name='move_content')  # nopep8
        # Delete/Undelete Content
        configurator.add_route('delete_content', '/workspaces/{workspace_id}/contents/{content_id}/trashed', request_method='PUT')  # nopep8
        configurator.add_view(self.delete_content, route_name='delete_content')  # nopep8
        configurator.add_route('undelete_content', '/workspaces/{workspace_id}/contents/{content_id}/trashed/restore', request_method='PUT')  # nopep8
        configurator.add_view(self.undelete_content, route_name='undelete_content')  # nopep8
        # # Archive/Unarchive Content
        configurator.add_route('archive_content', '/workspaces/{workspace_id}/contents/{content_id}/archived', request_method='PUT')  # nopep8
        configurator.add_view(self.archive_content, route_name='archive_content')  # nopep8
        configurator.add_route('unarchive_content', '/workspaces/{workspace_id}/contents/{content_id}/archived/restore', request_method='PUT')  # nopep8
        configurator.add_view(self.unarchive_content, route_name='unarchive_content')  # nopep8
