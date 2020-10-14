"""
This is just a sample of Tracim backend plugin using pluggy hook
"""
from pluggy import PluginManager

from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User


@hookimpl
def on_plugins_loaded(plugin_manager: PluginManager) -> None:
    """Automatically loaded."""
    print("Hello World !")


class HookImpl:
    """Needs a registration using 'register_tracim_plugin' function."""

    def on_user_created(self, user: User, context: TracimContext) -> None:
        print("created user {}".format(user.public_name))


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(HookImpl())
