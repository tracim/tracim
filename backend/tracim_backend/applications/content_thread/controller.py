from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.applications.content_thread.threads_controller import ThreadController
from tracim_backend.config import CFG


def import_controller(
    configurator: Configurator, app_config: CFG, route_prefix: str, context: PyramidContext
) -> Configurator:
    thread_controller = ThreadController()
    configurator.include(thread_controller.bind, route_prefix=route_prefix)
    return configurator
