"""
General spec for Tracim Backend app
"""

from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import hookspec


@hookspec
def web_include(configurator: Configurator, app_config: CFG) -> None:
    """
    Allow to including custom web code in plugin if web_include method is provided
    at module root
    :param configurator: Tracim pyramid configurator
    :param app_config: current tracim config
    :return: nothing
    """
    pass
