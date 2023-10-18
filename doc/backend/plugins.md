# Writing and using plugins for tracim

tracim's plugin system allows to extend and customize the tracim backend by interacting with the backend library, 
registering new routes/views, and handling events through hooks.

Plugins are implemented with the [Pluggy](https://pypi.org/project/pluggy/) framework.

This document provides an overview of tracim's plugin system and demonstrates how to create a simple "Hello World" plugin.

## Using plugins

Plugins are loaded from the folder specified in the `development.ini`

```ini
; plugin.folder_path = %(here)s/plugins
```

Plugins must be Python modules and placed in folders whose names must start with `tracim_backend_`.
They will then be loaded automatically on tracim's startup.

Official plugins are provided with tracim. For more information, see the [official plugin documentation](https://github.com/tracim/tracim/blob/develop/backend/official_plugins/README.md).

## Plugin Basics

- **Backend API Interaction**: Plugins can interact with the backend api.

- **Route/View Registration**: Plugins can register new routes and views to handle specific HTTP requests.

- **Hooks Registration**: Plugins can register to hooks related to events from the backend, such as content creation or modification.


## Creating a "Hello World" Plugin

Here is a sample implementation of a "Hello World" plugin:

*NOTE: This code is also available at [tracim/doc/backend/hello_world_plugin.py](https://github.com/tracim/tracim/blob/develop/doc/backend/hello_world_plugin.py).*
```python
"""
This is just a sample of Tracim backend plugin using pluggy hook
"""
from pluggy import PluginManager
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User


class HelloWorldPlugin:
    """Needs a registration using 'register_tracim_plugin' function."""

    @hookimpl
    def on_plugins_loaded(plugin_manager: PluginManager) -> None:
        """Automatically loaded."""
        print("Hello World !")

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        print("created user {}".format(user.public_name))


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(HelloWorldPlugin())
```

In this example, we have a "Hello World" plugin with the following key elements:

The `HelloWorldPlugin` class is the core of the plugin. Here it handles the `on_user_created` event, which is called when a user is created. In this case, it prints a message indicating the creation of a user.

The `on_plugins_loaded` hook is automatically called when the plugin is loaded.

The `register_tracim_plugin` function is used to register the plugin with the `PluginManager`. It will be called automatically on tracim's startup.

### Adding routes

To register routes in a plugin, use the following snippet in the `on_plugins_loaded` hook:

```python
from pyramid.threadlocal import get_current_registry

@hookimpl
def on_plugins_loaded(self, plugin_manager: PluginManager) -> None:
    registry = get_current_registry()
    config = Configurator(registry=registry)
    config.add_route("my_route", "/plugins/my_route", request_method="GET")
    config.add_view(self.my_view, route_name="my_route")
```

This snippet first retrieves the current Pyramid app's `Registry`, 
allowing access to the app's `Configurator` and enabling the addition of 
routes, views, and settings in the same manner as configuring a Pyramid app.

For more information about this snippet, refer to [Pyramid's documentation](https://docs.pylonsproject.org/projects/pyramid/en/latest/).

Adding this snippet to the HelloWorld plugin: 

```python
"""
This is just a sample of Tracim backend plugin using pluggy hook
"""
from pluggy import PluginManager
from pyramid.httpexceptions import HTTPOk
from pyramid.threadlocal import get_current_registry
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import User


class HelloWorldPlugin:
    """Needs a registration using 'register_tracim_plugin' function."""

    def my_view(self, request):
        return HTTPOk()

    @hookimpl
    def on_plugins_loaded(self, plugin_manager: PluginManager) -> None:
        registry = get_current_registry()
        config = Configurator(registry=registry)
        config.add_route("my_route", "/plugins/hello_world/my_route", request_method="GET")
        config.add_view(self.my_view, route_name="my_route")

    @hookimpl
    def on_user_created(self, user: User, context: TracimContext) -> None:
        print("created user {}".format(user.public_name))


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(HelloWorldPlugin())
```

Now the `my_view` function will be called when accessing the `/plugins/hello_world/my_route` route.