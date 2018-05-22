from pyramid.config import Configurator
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.core.userworkspace import RoleApi
from tracim.models.context_models import WorkspaceInContext, \
    UserRoleWorkspaceInContext

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
    WorkspaceIdPathSchema, WorkspaceMemberSchema


class WorkspaceController(Controller):

    @hapic.with_api_doc()
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    #@hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(WorkspaceNotFound, HTTPStatus.NOT_FOUND)
    @hapic.output_body(WorkspaceSchema())
    def workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get workspace information
        """
        wid = hapic_data.path['workspace_id']
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
        )
        # TODO - G.M - 22-05-2018 - Refactor this in a more lib way( avoid
        # try/catch and complex code here).
        try:
            workspace = wapi.get_one(wid)
        except NoResultFound:
            raise WorkspaceNotFound()
        return WorkspaceInContext(workspace, request.dbsession, app_config)

    @hapic.with_api_doc()
    @hapic.input_path(WorkspaceIdPathSchema())
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    #@hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(WorkspaceNotFound, HTTPStatus.NOT_FOUND)
    @hapic.output_body(WorkspaceMemberSchema(many=True))
    def workspaces_members(
            self,
            context,
            request: TracimRequest,
            hapic_data=None
    ) -> None:
        wid = hapic_data.path['workspace_id']
        app_config = request.registry.settings['CFG']
        rapi = RoleApi(
            current_user=request.current_user,
            session=request.dbsession,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,
            session=request.dbsession,
        )
        try:
            wapi.get_one(wid)
        except NoResultFound:
            raise WorkspaceNotFound()
        return [
            UserRoleWorkspaceInContext(
                user_role,
                request.dbsession,
                app_config
            )
            for user_role in rapi.get_all_for_workspace(wid)
        ]

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # Applications
        configurator.add_route('workspace', '/workspaces/{workspace_id}', request_method='GET')  # nopep8
        configurator.add_view(self.workspace, route_name='workspace')
        configurator.add_route('workspace_members', '/workspaces/{workspace_id}/members', request_method='GET')  # nopep8
        configurator.add_view(self.workspaces_members, route_name='workspace_members')