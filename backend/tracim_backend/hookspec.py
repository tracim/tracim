"""
General hookspec for Tracim Backend app
=======================================

"""

from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import hookspec
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession


class TracimRequestHookSpec:
    """Hooks for tracim request changes."""

    @hookspec
    def on_current_user_set(self, user: User, request: TracimRequest) -> None:
        """
        Called when a current user is defined on the request.

        :param user: current user
        :param request: current request
        """
        pass

    @hookspec
    def on_current_client_token_set(self, client_token: str, request: TracimRequest) -> None:
        """
        Called when a current client_token is defined on the request.

        :param client_token: current client token
        :param request: current request
        """
        pass

    @hookspec
    def on_request_session_created(self, request: TracimRequest, session: TracimSession) -> None:
        """
        Called when the request has been initialized.
        """
        pass

    @hookspec
    def on_request_finished(self, request: TracimRequest) -> None:
        """
        Called when the request has been handled.
        """
        pass


@hookspec
def web_include(configurator: Configurator, app_config: CFG) -> None:
    """
    Allow to including custom web code in plugin if ´web_include´ method is provided
    at module root, example using a Controller class like in Tracim source code

    >>> class MyController(Controller):
    ...     pass
    ... # doctest: +SKIP
    >>> @hookimpl
    ... def web_include(configurator: Configurator, app_config: CFG) -> None:
    ...     my_controller = MyController()
    ...     configurator.include(mycontroller.bind, route_prefix=BASE_API_V2)
    ... # doctest: +SKIP

    :param configurator: Tracim pyramid configurator
    :param app_config: current tracim config
    :return: nothing
    """
    pass
