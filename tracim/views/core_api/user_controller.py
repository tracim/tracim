from pyramid.config import Configurator

from tracim.lib.core.content import ContentApi
from tracim.lib.utils.authorization import require_same_user_or_profile
from tracim.models import Group
from tracim.models.context_models import WorkspaceInContext

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest

from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserIdPathSchema
from tracim.views.core_api.schemas import ContentDigestSchema
from tracim.views.core_api.schemas import ExtendedFilterQuerySchema
from tracim.views.core_api.schemas import WorkspaceDigestSchema
from tracim.models.contents import ContentTypeLegacy as ContentType

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

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(ExtendedFilterQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def last_active_content(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Get last_active_content for user
        """
        app_config = request.registry.settings['CFG']
        content_filter = hapic_data.query
        api = ContentApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
            show_archived=content_filter.show_archived,
            show_deleted=content_filter.show_deleted,
            show_active=content_filter.show_active,
        )
        wapi = WorkspaceApi(
            current_user=request.current_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        workspace = None
        if content_filter.workspace_id:
            workspace = wapi.get_one(content_filter.workspace_id)
        last_actives = api.get_last_active(
            parent_id=content_filter.parent_id,
            content_type=content_filter.content_type or ContentType.Any,
            workspace=workspace,
            offset=content_filter.offset or None,
            limit=content_filter.limit or None,
        )
        return [
            api.get_content_in_context(content) for content in last_actives
        ]

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # user worskpace
        configurator.add_route('user_workspace', '/users/{user_id}/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.user_workspace, route_name='user_workspace')

        # last active content for user
        configurator.add_route('last_active_content', '/users/{user_id}/contents/actives', request_method='GET')  # nopep8
        configurator.add_view(self.last_active_content, route_name='last_active_content')  # nopep8
