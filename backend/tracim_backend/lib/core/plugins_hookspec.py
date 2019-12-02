"""
Plugins Management event hooks
==============================

"""
from tracim_backend.lib.core.plugins import TracimPluginManager
from tracim_backend.lib.core.plugins import hookspec


@hookspec
def on_plugins_loaded(plugin_manager: TracimPluginManager) -> None:
    """
    Event at end of loading of all plugins

    :param plugin_manager: plugin manager of tracim
    :return: nothing
    """
    pass


@hookspec(historic=True)
def add_new_hooks(plugin_manager):
    """
    Called after plugin registration, allow to add new hook to tracim
    :param pluginmanager:
    :return:
    """
