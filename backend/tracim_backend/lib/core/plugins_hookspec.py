"""
Plugins Management event hooks
"""
from tracim_backend.lib.core.plugins import TracimPluginManager
from tracim_backend.lib.core.plugins import hookspec


@hookspec
def on_plugins_loaded(plugin_manager: TracimPluginManager) -> None:
    """Event at end of loading of all plugins"""
    pass
