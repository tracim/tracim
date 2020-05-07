"""
This is just a sample of Tracim backend plugin using pluggy hook
"""
from pluggy import PluginManager
from tracim_backend.lib.core.plugins import hookimpl


@hookimpl
def on_plugins_loaded(plugin_manager: PluginManager) -> None:
    print("Hello World !")


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(globals())
