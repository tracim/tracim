from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend import TracimControllerImporter
from tracim_backend.applications.content_folder.folder_controller import FolderController
from tracim_backend.config import CFG


class ContentFolderControllerImporter(TracimControllerImporter):
    def import_controller(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        folder_controller = FolderController()
        configurator.include(folder_controller.bind, route_prefix=route_prefix)
        return configurator
