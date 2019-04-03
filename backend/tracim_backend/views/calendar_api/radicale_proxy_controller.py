# coding: utf-8
from pyramid.config import Configurator
from pyramid.response import Response

from hapic import HapicData
from tracim_backend.extensions import hapic
from tracim_backend.lib.calendar.authorization import \
    can_access_to_calendar_list
from tracim_backend.lib.calendar.authorization import can_access_user_calendar
from tracim_backend.lib.calendar.authorization import \
    can_access_workspace_calendar
from tracim_backend.lib.calendar.determiner import \
    CaldavAuthorizationDeterminer
from tracim_backend.lib.proxy.proxy import Proxy
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import RadicaleUserSubItemPathSchema
from tracim_backend.views.core_api.schemas import \
    RadicaleWorkspaceSubItemPathSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema


class RadicaleProxyController(Controller):
    def __init__(
            self,
            proxy_base_address,
            radicale_base_path,
            radicale_user_path,
            radicale_workspace_path
    ):
        self._authorization = CaldavAuthorizationDeterminer()
        self.radicale_base_path_dir = radicale_base_path
        self.radicale_path_user_dir = radicale_user_path
        self.radicale_path_workspace_dir = radicale_workspace_path
        self._proxy = Proxy(
            base_address=proxy_base_address
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_calendar)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user(
        self, context, request: TracimRequest, hapic_data: HapicData,
    ) -> Response:
        """
        proxy user calendar
        example: /calendar/user/1/ to radicale path /calendar/user/1/
        """
        path = '{}{}/'.format(
            self.radicale_path_user_dir,
            request.candidate_user.user_id
        )
        return self._proxy.get_response_for_request(
            request,
            path
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_calendar)
    @hapic.input_path(RadicaleUserSubItemPathSchema())
    def radicale_proxy__user_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData,
    ) -> Response:
        """
        proxy user calendar
        example: /calendar/user/1/blabla.ics/ to radicale path /calendar/user/1/blabla.ics
        """
        path = '{}{}/{}'.format(
            self.radicale_path_user_dir,
            request.candidate_user.user_id,
            hapic_data.path.sub_item
        )
        return self._proxy.get_response_for_request(
            request,
            path
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_to_calendar_list)
    def radicale_proxy__users(
        self, context, request: TracimRequest,
    ) -> Response:
        """
        proxy users calendars list
        example: /calendar/user/ to radicale path /calendar/user/
        """
        path = self.radicale_path_user_dir
        return self._proxy.get_response_for_request(
            request,
            self.radicale_path_user_dir
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_workspace_calendar)
    @hapic.input_path(WorkspaceIdPathSchema())
    def radicale_proxy__workspace(
        self, context, request: TracimRequest, hapic_data: HapicData,
    ) -> Response:
        """
        proxy workspace calendar
        example: /calendar/workspace/1.ics/ to radicale path /calendar/workspace/1.ics/
        """
        path = '{}{}/'.format(
            self.radicale_path_workspace_dir,
            request.current_workspace.workspace_id
        )
        return self._proxy.get_response_for_request(
            request,
            path
        )


    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_workspace_calendar)
    @hapic.input_path(RadicaleWorkspaceSubItemPathSchema())
    def radicale_proxy__workspace_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData,
    ) -> Response:
        """
        proxy workspace calendar
        example: /calendar/workspace/1.ics/blabla.ics to radicale path /calendar/workspace/1.ics/blabla.ics
        """
        path = '{}{}/{}'.format(
            self.radicale_path_workspace_dir,
            request.current_workspace.workspace_id,
            hapic_data.path.sub_item
        )
        return self._proxy.get_response_for_request(
            request,
            path
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_to_calendar_list)
    def radicale_proxy__workspaces(
        self, context, request: TracimRequest,
    ) -> Response:
        """
         proxy users calendars list
         example: /calendar/user/ to radicale path /calendar/user/
         """
        path = self.radicale_path_workspace_dir
        return self._proxy.get_response_for_request(
            request,
            path
        )

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """
        # Radicale user calendar
        configurator.add_route(
            'radicale_proxy__users',
            self.radicale_path_user_dir,
        )
        configurator.add_view(
            self.radicale_proxy__users,
            route_name='radicale_proxy__users',
        )

        configurator.add_route(
            'radicale_proxy__user',
            self.radicale_path_user_dir + '{user_id:[0-9]+}{trailing_slash:[/]?}',
        )
        configurator.add_view(
            self.radicale_proxy__user,
            route_name='radicale_proxy__user',
        )

        configurator.add_route(
            'radicale_proxy__user_x',
            self.radicale_path_user_dir + '{user_id:[0-9]+}/{sub_item:[^\/]+\.ics}{trailing_slash:[/]?}',
        )
        configurator.add_view(
            self.radicale_proxy__user_subitems,
            route_name='radicale_proxy__user_x',
        )

        # Radicale workspace calendar
        configurator.add_route(
            'radicale_proxy__workspaces',
            self.radicale_path_workspace_dir,
        )
        configurator.add_view(
            self.radicale_proxy__workspaces,
            route_name='radicale_proxy__workspaces',
        )

        configurator.add_route(
            'radicale_proxy__workspace',
            self.radicale_path_workspace_dir + '{workspace_id:[0-9]+}{trailing_slash:[/]?}',
        )
        configurator.add_view(
            self.radicale_proxy__workspace,
            route_name='radicale_proxy__workspace',
        )

        configurator.add_route(
            'radicale_proxy__workspace_x',
            self.radicale_path_workspace_dir + '{workspace_id:[0-9]+}/{sub_item:[^\/]+\.ics}{trailing_slash:[/]?}',
        )
        configurator.add_view(
            self.radicale_proxy__workspace_subitems,
            route_name='radicale_proxy__workspace_x',
        )
