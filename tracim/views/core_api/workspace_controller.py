import typing

from pyramid.config import Configurator
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.core.content import ContentApi
from tracim.lib.core.userworkspace import RoleApi
from tracim.lib.utils.authorization import require_workspace_role
from tracim.models.context_models import WorkspaceInContext, \
    UserRoleWorkspaceInContext, ContentInContext
from tracim.models.data import UserRoleInWorkspace

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest
from tracim.exceptions import NotAuthentificated, InsufficientUserProfile, \
    WorkspaceNotFound
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import WorkspaceSchema, UserSchema, \
    WorkspaceIdPathSchema, WorkspaceMemberSchema, \
    WorkspaceAndContentIdPathSchema, FilterContentQuerySchema, \
    ContentDigestSchema


class WorkspaceController(Controller):

    @hapic.with_api_doc()
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    @hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(WorkspaceNotFound, HTTPStatus.FORBIDDEN)
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

    @hapic.with_api_doc()
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    @hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(WorkspaceNotFound, HTTPStatus.FORBIDDEN)
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
        return [
            rapi.get_user_role_workspace_with_context(user_role)
            for user_role in rapi.get_all_for_workspace(request.current_workspace)
        ]

    @hapic.with_api_doc()
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    @hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(WorkspaceNotFound, HTTPStatus.FORBIDDEN)
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

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
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