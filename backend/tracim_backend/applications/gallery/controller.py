from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.config import CFG


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str, context: PyramidContext
) -> Configurator:
    # INFO - G.M - 2020-01-03 - Dummy backend app
    return configurator
