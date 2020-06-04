"""
Plugins Management event hooks
==============================

"""
import pluggy

from tracim_backend.lib.core.plugins import hookspec


@hookspec
def on_plugins_loaded(plugin_manager: pluggy.PluginManager) -> None:
    """
    Event at end of loading of all plugins

    :param plugin_manager: plugin manager of tracim
    :return: nothing
    """
    pass


@hookspec(historic=True)
def add_new_hooks(plugin_manager: pluggy.PluginManager) -> None:
    """
    Called after plugin registration, allow to add new hook to tracim.
    Hooks can be used like this to implement new specfile:

    >>> @hookimpl
    ... def add_new_hooks(plugin_manager: pluggy.PluginManager):
    ...     plugin_manager.add_hookspecs(myplugin.spec)
    ... # doctest: +SKIP

    :param pluginmanager: plugin manager of tracim
    :return: nothing
    """
