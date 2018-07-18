from pyramid.config import Configurator

from tracim.lib.core.content import ContentApi
from tracim.lib.utils.authorization import require_same_user_or_profile
from tracim.models import Group

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus

from tracim import hapic, TracimRequest

from tracim.lib.core.workspace import WorkspaceApi
from tracim.views.controllers import Controller
from tracim.views.core_api.schemas import UserIdPathSchema, ReadStatusSchema, \
    ContentIdsQuerySchema
from tracim.views.core_api.schemas import NoContentSchema
from tracim.views.core_api.schemas import UserWorkspaceIdPathSchema
from tracim.views.core_api.schemas import UserWorkspaceAndContentIdPathSchema
from tracim.views.core_api.schemas import ContentDigestSchema
from tracim.views.core_api.schemas import ActiveContentFilterQuerySchema
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
            current_user=request.candidate_user,  # User
            session=request.dbsession,
            config=app_config,
        )
        
        workspaces = wapi.get_all_for_user(request.candidate_user)
        return [
            wapi.get_workspace_with_context(workspace)
            for workspace in workspaces
        ]

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_query(ActiveContentFilterQuerySchema())
    @hapic.output_body(ContentDigestSchema(many=True))
    def last_active_content(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        Get last_active_content for user
        """
        raise NotImplemented()
        # app_config = request.registry.settings['CFG']
        # content_filter = hapic_data.query
        # api = ContentApi(
        #     current_user=request.candidate_user,  # User
        #     session=request.dbsession,
        #     config=app_config,
        #     show_archived=content_filter.show_archived,
        #     show_deleted=content_filter.show_deleted,
        #     show_active=content_filter.show_active,
        # )
        # wapi = WorkspaceApi(
        #     current_user=request.candidate_user,  # User
        #     session=request.dbsession,
        #     config=app_config,
        # )
        # workspace = None
        # if content_filter.workspace_id:
        #     workspace = wapi.get_one(content_filter.workspace_id)
        # last_actives = api.get_last_active(
        #     parent_id=content_filter.parent_id,
        #     content_type=content_filter.content_type or ContentType.Any,
        #     workspace=workspace,
        #     offset=content_filter.offset or None,
        #     limit=content_filter.limit or None,
        # )
        # return [
        #     api.get_content_in_context(content)
        #     for content in last_actives
        # ]

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserWorkspaceAndContentIdPathSchema())
    @hapic.input_query(ContentIdsQuerySchema())
    @hapic.output_body(ReadStatusSchema(many=True))  # nopep8
    def contents_read_status(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        get user_read status of contents
        """
        raise NotImplemented()
        # app_config = request.registry.settings['CFG']
        # api = ContentApi(
        #     current_user=request.candidate_user,
        #     session=request.dbsession,
        #     config=app_config,
        # )
        # return api.get_content_in_context(request.current_content)

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserWorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_content_as_read(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of content to read
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_read(request.current_content, do_flush=True)
        return

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserWorkspaceAndContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_content_as_unread(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of content to unread
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_unread(request.current_content, do_flush=True)
        return

    @hapic.with_api_doc(tags=[USER_ENDPOINTS_TAG])
    @require_same_user_or_profile(Group.TIM_ADMIN)
    @hapic.input_path(UserWorkspaceIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)  # nopep8
    def set_workspace_as_read(self, context, request: TracimRequest, hapic_data=None):  # nopep8
        """
        set user_read status of all content of workspace to read
        """
        app_config = request.registry.settings['CFG']
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=app_config,
        )
        api.mark_read__workspace(request.current_workspace)
        return

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # user worskpace
        configurator.add_route('user_workspace', '/users/{user_id}/workspaces', request_method='GET')  # nopep8
        configurator.add_view(self.user_workspace, route_name='user_workspace')

        # user content
        configurator.add_route('contents_read_status', '/users/{user_id}/workspaces/{workspace_id}/contents/read_status', request_method='GET')  # nopep8
        configurator.add_view(self.contents_read_status, route_name='contents_read_status')  # nopep8
        # last active content for user
        configurator.add_route('last_active_content', '/users/{user_id}/workspaces/{workspace_id}/contents/recently_active', request_method='GET')  # nopep8
        configurator.add_view(self.last_active_content, route_name='last_active_content')  # nopep8

        # set content as read/unread
        configurator.add_route('read_content', '/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/read', request_method='PUT')  # nopep8
        configurator.add_view(self.set_content_as_read, route_name='read_content')  # nopep8
        configurator.add_route('unread_content', '/users/{user_id}/workspaces/{workspace_id}/contents/{content_id}/unread', request_method='PUT')  # nopep8
        configurator.add_view(self.set_content_as_unread, route_name='unread_content')  # nopep8

        # set workspace as read
        configurator.add_route('read_workspace', '/users/{user_id}/workspaces/{workspace_id}/read', request_method='PUT')  # nopep8
        configurator.add_view(self.set_workspace_as_read, route_name='read_workspace')  # nopep8