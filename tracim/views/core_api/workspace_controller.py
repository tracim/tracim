import typing

from pyramid.config import Configurator
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.core.userworkspace import RoleApi
from tracim.lib.utils.authorization import require_workspace_role
from tracim.models.context_models import WorkspaceInContext
from tracim.models.context_models import UserRoleWorkspaceInContext
from tracim.models.data import UserRoleInWorkspace

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest
from tracim.exceptions import NotAuthenticated
from tracim.exceptions import InsufficientUserProfile
from tracim.exceptions import WorkspaceNotFound
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import WorkspaceSchema
from tracim.views.core_api.schemas import UserSchema
from tracim.views.core_api.schemas import WorkspaceIdPathSchema
from tracim.views.core_api.schemas import WorkspaceMemberSchema

class WorkspaceController(Controller):

    @hapic.with_api_doc()
    @hapic.handle_exception(NotAuthenticated, HTTPStatus.UNAUTHORIZED)
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
    @hapic.handle_exception(NotAuthenticated, HTTPStatus.UNAUTHORIZED)
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
        
        roles = rapi.get_all_for_workspace(request.current_workspace)
        return [
            rapi.get_user_role_workspace_with_context(user_role)
            for user_role in roles
        ]

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using
        pyramid configurator for this controller
        """

        # Applications
        configurator.add_route('workspace', '/workspaces/{workspace_id}', request_method='GET')  # nopep8
        configurator.add_view(self.workspace, route_name='workspace')
        configurator.add_route('workspace_members', '/workspaces/{workspace_id}/members', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces_members, route_name='workspace_members')  # nopep8
