from http import HTTPStatus

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend import TracimControllerImporter
from tracim_backend.applications.agenda.authorization import add_www_authenticate_header_for_caldav
from tracim_backend.config import CFG
from tracim_backend.exceptions import CaldavNotAuthenticated
from tracim_backend.exceptions import CaldavNotAuthorized
from tracim_backend.views import BASE_API_V2


class AgendaControllerImporter(TracimControllerImporter):
    def import_controller(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        if app_config.CALDAV__ENABLED:
            # TODO - G.M - 2019-03-18 - check if possible to avoid this import here,
            # import is here because import AgendaController without adding it to
            # pyramid make trouble in hapic which try to get view related
            # to controller but failed.
            from tracim_backend.applications.agenda.controllers.agenda_controller import (
                AgendaController,
            )
            from tracim_backend.applications.agenda.controllers.radicale_proxy_controller import (
                RadicaleProxyController,
            )

            configurator.include(add_www_authenticate_header_for_caldav)
            # caldav exception
            context.handle_exception(CaldavNotAuthorized, HTTPStatus.FORBIDDEN)
            context.handle_exception(CaldavNotAuthenticated, HTTPStatus.UNAUTHORIZED)
            # controller
            radicale_proxy_controller = RadicaleProxyController(
                proxy_base_address=app_config.CALDAV__RADICALE_PROXY__BASE_URL,
                radicale_base_path=app_config.CALDAV__RADICALE__BASE_PATH,
                radicale_user_path=app_config.CALDAV__RADICALE__USER_PATH,
                radicale_workspace_path=app_config.CALDAV_RADICALE_WORKSPACE_PATH,
            )
            agenda_controller = AgendaController()
            configurator.include(agenda_controller.bind, route_prefix=BASE_API_V2)
            configurator.include(radicale_proxy_controller.bind)
        return configurator
