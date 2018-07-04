import typing
import transaction
from pyramid.config import Configurator
try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic
from tracim import TracimRequest
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.core.content import ContentApi
from tracim.lib.core.userworkspace import RoleApi
from tracim.lib.utils.authorization import require_workspace_role, \
    require_candidate_workspace_role
from tracim.models.data import UserRoleInWorkspace
from tracim.models.data import ActionDescription
from tracim.models.context_models import UserRoleWorkspaceInContext
from tracim.models.context_models import ContentInContext
from tracim.exceptions import NotAuthenticated, InsufficientUserRoleInWorkspace
from tracim.exceptions import WorkspaceNotFoundInTracimRequest
from tracim.exceptions import WorkspacesDoNotMatch
from tracim.exceptions import WorkspaceNotFound
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import FilterContentQuerySchema
from tracim.views.core_api.schemas import ContentMoveSchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.views.core_api.schemas import ContentCreationSchema
from tracim.views.core_api.schemas import WorkspaceAndContentIdPathSchema
from tracim.views.core_api.schemas import ContentDigestSchema
from tracim.views.core_api.schemas import WorkspaceSchema
from tracim.views.core_api.schemas import WorkspaceIdPathSchema
from tracim.views.core_api.schemas import WorkspaceMemberSchema
from tracim.models.contents import ContentTypeLegacy as ContentType
from tracim.models.revision_protection import new_revision

WORKSPACE_ENDPOINTS_TAG = 'Workspaces'


class WorkspaceController(Controller):

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.READER)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.output_body(WorkspaceSchema())
    def workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get workspace informations
        """
        wid = hapic_data.path['workspace_id']
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        return wapi.get_workspace_with_context(request.current_workspace)

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
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

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
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
        )
        contents = [
            api.get_content_in_context(content) for content in contents
        ]
        return contents

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.CONTRIBUTOR)
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.input_body(ContentCreationSchema())
    @hapic.output_body(ContentDigestSchema())
    def create_generic_empty_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> typing.List[ContentInContext]:
        """
        create a generic empty content
        """
        app_config = request.registry.settings['CFG']
        creation_data = hapic_data.body
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.create(
            label=creation_data.label,
            content_type=creation_data.content_type,
            workspace=request.current_workspace,
        )
        api.save(content, ActionDescription.CREATION)
        content = api.get_content_in_context(content)
        return content

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
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
    ) -> typing.List[ContentInContext]:
        """
        move a content
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        move_data = hapic_data.body

        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            path_data.content_id,
            content_type=ContentType.Any
        )
        new_parent = api.get_one(
            move_data.new_parent_id, content_type=ContentType.Any
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
            content_type=ContentType.Any
        )
        return api.get_content_in_context(updated_content)

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def delete_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> typing.List[ContentInContext]:
        """
        delete a content
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(
            path_data.content_id,
            content_type=ContentType.Any
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.delete(content)
        return

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def undelete_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> typing.List[ContentInContext]:
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
        )
        content = api.get_one(
            path_data.content_id,
            content_type=ContentType.Any
        )
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.undelete(content)
        return

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def archive_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> typing.List[ContentInContext]:
        """
        archive a content
        """
        app_config = request.registry.settings['CFG']
        path_data = hapic_data.path
        api = ContentApi(
            current_user=request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        content = api.get_one(path_data.content_id, content_type=ContentType.Any)
        with new_revision(
                session=request.dbsession,
                tm=transaction.manager,
                content=content
        ):
            api.archive(content)
        return

    @hapic.with_api_doc(tags=[WORKSPACE_ENDPOINTS_TAG])
    @require_workspace_role(UserRoleInWorkspace.CONTENT_MANAGER)
    @hapic.input_path(WorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def unarchive_content(
            self,
            context,
            request: TracimRequest,
            hapic_data=None,
    ) -> typing.List[ContentInContext]:
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
        )
        content = api.get_one(
            path_data.content_id,
            content_type=ContentType.Any
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
        # Workspace Members (Roles)
        configurator.add_route('workspace_members', '/workspaces/{workspace_id}/members', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces_members, route_name='workspace_members')  # nopep8
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
