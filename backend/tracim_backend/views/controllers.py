from abc import ABC

from pyramid.config import Configurator


class Controller(ABC):
    """
    Specification for Tracim Web Controller

    example of simple controller:

    >>> def bind(self, configurator: Configurator) -> None:
    >>>   configurator.add_route("about", "/system/about", request_method="GET")
    >>>   configurator.add_view(self.about, route_name="about"
    """

    def bind(self, configurator: Configurator) -> None:
        """
        :param configurator: pyramid Configurator
        :return: Nothing
        """
        raise NotImplementedError()
