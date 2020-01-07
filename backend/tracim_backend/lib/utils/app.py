from abc import ABC
import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class TracimAppFactory(ABC):
    def create_app(self, app_config: "CFG"):
        raise NotImplementedError()


class TracimAppConfig(ABC):
    def load_config(self, app_config: "CFG"):
        raise NotImplementedError()

    def check_config(self, app_config: "CFG"):
        raise NotImplementedError()


class TracimControllerImporter(ABC):
    def import_controller(
        self,
        configurator: Configurator,
        app_config: "CFG",
        route_prefix: str,
        context: PyramidContext,
    ) -> Configurator:
        raise NotImplementedError()
