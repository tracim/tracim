import collections
import importlib
import pkgutil
import sys
import types
import typing

import pluggy

from tracim_backend.config import CFG
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.utils import find_all_submodule_path

PLUGIN_NAMESPACE = "tracim"
hookspec = pluggy.HookspecMarker(PLUGIN_NAMESPACE)
hookimpl = pluggy.HookimplMarker(PLUGIN_NAMESPACE)

HOOKSPEC_FILES_SUFFIX = "hookspec"
HOOKSPEC_CLASS_SUFFIX = "HookSpec"
PLUGIN_DIR_PREFIX = "tracim_backend_"
PLUGIN_ENTRY_POINT_NAME = "register_tracim_plugin"

TracimPluginEntryPoint = typing.Callable[[pluggy.PluginManager], None]


def get_all_hookspec_module_path() -> typing.List[str]:
    """Return the list of modules paths declaring hookspecs."""
    hookspec_module_paths = []
    # INFO - G.M - 2019-11-28 - import root module,
    # currently "tracim_backend"
    root_module_name = __name__.split(".")[0]
    root_module = importlib.import_module(root_module_name)
    # INFO - G.M - 2019-11-28 - get all submodules recursively,
    # find those with with hookspec suffix, import them and add them
    # to valid hookspec
    for module_path in find_all_submodule_path(root_module):
        if module_path.endswith(HOOKSPEC_FILES_SUFFIX):
            hookspec_module_paths.append(module_path)
    return hookspec_module_paths


def _load_spec(plugin_manager: pluggy.PluginManager) -> None:
    """
    Load all hookspec modules
    """

    # INFO - G.M - 2019-11-28 - get all submodules recursively,
    # find those with with hookspec suffix, import them and add them
    # to valid hookspec
    for hookspec_module_path in get_all_hookspec_module_path():
        module = importlib.import_module(hookspec_module_path)
        try:
            plugin_manager.add_hookspecs(module)
        except ValueError:
            # no hook spec as functions
            pass
        module_classes = [
            entry
            for entry in module.__dict__.values()
            if isinstance(entry, type) and entry.__name__.endswith(HOOKSPEC_CLASS_SUFFIX)
        ]
        for class_ in module_classes:
            plugin_manager.add_hookspecs(class_)


def _load_plugins(plugin_manager: pluggy.PluginManager,) -> typing.Dict[str, types.ModuleType]:
    """
    Loads all tracim_backend_plugin
    :param force: plugin will not be reloaded if already loaded if force is not true.
    :return: None
    """
    plugins = {}
    prefix_len = len(PLUGIN_DIR_PREFIX)
    for finder, name, ispkg in pkgutil.iter_modules():
        if not name.startswith(PLUGIN_DIR_PREFIX):
            continue
        plugin_name = name[prefix_len:]
        plugins[plugin_name] = importlib.import_module(name)
    return plugins


def _register_all(
    plugin_manager: pluggy.PluginManager, plugins: typing.Dict[str, types.ModuleType]
):
    # INFO - G.M - 2019-12-02 - sort plugins by name here to have predictable
    # order for plugin registration according to plugin_name.
    plugins = collections.OrderedDict(sorted(plugins.items()))
    for plugin_name, module in plugins.items():
        plugin_manager.register(module)
        try:
            entry_point = getattr(module, PLUGIN_ENTRY_POINT_NAME)
            entry_point(plugin_manager)
        except AttributeError:
            logger.warning(
                plugin_manager,
                "Cannot find plugin entry point '{}' in '{}' plugin".format(
                    PLUGIN_ENTRY_POINT_NAME, plugin_name
                ),
            )


def create_plugin_manager() -> pluggy.PluginManager:
    """Create an instance of tracim plugin manager and loads the tracim
    hookspecs from tracim modules."""
    plugin_manager = pluggy.PluginManager(PLUGIN_NAMESPACE)
    _load_spec(plugin_manager)
    return plugin_manager


def init_plugin_manager(app_config: CFG) -> pluggy.PluginManager:
    plugin_manager = create_plugin_manager()

    # Static plugins, imported here to avoid circular reference with hookimpl
    from tracim_backend.lib.core.event import EventBuilder
    from tracim_backend.lib.core.event import EventPublisher
    import tracim_backend.lib.core.mention as mention

    plugin_manager.register(EventBuilder(app_config))
    plugin_manager.register(EventPublisher(app_config))
    mention.register_tracim_plugin(plugin_manager)

    # INFO - G.M - 2019-11-27 - if a plugin path is provided, load plugins from this path
    plugin_path = app_config.PLUGIN__FOLDER_PATH
    plugins = {}  # type: typing.Dict[str, types.ModuleType]
    if plugin_path and plugin_path not in sys.path:
        sys.path.append(plugin_path)
        try:
            plugins = _load_plugins(plugin_manager)
        finally:
            sys.path.remove(plugin_path)

    plugin_manager.hook.add_new_hooks.call_historic(kwargs=dict(plugin_manager=plugin_manager))
    _register_all(plugin_manager, plugins)
    logger.info(
        init_plugin_manager,
        "Loaded and registered the following plugins: {}".format(tuple(plugins.keys())),
    )
    plugin_manager.hook.on_plugins_loaded(plugin_manager=plugin_manager)
    return plugin_manager
