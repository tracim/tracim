import importlib
import pkgutil
import sys
import types
import typing

import pluggy
from pyramid.config import Configurator

from tracim_backend.config import CFG

EVENT_NAMESPACE = "tracim_event"
hookspec = pluggy.HookspecMarker(EVENT_NAMESPACE)
hookimpl = pluggy.HookimplMarker(EVENT_NAMESPACE)


class TracimPluginManager(object):
    def __init__(self, prefix: str):
        self.prefix = prefix
        self.loaded_plugin = False
        self.plugins = {}
        self.event_manager = self._setup_pluggy_event_manager()

    def _setup_pluggy_event_manager(self) -> pluggy.PluginManager:
        plugin_manager = pluggy.PluginManager(EVENT_NAMESPACE)
        plugin_manager.add_hookspecs(PluginSpec)
        return plugin_manager

    def register(self, module: types.ModuleType):
        self.event_manager.register(module)

    def register_all(self):
        for module_name, module in self.plugins.items():
            self.register(module)

    def add_plugin_path(self, plugin_folder: str) -> None:
        """
        Add path for plugin search
        :param plugin_folder: folder path (should be absolute path) where plugin should be stored
        :return:
        """
        sys.path.append(plugin_folder)

    def load_plugins(self, force=False) -> typing.Dict[str, types.ModuleType]:
        """
        Loads all tracim_backend_plugin
        :param force: plugin will not be reloaded if already loaded if force is not true.
        :return: None
        """
        if self.loaded_plugin and not force:
            return self.plugins
        self.plugins.update(
            {
                name: importlib.import_module(name)
                for finder, name, ispkg in pkgutil.iter_modules()
                if name.startswith(self.prefix)
            }
        )
        self.loaded_plugin = True
        return self.plugins


class PluginSpec(object):
    @hookspec
    def web_include(self, configurator: Configurator, app_config: CFG) -> None:
        """
        Allow to including custom web code in plugin if web_include method is provided
        at module root
        :param configurator: Tracim pyramid configurator
        :param app_config: current tracim config
        :return: nothing
        """
        pass
