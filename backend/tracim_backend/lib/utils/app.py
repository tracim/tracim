from abc import ABC
import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.applications import Application

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class TracimApp(ABC):
    def create_app(self, app_config: "CFG") -> Application:
        """ Create Tracim application"""
        raise NotImplementedError()

    def load_config(self, app_config: "CFG") -> "CFG":
        """
        Allow to load specific config parameter, example:
        >>> app_config.TEST__EXAMPLE_CONFIG_PARAMETER = app_config.get_raw_config("test.example_config_parameter")
        """
        raise NotImplementedError()

    def check_config(self, app_config: "CFG") -> "CFG":
        """
        Check app specific config consistency, example:
        >>> app_config.check_mandatory_param("TEST__EXAMPLE_CONFIG_PARAMETER", app_config.TEST__EXAMPLE_CONFIG_PARAMETER)
        """
        raise NotImplementedError()

    def import_controllers(
        self,
        configurator: Configurator,
        app_config: "CFG",
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        """
        Allow to import Controller and other stuff in Tracim web context
        """
        raise NotImplementedError()
