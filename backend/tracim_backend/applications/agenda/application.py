from http import HTTPStatus

from hapic.ext.pyramid import PyramidContext
from paste.deploy.converters import asbool
from pyramid.config import Configurator

from tracim_backend.app_models.applications import TracimApplicationInContext
from tracim_backend.applications.agenda.authorization import add_www_authenticate_header_for_caldav
from tracim_backend.config import CFG
from tracim_backend.exceptions import CaldavNotAuthenticated
from tracim_backend.exceptions import CaldavNotAuthorized
from tracim_backend.exceptions import ConfigurationError
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.views import BASE_API_V2


class AgendaApp(TracimApplication):
    def create_app(self, app_config: CFG) -> TracimApplicationInContext:
        return TracimApplicationInContext(
            label="Agenda",
            slug="agenda",
            fa_icon="calendar",
            is_active=app_config.CALDAV__ENABLED,
            config={},
            main_route="/ui/workspaces/{workspace_id}/agenda",
            app_config=app_config,
        )

    def load_config(self, app_config: CFG) -> CFG:
        """
        load config for caldav related stuff
        """
        app_config.CALDAV__ENABLED = asbool(app_config.get_raw_config("caldav.enabled", "false"))
        app_config.CALDAV__RADICALE_PROXY__BASE_URL = app_config.get_raw_config(
            "caldav.radicale_proxy.base_url", None
        )
        app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER = app_config.get_raw_config(
            "caldav.radicale.storage.filesystem_folder"
        )
        app_config.CALDAV__RADICALE__AGENDA_DIR = "agenda"
        app_config.CALDAV__RADICALE__WORKSPACE_SUBDIR = "workspace"
        app_config.CALDAV__RADICALE__USER_SUBDIR = "user"
        app_config.CALDAV__RADICALE__BASE_PATH = "/{}/".format(
            app_config.CALDAV__RADICALE__AGENDA_DIR
        )
        app_config.CALDAV__RADICALE__USER_PATH = "/{}/{}/".format(
            app_config.CALDAV__RADICALE__AGENDA_DIR, app_config.CALDAV__RADICALE__USER_SUBDIR
        )
        app_config.CALDAV_RADICALE_WORKSPACE_PATH = "/{}/{}/".format(
            app_config.CALDAV__RADICALE__AGENDA_DIR, app_config.CALDAV__RADICALE__WORKSPACE_SUBDIR
        )
        return app_config

    def check_config(self, app_config: CFG) -> CFG:
        """
        Check if config is correctly setted for caldav features
        """
        if app_config.CALDAV__ENABLED:
            app_config.check_mandatory_param(
                "CALDAV__RADICALE_PROXY__BASE_URL",
                app_config.CALDAV__RADICALE_PROXY__BASE_URL,
                when_str="when caldav feature is enabled",
            )
            # TODO - G.M - 2019-05-06 - convert "caldav.radicale.storage.filesystem_folder"
            # as tracim global parameter
            app_config.check_mandatory_param(
                "CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER",
                app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
                when_str="if caldav feature is enabled",
            )
            app_config.check_directory_path_param(
                "CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER",
                app_config.CALDAV__RADICALE__STORAGE__FILESYSTEM_FOLDER,
                writable=True,
            )
            radicale_storage_type = app_config.settings.get("caldav.radicale.storage.type")
            if radicale_storage_type != "multifilesystem":
                raise ConfigurationError(
                    '"{}" should be set to "{}"'
                    " (currently only valid value)"
                    ' when "{}" is true'.format(
                        "caldav.radicale.storage.type", "multifilesystem", "caldav.enabled"
                    )
                )
        return app_config

    def import_controllers(
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


application = AgendaApp()
