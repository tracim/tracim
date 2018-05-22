from pyramid.config import Configurator
from sqlalchemy.orm.exc import NoResultFound

from tracim.models.context_models import WorkspaceInContext

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest
from tracim.exceptions import NotAuthentificated, InsufficientUserProfile, \
    UserNotExist
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserIdPathSchema, \
    WorkspaceDigestSchema


class UserController(Controller):

    @hapic.with_api_doc()
    @hapic.input_path(UserIdPathSchema())
    @hapic.handle_exception(NotAuthentificated, HTTPStatus.UNAUTHORIZED)
    @hapic.handle_exception(InsufficientUserProfile, HTTPStatus.FORBIDDEN)
    @hapic.handle_exception(UserNotExist, HTTPStatus.NOT_FOUND)
    @hapic.output_body(WorkspaceDigestSchema(many=True),)
    def user_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of user workspaces
        """
        uid = hapic_data.path['user_id']
        app_config = request.registry.settings['CFG']
        uapi = UserApi(
            request.current_user,
            session=request.dbsession,
            config=app_config,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
        )
        # TODO - G.M - 22-05-2018 - Refactor this in a more lib way( avoid
        # try/catch and complex code here).
        try:
            user = uapi.get_one(uid)
        except NoResultFound:
            raise UserNotExist()
        if not uapi.can_see_private_info_of_user(user):
            raise InsufficientUserProfile()

        return [
            WorkspaceInContext(workspace, request.dbsession, app_config)
            for workspace in wapi.get_all_for_user(user)
        ]

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # Applications
        configurator.add_route('user_workspace', '/users/{user_id}/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.user_workspace, route_name='user_workspace')
