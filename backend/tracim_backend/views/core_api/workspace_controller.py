import typing
import transaction
from pyramid.config import Configurator

from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.roles import WorkspaceRoles

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim_backend import hapic
from tracim_backend import TracimRequest
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.utils.authorization import require_workspace_role
from tracim_backend.lib.utils.authorization import require_profile
from tracim_backend.models import Group
from tracim_backend.lib.utils.authorization import require_candidate_workspace_role
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.context_models import UserRoleWorkspaceInContext
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import UnallowedSubContent
from tracim_backend.exceptions import EmailValidationFailed
from tracim_backend.exceptions import UserCreationFailed
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import WorkspacesDoNotMatch
from tracim_backend.exceptions import ParentNotFound
from tracim_backend.views.controllers import Controller
from tracim_backend.lib.utils.utils import password_generator
from tracim_backend.views.core_api.schemas import FilterContentQuerySchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberInviteSchema
from tracim_backend.views.core_api.schemas import RoleUpdateSchema
from tracim_backend.views.core_api.schemas import WorkspaceCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceModifySchema
from tracim_backend.views.core_api.schemas import WorkspaceAndUserIdPathSchema
from tracim_backend.views.core_api.schemas import ContentMoveSchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import ContentCreationSchema
from tracim_backend.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim_backend.views.core_api.schemas import ContentDigestSchema
from tracim_backend.views.core_api.schemas import WorkspaceSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceMemberSchema
from tracim_backend.models.contents import CONTENT_TYPES
from tracim_backend.models.revision_protection import new_revision

SWAGGER_TAG_WORKSPACE_ENDPOINTS = 'Workspaces'


class WorkspaceController(Controller):

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.READER)
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.WORKSPACE_MANAGER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(WorkspaceModifySchema())
    @hapic.output_body(WorkspaceSchema())
    def update_workspace(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Update workspace informations
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @require_profile(Group.TIM_MANAGER)
    @hapic.input_body(WorkspaceCreationSchema())
    @hapic.output_body(WorkspaceSchema())
    def create_workspace(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        create workspace
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceMemberSchema(many=True))
    def workspaces_members(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> typing.List[UserRoleWorkspaceInContext]:
        """
        Get Members of this workspace
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.WORKSPACE_MANAGER)
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
        Update Members to this workspace
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(UserCreationFailed, HTTPStatus.BAD_REQUEST)
    @require_workspace_role(UserRoleInWorkspace.WORKSPACE_MANAGER)
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
        Add Members to this workspace
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
        )
        try:
            _, user = uapi.find(
                user_id=hapic_data.body.user_id,
                email=hapic_data.body.user_email_or_public_name,
                public_name=hapic_data.body.user_email_or_public_name
            )
        except UserDoesNotExist:
            try:
                # TODO - G.M - 2018-07-05 - [UserCreation] Reenable email
                # notification for creation
                user = uapi.create_user(
                    email=hapic_data.body.user_email_or_public_name,
                    password= password_generator(),
                    do_notify=True
                )  # nopep8
                newly_created = True
                if app_config.EMAIL_NOTIFICATION_ACTIVATED and \
                        app_config.EMAIL_NOTIFICATION_PROCESSING_MODE.lower() == 'sync':
                    email_sent = True

            except EmailValidationFailed:
                raise UserCreationFailed('no valid mail given')

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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
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
        return list of contents found in the workspace
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
            content_type=content_filter.content_type or CONTENT_TYPES.Any_SLUG,
        )
        contents = [
            api.get_content_in_context(content) for content in contents
        ]
        return contents

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @hapic.handle_exception(EmptyLabelNotAllowed, HTTPStatus.BAD_REQUEST)
    @hapic.handle_exception(UnallowedSubContent, HTTPStatus.BAD_REQUEST)
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
        create a generic empty content
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
                parent = api.get_one(content_id=creation_data.parent_id, content_type=CONTENT_TYPES.Any_SLUG)  # nopep8
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

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
    @hapic.handle_exception(WorkspacesDoNotMatch, HTTPStatus.BAD_REQUEST)
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
        move a content
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
            content_type=CONTENT_TYPES.Any_SLUG
        )
        new_parent = api.get_one(
            move_data.new_parent_id, content_type=CONTENT_TYPES.Any_SLUG
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
            content_type=CONTENT_TYPES.Any_SLUG
        )
        return api.get_content_in_context(updated_content)

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
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
        delete a content
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
            content_type=CONTENT_TYPES.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.delete(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
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
        undelete a content
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
            content_type=CONTENT_TYPES.Any_SLUG
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.undelete(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
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
        archive a content
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
        content = api.get_one(path_data.content_id, content_type=CONTENT_TYPES.Any_SLUG)  # nopep8
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.archive(content)
        return

    @hapic.with_api_doc(tags=[SWAGGER_TAG_WORKSPACE_ENDPOINTS])
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
        unarchive a content
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
            content_type=CONTENT_TYPES.Any_SLUG
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

        # Workspace
        configurator.add_route('workspace', '/workspaces/{workspace_id}', request_method='GET')  # nopep8
        configurator.add_view(self.workspace, route_name='workspace')
        # Create workspace
        configurator.add_route('create_workspace', '/workspaces', request_method='POST')  # nopep8
        configurator.add_view(self.create_workspace, route_name='create_workspace')  # nopep8
        # Update Workspace
        configurator.add_route('update_workspace', '/workspaces/{workspace_id}', request_method='PUT')  # nopep8
        configurator.add_view(self.update_workspace, route_name='update_workspace')  # nopep8
        # Workspace Members (Roles)
        configurator.add_route('workspace_members', '/workspaces/{workspace_id}/members', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces_members, route_name='workspace_members')  # nopep8
        # Update Workspace Members roles
        configurator.add_route('update_workspace_member', '/workspaces/{workspace_id}/members/{user_id}', request_method='PUT')  # nopep8
        configurator.add_view(self.update_workspaces_members_role, route_name='update_workspace_member')  # nopep8
        # Create Workspace Members roles
        configurator.add_route('create_workspace_member', '/workspaces/{workspace_id}/members', request_method='POST')  # nopep8
        configurator.add_view(self.create_workspaces_members_role, route_name='create_workspace_member')  # nopep8
        # Workspace Content
        configurator.add_route('workspace_content', '/workspaces/{workspace_id}/contents', request_method='GET')  # nopep8
        configurator.add_view(self.workspace_content, route_name='workspace_content')  # nopep8
        # Create Generic Content
        configurator.add_route('create_generic_content', '/workspaces/{workspace_id}/contents', request_method='POST')  # nopep8
        configurator.add_view(self.create_generic_empty_content, route_name='create_generic_content')  # nopep8
        # Move Content
        configurator.add_route('move_content', '/workspaces/{workspace_id}/contents/{content_id}/move', request_method='PUT')  # nopep8
        configurator.add_view(self.move_content, route_name='move_content')  # nopep8
        # Delete/Undelete Content
        configurator.add_route('delete_content', '/workspaces/{workspace_id}/contents/{content_id}/delete', request_method='PUT')  # nopep8
        configurator.add_view(self.delete_content, route_name='delete_content')  # nopep8
        configurator.add_route('undelete_content', '/workspaces/{workspace_id}/contents/{content_id}/undelete', request_method='PUT')  # nopep8
        configurator.add_view(self.undelete_content, route_name='undelete_content')  # nopep8
        # # Archive/Unarchive Content
        configurator.add_route('archive_content', '/workspaces/{workspace_id}/contents/{content_id}/archive', request_method='PUT')  # nopep8
        configurator.add_view(self.archive_content, route_name='archive_content')  # nopep8
        configurator.add_route('unarchive_content', '/workspaces/{workspace_id}/contents/{content_id}/unarchive', request_method='PUT')  # nopep8
        configurator.add_view(self.unarchive_content, route_name='unarchive_content')  # nopep8
