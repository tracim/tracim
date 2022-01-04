# coding: utf-8
from http import HTTPStatus

from hapic import HapicData
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPMovedPermanently
from pyramid.response import Response
from requests.auth import HTTPBasicAuth

from tracim_backend.applications.agenda.authorization import can_access_user_agenda
from tracim_backend.applications.agenda.authorization import can_access_workspace_event_agenda
from tracim_backend.applications.agenda.authorization import can_access_workspace_root_agenda
from tracim_backend.applications.agenda.utils.determiner import CaldavAuthorizationDeterminer
from tracim_backend.exceptions import WorkspaceAgendaDisabledException
from tracim_backend.extensions import hapic
from tracim_backend.lib.proxy.proxy import Proxy
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
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
RADICALE_PROXY_EXTRA_HEADERS = {"X-Script-Name": "/dav"}


class RadicaleProxyController(Controller):
    def __init__(
        self, proxy_base_address,
    ):
        self._authorization = CaldavAuthorizationDeterminer()
        self.proxy_base_address = proxy_base_address
        self._proxy = Proxy(
            base_address=proxy_base_address,
            auth=HTTPBasicAuth(RADICALE_HTTP_AUTH_USERNAME, RADICALE_HTTP_AUTH_PASSWORD),
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user_agenda(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/agenda/user/1/ to radicale path /agenda/user/1/
        """
        path = request.app_config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__CALENDAR_DIR,
            user_subdir=request.app_config.RADICALE__USER_SUBDIR,
            user_id=request.candidate_user.user_id,
        )
        return self._proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user_address_book(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user address_book
        example: /dav/addressbook/user/1/ to radicale path /addressbook/user/1/
        """
        path = request.app_config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__ADDRESSBOOK_DIR,
            user_subdir=request.app_config.RADICALE__USER_SUBDIR,
            user_id=request.candidate_user.user_id,
        )
        return self._proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserSubItemPathSchema())
    def radicale_proxy__user_agenda_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav//agenda/user/1/event.ics to radicale path /agenda/user/1/event.ics
        """
        user_calendar_path = request.app_config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__CALENDAR_DIR,
            user_subdir=request.app_config.RADICALE__USER_SUBDIR,
            user_id=request.candidate_user.user_id,
        )
        path = "{user_calendar_path}/{sub_item}/".format(
            user_calendar_path=user_calendar_path, sub_item=hapic_data.path.sub_item,
        )
        return self._proxy.get_response_for_request(
            request, path, extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserSubItemPathSchema())
    def radicale_proxy__user_address_book_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/addressbook/user/1/event.ics to radicale path /addressbook/user/1/event.ics
        """
        user_addressbook_path = request.app_config.RADICALE__USER_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__ADDRESSBOOK_DIR,
            user_subdir=request.app_config.RADICALE__USER_SUBDIR,
            user_id=request.candidate_user.user_id,
        )
        path = "{user_addressbook_path}/{sub_item}/".format(
            user_addressbook_path=user_addressbook_path, sub_item=hapic_data.path.sub_item,
        )
        return self._proxy.get_response_for_request(
            request, path, extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(UserIdPathSchema())
    def radicale_proxy__user_resource(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/user_1/ to radicale path /user_1/
        """
        user_resource_dir_name = request.app_config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=request.candidate_user.user_id
        )
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth(user_resource_dir_name, "tracim"),
        )
        return proxy.get_response_for_request(
            request,
            "/{}/".format(user_resource_dir_name),
            extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS,
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserResourceUserSubItemPathSchema())
    def radicale_proxy__user_resource_user_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/user_1/user_1_addressbook/ to radicale path /user_1/user_1_addressbook/
        """
        assert hapic_data.path.dest_user_id == hapic_data.path.user_id
        user_resource_dir_name = request.app_config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=request.candidate_user.user_id
        )
        user_resource_name = request.app_config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="user",
            owner_id=hapic_data.path.dest_user_id,
            resource_type=hapic_data.path.type,
        )
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth(user_resource_dir_name, "tracim"),
        )
        path = request.app_config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir_name, user_resource=user_resource_name
        )
        return proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_user_agenda)
    @hapic.input_path(RadicaleUserResourceUserSubItemPathSchema())
    def radicale_proxy__user_resource_user_subitems_x(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/user_1/user_1_addressbook/.. to radicale path /user_1/user_1_addressbook/...
        """
        assert hapic_data.path.dest_user_id == hapic_data.path.user_id
        user_resource_dir_name = request.app_config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=request.candidate_user.user_id
        )
        user_resource_name = request.app_config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="user",
            owner_id=hapic_data.path.dest_user_id,
            resource_type=hapic_data.path.type,
        )
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth(user_resource_dir_name, "tracim"),
        )
        user_resource_path = request.app_config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir_name, user_resource=user_resource_name
        )
        path = "{user_resource_path}/{sub_item}/".format(
            user_resource_path=user_resource_path, sub_item=hapic_data.path.sub_item
        )
        return proxy.get_response_for_request(
            request, path, extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleUserResourceWorkspaceSubItemPathSchema())
    def radicale_proxy__user_resource_workspace_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/user_1/space_1_addressbook/ to radicale path /user_1/space_1_addressbook/
        """
        user_resource_dir_name = request.app_config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=request.candidate_user.user_id
        )
        user_resource_name = request.app_config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="space",
            owner_id=hapic_data.path.workspace_id,
            resource_type=hapic_data.path.type,
        )
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth(user_resource_dir_name, "tracim"),
        )
        path = request.app_config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir_name, user_resource=user_resource_name
        )
        return proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleUserResourceWorkspaceSubItemPathSchema())
    def radicale_proxy__user_resource_workspace_subitems_x(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy user agenda
        example: /dav/user_1/space_1_addressbook/... to radicale path /user_1/space_1_addressbook/...
        """
        user_resource_dir_name = request.app_config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=request.candidate_user.user_id
        )
        user_resource_name = request.app_config.RADICALE__USER_RESOURCE_PATTERN.format(
            owner_type="space",
            owner_id=hapic_data.path.workspace_id,
            resource_type=hapic_data.path.type,
        )
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth(user_resource_dir_name, "tracim"),
        )
        user_resource_path = request.app_config.RADICALE__USER_RESOURCE_PATH_PATTERN.format(
            user_resource_dir=user_resource_dir_name, user_resource=user_resource_name
        )
        path = "{user_resource_path}/{sub_item}/".format(
            user_resource_path=user_resource_path, sub_item=hapic_data.path.sub_item
        )
        return proxy.get_response_for_request(
            request, path, extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_root_agenda)
    @hapic.input_path(WorkspaceIdPathSchema())
    def radicale_proxy__workspace_agenda(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /dav/agenda/workspace/1/ to radicale path /agenda/workspace/1/
        """
        path = request.app_config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__CALENDAR_DIR,
            workspace_subdir=request.app_config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=request.current_workspace.workspace_id,
        )
        return self._proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleWorkspaceSubItemPathSchema())
    def radicale_proxy__workspace_agenda_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /dav/agenda/workspace/1/event.ics to radicale path /agenda/workspace/1/event.ics
        """
        workspace_agenda_path = request.app_config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__CALENDAR_DIR,
            workspace_subdir=request.app_config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=request.current_workspace.workspace_id,
        )
        path = "{workspace_agenda_path}/{sub_item}".format(
            workspace_agenda_path=workspace_agenda_path, sub_item=hapic_data.path.sub_item
        )
        return self._proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_root_agenda)
    @hapic.input_path(WorkspaceIdPathSchema())
    def radicale_proxy__workspace_address_book(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /dav/addressbook/workspace/1.ics/ to radicale path /addressbook/workspace/1.ics/
        """
        path = request.app_config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__ADDRESSBOOK_DIR,
            workspace_subdir=request.app_config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=request.current_workspace.workspace_id,
        )
        return self._proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @hapic.handle_exception(WorkspaceAgendaDisabledException, http_code=HTTPStatus.NOT_FOUND)
    @check_right(can_access_workspace_event_agenda)
    @hapic.input_path(RadicaleWorkspaceSubItemPathSchema())
    def radicale_proxy__workspace_address_book_subitems(
        self, context, request: TracimRequest, hapic_data: HapicData
    ) -> Response:
        """
        proxy workspace agenda
        example: /dav/addressbook/workspace/1.ics/blabla.ics to radicale path /addressbook/workspace/1.ics/blabla.ics
        """
        workspace_agenda_path = request.app_config.RADICALE__WORKSPACE_AGENDA_PATH_PATTERN.format(
            resource_type_dir=request.app_config.RADICALE__ADDRESSBOOK_DIR,
            workspace_subdir=request.app_config.RADICALE__WORKSPACE_SUBDIR,
            workspace_id=request.current_workspace.workspace_id,
        )
        path = "{workspace_agenda_path}/{sub_item}".format(
            workspace_agenda_path=workspace_agenda_path, sub_item=hapic_data.path.sub_item
        )
        return self._proxy.get_response_for_request(
            request, path + "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    @check_right(is_user)
    def root_discovery(self, context, request: TracimRequest) -> Response:
        """
        proxy root agenda path (propfind
        example: /dav/ to radicale path /
        """
        user_resource_dir_name = request.app_config.RADICALE__USER_RESOURCE_DIR_PATTERN.format(
            user_id=request.current_user.user_id
        )
        proxy = Proxy(
            base_address=self.proxy_base_address,
            auth=HTTPBasicAuth(user_resource_dir_name, "tracim"),
        )
        return proxy.get_response_for_request(
            request, "/", extra_request_headers=RADICALE_PROXY_EXTRA_HEADERS
        )

    @hapic.with_api_doc(disable_doc=True)
    def well_known_caldav(self, context, request: TracimRequest) -> Response:
        return HTTPMovedPermanently(request.url.replace("/.well-known/caldav", "/dav/", 1))

    @hapic.with_api_doc(disable_doc=True)
    def well_known_carddav(self, context, request: TracimRequest) -> Response:
        return HTTPMovedPermanently(request.url.replace("/.well-known/carddav", "/dav/", 1))

    def bind(self, configurator: Configurator) -> None:
        """
        Create all routes and views using pyramid configurator
        for this controller
        """

        # INFO - G.M - 2021-12-08 - Please keep theses URL in sync with url proxified
        # (check RADICALE config parameters)
        configurator.add_route(
            "root_discovery", "/dav/", request_method="PROPFIND",
        )
        configurator.add_view(self.root_discovery, route_name="root_discovery")

        configurator.add_route(
            "well_known_caldav", "/.well-known/caldav",
        )
        configurator.add_view(self.well_known_caldav, route_name="well_known_caldav")
        configurator.add_route(
            "well_known_carddav", "/.well-known/carddav",
        )
        configurator.add_view(self.well_known_carddav, route_name="well_known_carddav")
        # Radicale user resource agenda
        configurator.add_route(
            "radicale_proxy__user_resource", "/dav/user_{user_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__user_resource, route_name="radicale_proxy__user_resource"
        )
        configurator.add_route(
            "radicale_proxy__user_resource_user",
            "/dav/user_{user_id:[0-9]+}/user_{dest_user_id:[0-9]+}_{type}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_user_subitems,
            route_name="radicale_proxy__user_resource_user",
        )

        configurator.add_route(
            "radicale_proxy__user_resource_user_x",
            "/dav/user_{user_id:[0-9]+}/user_{dest_user_id:[0-9]+}_{type}/{sub_item:.*}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_user_subitems_x,
            route_name="radicale_proxy__user_resource_user_x",
        )

        configurator.add_route(
            "radicale_proxy__user_resource_workspace",
            "/dav/user_{user_id:[0-9]+}/space_{workspace_id:[0-9]+}_{type}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_workspace_subitems,
            route_name="radicale_proxy__user_resource_workspace",
        )

        configurator.add_route(
            "radicale_proxy__user_resource_workspace_x",
            "/dav/user_{user_id:[0-9]+}/space_{workspace_id:[0-9]+}_{type}/{sub_item:.*}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_resource_workspace_subitems_x,
            route_name="radicale_proxy__user_resource_workspace_x",
        )

        # user agenda
        configurator.add_route(
            "radicale_proxy__user_agenda", "/dav/agenda/user/{user_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__user_agenda, route_name="radicale_proxy__user_agenda"
        )

        configurator.add_route(
            "radicale_proxy__user_agenda_x",
            "/dav/agenda/user/{user_id:[0-9]+}/{sub_item:[^\/]+\.ics}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_agenda_subitems, route_name="radicale_proxy__user_agenda_x"
        )

        # user address_book
        configurator.add_route(
            "radicale_proxy__user_address_book",
            "/dav/addressbook/user/{user_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__user_address_book, route_name="radicale_proxy__user_address_book"
        )

        configurator.add_route(
            "radicale_proxy__user_address_book_x",
            "/dav/addressbook/user/{user_id:[0-9]+}/{sub_item:[^\/]+\.vcf}{trailing_slash:[/]?}",  # noqa: W605
        )
        configurator.add_view(
            self.radicale_proxy__user_agenda_subitems,
            route_name="radicale_proxy__user_address_book_x",
        )

        # workspace agenda
        configurator.add_route(
            "radicale_proxy__agenda_workspace",
            "/dav/agenda/workspace/{workspace_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_agenda, route_name="radicale_proxy__agenda_workspace"
        )

        configurator.add_route(
            "radicale_proxy__workspace_x",
            "/dav/agenda/workspace/{workspace_id:[0-9]+}/{sub_item:.*}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_agenda_subitems, route_name="radicale_proxy__workspace_x"
        )

        # workspace address_book
        configurator.add_route(
            "radicale_proxy__address_book_workspace",
            "/dav/addressbook/workspace/{workspace_id:[0-9]+}{trailing_slash:[/]?}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_address_book,
            route_name="radicale_proxy__address_book_workspace",
        )

        configurator.add_route(
            "radicale_proxy__address_book_workspace_x",
            "/dav/addressbook/workspace/{workspace_id:[0-9]+}/{sub_item:.*}",
        )
        configurator.add_view(
            self.radicale_proxy__workspace_address_book_subitems,
            route_name="radicale_proxy__address_book_workspace_x",
        )
