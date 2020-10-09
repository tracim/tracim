import os
import typing

from pyramid.config import Configurator
from pyramid.renderers import render_to_response

from tracim_backend.config import CFG
from tracim_backend.exceptions import PageNotFound
from tracim_backend.extensions import app_list
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import FRONTEND_UI_SUBPATH
from tracim_backend.lib.utils.utils import ExtendedColor
from tracim_backend.views.controllers import Controller

INDEX_PAGE_NAME = "index.mak"
APP_FRONTEND_PATH = "app/{minislug}.app.js"


class FrontendController(Controller):
    def __init__(
        self,
        dist_folder_path: str,
        cache_token: str,
        custom_toolbox_folder_path: typing.Optional[str],
    ) -> None:
        self.dist_folder_path = dist_folder_path
        self.custom_toolbox_folder_path = custom_toolbox_folder_path
        self.custom_toolbox_files = []  # type: typing.List["os.DirEntry"]
        self.cache_token = cache_token
        if custom_toolbox_folder_path:
            self.custom_toolbox_files = self._get_custom_toolboxes_files(
                self.custom_toolbox_folder_path
            )

    def _get_index_file_path(self) -> str:
        index_file_path = os.path.join(self.dist_folder_path, INDEX_PAGE_NAME)
        if not os.path.exists(index_file_path):
            raise FileNotFoundError()
        return index_file_path

    def _get_custom_toolboxes_files(self, custom_toolbox_dir: str) -> typing.List["os.DirEntry"]:
        custom_toolbox_files = []
        scanned_dir = os.scandir(custom_toolbox_dir)
        for entry in scanned_dir:
            if entry.name.endswith(".js") and entry.is_file():
                custom_toolbox_files.append(entry)
        return custom_toolbox_files

    def not_found_view(self, context, request: TracimRequest):
        raise PageNotFound("{} is not a valid path".format(request.path)) from context

    def ui(self, context, request: TracimRequest):
        return self.index(context, request)

    def index(self, context, request: TracimRequest):
        app_config = request.registry.settings["CFG"]  # type: CFG
        # TODO - G.M - 2018-08-07 - Refactor autogen valid app list for frontend
        frontend_apps = []
        app_api = ApplicationApi(app_list=app_list)
        applications = [
            app_api.get_application_in_context(app, app_config) for app in app_api.get_all()
        ]
        for app in applications:
            app_frontend_path = APP_FRONTEND_PATH.replace("{minislug}", app.minislug)
            app_path = os.path.join(self.dist_folder_path, app_frontend_path)
            if os.path.exists(app_path):
                frontend_apps.append(app)

        return render_to_response(
            self._get_index_file_path(),
            {
                "colors": {"primary": ExtendedColor(app_config.APPS_COLORS["primary"])},
                "applications": frontend_apps,
                "website_title": app_config.WEBSITE__TITLE,
                "custom_toolbox_files": self.custom_toolbox_files,
                "cache_token": self.cache_token,
                "excluded_notifications": app_config.WEB__NOTIFICATIONS__EXCLUDED,
            },
        )

    def bind(self, configurator: Configurator) -> None:

        configurator.add_notfound_view(self.not_found_view)
        # index.html for /index.html and /
        configurator.add_route("root", "/", request_method="GET")
        configurator.add_view(self.index, route_name="root")
        configurator.add_route(
            "ui", "/{}{{ui_subpath:.*}}".format(FRONTEND_UI_SUBPATH), request_method="GET"
        )
        configurator.add_view(self.ui, route_name="ui")
        configurator.add_route("index", INDEX_PAGE_NAME, request_method="GET")
        configurator.add_view(self.index, route_name="index")

        if self.custom_toolbox_folder_path:
            configurator.add_static_view(
                name="custom_toolbox-assets", path=self.custom_toolbox_folder_path
            )

        for dirname in os.listdir(self.dist_folder_path):
            configurator.add_static_view(
                name=dirname, path=os.path.join(self.dist_folder_path, dirname)
            )
