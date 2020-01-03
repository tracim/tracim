from pyramid.config import Configurator

from tracim_backend.applications.thread.threads_controller import ThreadController
from tracim_backend.config import CFG


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str
) -> Configurator:
    thread_controller = ThreadController()
    configurator.include(thread_controller.bind, route_prefix=route_prefix)
    return configurator
