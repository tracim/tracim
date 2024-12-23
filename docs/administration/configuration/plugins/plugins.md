esn# Writing and using plugins for tracim

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

Official plugins are provided with tracim. For more information, see the [official plugin documentation](/docs/administration/configuration/plugins/Official_Backend_Plugins.md).

## Plugin Basics

- **Backend API Interaction**: Plugins can interact with the backend api.

- **Route/View Registration**: Plugins can register new routes and views to handle specific HTTP requests.

- **Hooks Registration**: Plugins can register to hooks related to events from the backend, such as content creation or modification.


## Creating a "Hello World" Plugin

Here is a sample implementation of a "Hello World" plugin:

*NOTE: This code is also available at [tracim/doc/backend/hello_world_plugin.py](/docs/administration/configuration/plugins/hello_world_plugin.py).*
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
from pyramid.config import Configurator
from pluggy import PluginManager
from pyramid.threadlocal import get_current_registry
from tracim_backend.lib.core.plugins import hookimpl

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
from pyramid.config import Configurator
from pyramid.threadlocal import get_current_registry
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.core.user import UserApi
from tracim_backend.views.core_api.schemas import UserSchema


class HelloWorldPlugin:
    """
    This plugin adds a comment to video contents when created if they are not a mp4 file.
    Needs a registration using 'register_tracim_plugin' function.
    """
    @hapic.output_body(UserSchema())
    def get_user(self, request: TracimRequest):
        app_config = request.registry.settings["CFG"]  # type: CFG
        uapi = UserApi(
            current_user=request.current_user, session=request.dbsession, config=app_config  # User
        )
        user = uapi.get_current_user()
        return uapi.get_user_with_context(user)

    @hookimpl
    def on_plugins_loaded(self, plugin_manager: PluginManager) -> None:
        """
        This method is called when the plugin is loaded.
        """
        registry = get_current_registry()
        config = Configurator(registry=registry)
        config.add_route("rss_messages", "/plugins/hello_world/user", request_method="GET")
        config.add_view(self.get_user, route_name="hello_world_user")


def register_tracim_plugin(plugin_manager: PluginManager):
    plugin_manager.register(HelloWorldPlugin())
```

Now the `my_view` function will be called when accessing the `/plugins/hello_world/my_route` route.

## Technical information

`Configurator` is accessed through `pyramid.threadlocal` registry. It is accessible because 
`Configurator` has been pushed on the `threadlocal` stack before registering the plugins.
It is the popped from the stack once the configuration is over. Meaning that the `Configurator`
is not accessible outside and after the `on_plugins_loaded` hook.

The `on_plugins_loaded` is run before the app is split into threads. Meaning this operation is
thread safe, that the modification are propagated to all the future threads and are not duplicated.

For example, running tracim with `uswgi` and the following configuration will only run the hook once.
```ini
workers = 4
threads = 4
```

For more information see [pyramid's official documentation](https://docs.pylonsproject.org/projects/pyramid/en/latest/api/config.html#pyramid.config.Configurator.begin).
