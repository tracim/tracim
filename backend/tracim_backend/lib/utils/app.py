from abc import ABC
import typing

from hapic.ext.pyramid import PyramidContext
from pyramid.config import Configurator

from tracim_backend.app_models.applications import TracimApplicationInContext

if typing.TYPE_CHECKING:
    from tracim_backend.config import CFG


class TracimApplication(ABC):
    def __init__(
        self,
        label: str,
        slug: str,
        fa_icon: str,
        is_active: bool,
        config: typing.Dict[str, str],
        main_route: str,
    ) -> None:
        self.label = label
        self.slug = slug
        self.fa_icon = fa_icon
        self.is_active = is_active
        self.config = config
        self.main_route = main_route
        self.content_types = []

    def get_application_in_context(self, app_config: "CFG") -> TracimApplicationInContext:
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
