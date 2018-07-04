from pyramid.config import Configurator
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.utils.authorization import require_same_user_or_profile
from tracim.models import Group
from tracim.models.context_models import WorkspaceInContext

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest

from tracim.exceptions import NotAuthenticated
from tracim.exceptions import InsufficientUserProfile
from tracim.exceptions import UserDoesNotExist
from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserIdPathSchema
from tracim.views.core_api.schemas import WorkspaceDigestSchema

USER_ENDPOINTS_TAG = 'Users'


class UserController(Controller):

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(WorkspaceDigestSchema(many=True),)
    def user_workspace(self, context, request: TracimRequest, hapic_data=None):
        """
        Get list of user workspaces
        """
        app_config = request.registry.settings['CFG']
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        
        workspaces = wapi.get_all_for_user(request.candidate_user)
        return [
            WorkspaceInContext(workspace, request.dbsession, app_config)
            for workspace in workspaces
        ]

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # Applications
        configurator.add_route('user_workspace', '/users/{user_id}/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.user_workspace, route_name='user_workspace')
