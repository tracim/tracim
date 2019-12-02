"""
This is just a sample of Tracim backend plugin using pluggy hook
"""
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.plugins import TracimPluginManager

@hookimpl
def on_plugins_loaded(plugin_manager: TracimPluginManager) -> None:
    print('Hello World !')
