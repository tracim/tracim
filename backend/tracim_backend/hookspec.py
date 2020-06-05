"""
General hookspec for Tracim Backend app
=======================================

"""

from pyramid.config import Configurator

from tracim_backend.config import CFG
from tracim_backend.lib.core.plugins import hookspec
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import TracimSession


class TracimContextHookSpec:
    """Hooks for tracim context changes.

    Don't assume that there is only one active context at one point in time if
    the WSGI app is launched with threads.
    """

    @hookspec
    def on_context_current_user_set(self, user: User, context: TracimContext) -> None:
        """
        Called when a current user is defined on the context.

        :param user: current user
        :param request: current request
        """
        pass

    @hookspec
    def on_context_session_created(self, session: TracimSession, context: TracimContext) -> None:
        """
        Called when the context's session has been initialized.
        """
        pass

    @hookspec
    def on_context_finished(self, context: TracimContext) -> None:
        """
        Called when the context is finished.
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
    ...     configurator.include(mycontroller.bind, route_prefix=BASE_API)
    ... # doctest: +SKIP

    :param configurator: Tracim pyramid configurator
    :param app_config: current tracim config
    :return: nothing
    """
    pass
