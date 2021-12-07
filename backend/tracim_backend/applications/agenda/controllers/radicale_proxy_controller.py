# coding: utf-8
from http import HTTPStatus

from hapic import HapicData
from pyramid.config import Configurator
from pyramid.response import Response
from requests.auth import HTTPBasicAuth

from tracim_backend.applications.agenda.authorization import can_access_user_agenda
from tracim_backend.applications.agenda.authorization import can_access_workspace_event_agenda
from tracim_backend.applications.agenda.authorization import can_access_workspace_root_agenda
from tracim_backend.applications.agenda.utils.determiner import CaldavAuthorizationDeterminer
from tracim_backend.config import CFG
from tracim_backend.exceptions import WorkspaceAgendaDisabledException
from tracim_backend.extensions import hapic
from tracim_backend.lib.proxy.proxy import Proxy
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import RadicaleUserResourceUserSubItemPathSchema
from tracim_backend.views.core_api.schemas import RadicaleUserResourceWorkspaceSubItemPathSchema
from tracim_backend.views.core_api.schemas import RadicaleUserSubItemPathSchema
from tracim_backend.views.core_api.schemas import RadicaleWorkspaceSubItemPathSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.schemas import WorkspaceIdPathSchema

# dumb auth parameter, just to avoid radicale issue with empty
# auth header
RADICALE_HTTP_AUTH_USERNAME = "tracim"
RADICALE_HTTP_AUTH_PASSWORD = "tracimpass"


class RadicaleProxyController(Controller):
    def __init__(
        self, proxy_base_address, app_config: CFG,
    ):
        self._authorization = CaldavAuthorizationDeterminer()
        # self.radicale_path_agenda_user_dir = radicale_agenda_user_path
        # self.radicale_path_agenda_workspace_dir = radicale_agenda_workspace_path
        # self.radicale_path_address_book_user_dir = radicale_address_book_user_path
        # self.radicale_path_address_book_workspace_dir = radicale_address_book_workspace_path
        self.app_config = app_config
        self.proxy_base_address = proxy_base_address
        self._proxy = Proxy(base_address=proxy_base_address, auth=HTTPBasicAuth("tracim", "tracim"))

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user_agenda(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /agenda/user/1/ to radicale path /agenda/user/1/
        """
        path = self.app_config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=self.app_config.RADICALE__CALENDAR_DIR,
            user_subdir=self.app_config.RADICALE__USER_SUBDIR,
        )
        path = "{}{}/".format(self.radicale_path_agenda_user_dir, request.candidate_user.user_id)
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user_address_book(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user address_book
        example: /addressbook/user/1/ to radicale path /address_book/user/1/
        """
        path = "{}{}/".format(
            self.radicale_path_address_book_user_dir, request.candidate_user.user_id
        )
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserSubItemPathSchema())
    def radicale_proxy__user_agenda_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /agenda/user/1/blabla.ics/ to radicale path /agenda/user/1/blabla.ics
        """
        path = "{}{}/{}".format(
            self.radicale_path_agenda_user_dir,
            request.candidate_user.user_id,
            hapic_data.path.sub_item,
        )
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserSubItemPathSchema())
    def radicale_proxy__user_address_book_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /addressbook/user/1/blabla.ics/ to radicale path /address_book/user/1/blabla.ics
        """
        path = "{}{}/{}".format(
            self.radicale_path_address_book_user_dir,
            request.candidate_user.user_id,
            hapic_data.path.sub_item,
        )
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user_resource(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /user_resource_1/ to radicale path /user_resource_1/
        """
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth("user_resource_{}".format(request.candidate_user.user_id), "tracim"),
        )
        path = "user_resource_{}/".format(request.candidate_user.user_id)
        return proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserResourceUserSubItemPathSchema())
    def radicale_proxy__user_resource_user_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /user_resource_1/user_1_agenda/ to radicale path /user_resource_1/user_1_agenda/
        """
        assert hapic_data.path.dest_user_id == hapic_data.path.user_id
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth("user_resource_{}".format(request.candidate_user.user_id), "tracim"),
        )
        path = "user_resource_{}/{}_{}_{}".format(
            request.candidate_user.user_id,
            "user",
            hapic_data.path.dest_user_id,
            hapic_data.path.type,
        )
        return proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserResourceUserSubItemPathSchema())
    def radicale_proxy__user_resource_user_subitems_x(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /user_resource_1/user_1_agenda/... to radicale path /user_resource_1/user_1_agenda/...
        """
        assert hapic_data.path.dest_user_id == hapic_data.path.user_id
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth("user_resource_{}".format(request.candidate_user.user_id), "tracim"),
        )
        path = "user_resource_{}/{}_{}_{}/{}".format(
            request.candidate_user.user_id,
            "user",
            hapic_data.path.dest_user_id,
            hapic_data.path.type,
            hapic_data.path.sub_item,
        )
        return proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleUserResourceWorkspaceSubItemPathSchema())
    def radicale_proxy__user_resource_workspace_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /user_resource_1/space_1_agenda/ to radicale path /user_resource_1/space_1_agenda/
        """
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth("user_resource_{}".format(request.candidate_user.user_id), "tracim"),
        )
        path = "user_resource_{}/{}_{}_{}".format(
            request.candidate_user.user_id,
            "space",
            hapic_data.path.workspace_id,
            hapic_data.path.type,
        )
        return proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleUserResourceWorkspaceSubItemPathSchema())
    def radicale_proxy__user_resource_workspace_subitems_x(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /user_resource_1/space_1_agenda/... to radicale path /user_resource_1/space_1_agenda/...
        """
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth("user_resource_{}".format(request.candidate_user.user_id), "tracim"),
        )
        path = "user_resource_{}/{}_{}_{}/{}".format(
            request.candidate_user.user_id,
            "space",
            hapic_data.path.workspace_id,
            hapic_data.path.type,
            hapic_data.path.sub_item,
        )
        return proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_root_agenda)
    @hapic.input_path(WorkspaceIdPathSchema())
    def radicale_proxy__workspace_agenda(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /agenda/workspace/1.ics/ to radicale path /agenda/workspace/1.ics/
        """
        path = "{}{}/".format(
            self.radicale_path_agenda_workspace_dir, request.current_workspace.workspace_id
        )
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleWorkspaceSubItemPathSchema())
    def radicale_proxy__workspace_agenda_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /agenda/workspace/1.ics/blabla.ics to radicale path /agenda/workspace/1.ics/blabla.ics
        """
        path = "{}{}/{}".format(
            self.radicale_path_agenda_workspace_dir,
            request.current_workspace.workspace_id,
            hapic_data.path.sub_item,
        )
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_root_agenda)
    @hapic.input_path(WorkspaceIdPathSchema())
    def radicale_proxy__workspace_address_book(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /agenda/workspace/1.ics/ to radicale path /agenda/workspace/1.ics/
        """
        path = "{}{}/".format(
            self.radicale_path_address_book_workspace_dir, request.current_workspace.workspace_id
        )
        return self._proxy.get_response_for_request(request, path)

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleWorkspaceSubItemPathSchema())
    def radicale_proxy__workspace_address_book_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /agenda/workspace/1.ics/blabla.ics to radicale path /agenda/workspace/1.ics/blabla.ics
        """
        path = "{}{}/{}".format(
            self.radicale_path_address_book_workspace_dir,
            request.current_workspace.workspace_id,
            hapic_data.path.sub_item,
        )
        return self._proxy.get_response_for_request(request, path)

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """
        # Radicale user resource agenda
        configurator.add_route(
            "radicale_proxy__user_resource", "/user_resource_{user_id:[0-9]+}{trailing_slash:[/]?}"
        )
        configurator.add_view(
            self.radicale_proxy__user_resource, route_name="radicale_proxy__user_resource"
        )
        configurator.add_route(
            "radicale_proxy__user_resource_user",
            "/user_resource_{user_id:[0-9]+}/user_{dest_user_id:[0-9]+}_{type}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_user_subitems,
            route_name="radicale_proxy__user_resource_user",
        )

        configurator.add_route(
            "radicale_proxy__user_resource_user_x",
            "/user_resource_{user_id:[0-9]+}/user_{dest_user_id:[0-9]+}_{type}/{sub_item:.*}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_user_subitems_x,
            route_name="radicale_proxy__user_resource_user_x",
        )

        configurator.add_route(
            "radicale_proxy__user_resource_workspace",
            "/user_resource_{user_id:[0-9]+}/space_{workspace_id:[0-9]+}_{type}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_workspace_subitems,
            route_name="radicale_proxy__user_resource_workspace",
        )

        configurator.add_route(
            "radicale_proxy__user_resource_workspace_x",
            "/user_resource_{user_id:[0-9]+}/space_{workspace_id:[0-9]+}_{type}/{sub_item:.*}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_workspace_subitems_x,
            route_name="radicale_proxy__user_resource_workspace_x",
        )

        # user agenda
        configurator.add_route(
            "radicale_proxy__user_agenda",
            self.radicale_path_agenda_user_dir + "{user_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__user_agenda, route_name="radicale_proxy__user_agenda"
        )

        configurator.add_route(
            "radicale_proxy__user_agenda_x",
            self.radicale_path_agenda_user_dir
            + "{user_id:[0-9]+}/{sub_item:[^\/]+\.ics}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_agenda_subitems, route_name="radicale_proxy__user_agenda_x"
        )

        # user address_book
        configurator.add_route(
            "radicale_proxy__user_address_book",
            self.radicale_path_address_book_user_dir + "{user_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__user_address_book, route_name="radicale_proxy__user_address_book"
        )

        configurator.add_route(
            "radicale_proxy__user_address_book_x",
            self.radicale_path_address_book_user_dir
            + "{user_id:[0-9]+}/{sub_item:[^\/]+\.ics}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_agenda_subitems,
            route_name="radicale_proxy__user_address_book_x",
        )

        # workspace agenda
        configurator.add_route(
            "radicale_proxy__agenda_workspace",
            self.radicale_path_agenda_workspace_dir + "{workspace_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_agenda, route_name="radicale_proxy__agenda_workspace"
        )

        configurator.add_route(
            "radicale_proxy__workspace_x",
            self.radicale_path_agenda_workspace_dir + "{workspace_id:[0-9]+}/{sub_item:.*}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_agenda_subitems, route_name="radicale_proxy__workspace_x"
        )

        # workspace address_book
        configurator.add_route(
            "radicale_proxy__address_book_workspace",
            self.radicale_path_address_book_workspace_dir
            + "{workspace_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_address_book,
            route_name="radicale_proxy__address_book_workspace",
        )

        configurator.add_route(
            "radicale_proxy__address_book_workspace_x",
            self.radicale_path_address_book_workspace_dir + "{workspace_id:[0-9]+}/{sub_item:.*}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_address_book_subitems,
            route_name="radicale_proxy__address_book_workspace_x",
        )
