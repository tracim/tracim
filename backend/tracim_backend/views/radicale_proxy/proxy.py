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
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema


class RadicaleProxyController(Controller):
    def __init__(
            self,
            proxy_base_address,
            radicale_storage_dir,
            radicale_user_storage_dir,
            radicale_workspace_storage_dir
    ):
        self._authorization = CaldavAuthorizationDeterminer()
        self.radicale_base_path_dir = '/{}/'.format(radicale_storage_dir)
        self.radicale_path_user_dir = '/{}/{}/'.format(
            radicale_storage_dir,
            radicale_user_storage_dir
        )
        self.radicale_path_workspace_dir = '/{}/{}/'.format(
            radicale_storage_dir,
            radicale_workspace_storage_dir
        )
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
        example: /calendar/user/1.ics/ to radicale path /calendar/user/1.ics
        """
        path = '{}{}.ics'.format(
            self.radicale_path_user_dir,
            request.candidate_user.user_id
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
        example: /calendar/workspace/1.ics/ to radicale path /calendar/workspace/1.ics
        """
        path = '{}{}.ics'.format(
            self.radicale_path_workspace_dir,
            request.current_workspace.workspace_id
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
            self.radicale_path_user_dir + '{user_id:[0-9]+}.ics/',
        )
        configurator.add_view(
            self.radicale_proxy__user,
            route_name='radicale_proxy__user',
        )

        configurator.add_route(
            'radicale_proxy__user_x',
            self.radicale_path_user_dir + '{user_id:[0-9]+}.ics/{what_is_it_id:[a-zA-Z0-9]+}.ics/',
        )
        configurator.add_view(
            self.radicale_proxy__user,
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
            self.radicale_path_workspace_dir + '{workspace_id:[0-9]+}.ics/',
        )
        configurator.add_view(
            self.radicale_proxy__workspace,
            route_name='radicale_proxy__workspace',
        )

        configurator.add_route(
            'radicale_proxy__workspace_x',
            self.radicale_path_workspace_dir + '{workspace_id:[0-9]+}.ics/{what_is_it_id:[a-zA-Z0-9]+}.ics/',
        )
        configurator.add_view(
            self.radicale_proxy__workspace,
            route_name='radicale_proxy__workspace_x',
        )
