import collections
import importlib
import pkgutil
import sys
import types
import typing

import pluggy

from tracim_backend.config import CFG
from tracim_backend.lib.utils.utils import find_all_submodule_path

EVENT_NAMESPACE = "tracim_event"
HOOKSPEC_FILES_SUFFIX = "hookspec"
hookspec = pluggy.HookspecMarker(EVENT_NAMESPACE)
hookimpl = pluggy.HookimplMarker(EVENT_NAMESPACE)


class TracimPluginManager(object):
    def __init__(self, prefix: str) -> None:
        self.prefix = prefix  # type: str
        self.loaded_plugin = False  # type: bool
        self.plugins = {}  # type: typing.Dict[str, types.ModuleType]
        self.event_dispatcher = self._create_pluggy_event_dispatcher()  # type: pluggy.PluginManager

    @classmethod
    def get_all_hookspec_module_path(cls) -> typing.List[str]:
        hookspec_module_paths = []
        # INFO - G.M - 2019-11-28 - import root module,
        # currently "tracim_backend"
        root_module_name = cls.__module__.split(".")[0]
        root_module = importlib.import_module(root_module_name)
        # INFO - G.M - 2019-11-28 - get all submodules recursively,
        # find those with with hookspec suffix, import them and add them
        # to valid hookspec
        for module_path in find_all_submodule_path(root_module):
            if module_path.endswith(HOOKSPEC_FILES_SUFFIX):
                hookspec_module_paths.append(module_path)
        return hookspec_module_paths

    def _load_spec(self, event_dispatcher: pluggy.PluginManager) -> None:
        """
        Load all hookspec modules
        """

        # INFO - G.M - 2019-11-28 - get all submodules recursively,
        # find those with with hookspec suffix, import them and add them
        # to valid hookspec
        for hookspec_module_path in self.get_all_hookspec_module_path():
            module = importlib.import_module(hookspec_module_path)
            event_dispatcher.add_hookspecs(module)

    def _create_pluggy_event_dispatcher(self) -> pluggy.PluginManager:
        event_dispatcher = pluggy.PluginManager(EVENT_NAMESPACE)
        self._load_spec(event_dispatcher)
        return event_dispatcher

    def register(self, module: types.ModuleType) -> None:
        self.event_dispatcher.register(module)

    def register_all(self) -> None:
        # INFO - G.M - 2019-12-02 - sort plugins by name here to have predictable
        # order for plugin registration according to plugin_name.
        sorted_plugins = collections.OrderedDict(sorted(self.plugins.items()))
        for module_name, module in sorted_plugins.items():
            self.register(module)

    def add_plugin_path(self, plugin_folder: str) -> None:
        """
        Add path for plugin search
        :param plugin_folder: folder path (should be absolute path) where plugin should be stored
        :return:
        """
        if plugin_folder not in sys.path:
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


def init_plugin_manager(app_config: CFG) -> TracimPluginManager:
    plugin_manager = TracimPluginManager(prefix="tracim_backend_")
    # INFO - G.M - 2019-11-27 - if a plugin path is provided, load plugins from this path
    if app_config.PLUGIN__FOLDER_PATH:
        plugin_manager.add_plugin_path(app_config.PLUGIN__FOLDER_PATH)
    plugin_manager.load_plugins()
    plugin_manager.event_dispatcher.hook.add_new_hooks.call_historic(
        kwargs=dict(plugin_manager=plugin_manager)
    )
    plugin_manager.register_all()
    plugin_manager.event_dispatcher.hook.on_plugins_loaded(plugin_manager=plugin_manager)
    return plugin_manager
