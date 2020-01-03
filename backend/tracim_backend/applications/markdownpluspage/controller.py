from pyramid.config import Configurator

from tracim_backend.config import CFG


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str
) -> Configurator:
    # INFO - G.M - 2020-01-03 - Currently not created yet
    return configurator
