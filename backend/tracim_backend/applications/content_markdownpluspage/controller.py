from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend import TracimControllerImporter
from tracim_backend.config import CFG


class MarkDownPlusPageControllerImporter(TracimControllerImporter):
    def import_controller(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        # INFO - G.M - 2020-01-03 - Currently not created yet
        return configurator
