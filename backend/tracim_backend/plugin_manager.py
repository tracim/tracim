import importlib
import pkgutil
import sys
import types
import typing

from pyramid.config import Configurator

from tracim_backend.config import CFG


class PluginManager(object):
    def __init__(self, prefix: str):
        self.prefix = prefix
        self.loaded_plugin = False
        self.plugins = {}

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

    def web_include(self, configurator: Configurator, app_config: CFG) -> None:
        """
        Allow to including custom web code in plugin if web_include method is provided
        at module root
        :param configurator: Tracim pyramid configurator
        :param app_config: current tracim config
        :return: nothing
        """
        for plugin_name, module in self.plugins.items():
            if hasattr(module, "web_include"):
                module.web_include(configurator, app_config)
