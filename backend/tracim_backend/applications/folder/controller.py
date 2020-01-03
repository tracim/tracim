from pyramid.config import Configurator

from tracim_backend.applications.folder.folder_controller import FolderController
from tracim_backend.config import CFG


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str
) -> Configurator:
    folder_controller = FolderController()
    configurator.include(folder_controller.bind, route_prefix=route_prefix)
    return configurator
