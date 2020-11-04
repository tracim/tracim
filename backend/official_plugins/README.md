# Official Backend Plugins

This directory contains all official backend plugins.
You can enable them by creating a symlink from Tracim plugins folder (`plugin.folder_path` in `development.ini`) to the needed plugin:
```shell
# from backend directory, default configuration
cd plugins
ln -s ../official_plugins/<tracim_backend_plugin_you_need> .
```

WARNING: Those plugins are implemented using an experimental API that is planned to change: if you develop your own plugins using this API, expect them to break without notice.

## Auto-Invite Plugin (tracim_backend_auto_invite)

This plugin:
- adds every new user to all OPEN spaces
- adds all users to every newly created OPEN space

## Child Removal Plugin (tracim_backend_child_removal)

When a user is removed from a space, this plugin recursively removes this user from the children of this space.

NOTE: if you activate this plugin we recommend to also activate the Parent Access plugin to get a consistent behavior.

## Parent Access Plugin (tracim_backend_parent_access)

This plugin recursively adds new members of a space to its parents with the default user role of each space.

NOTE: if you activate this plugin we recommend to also activate the Child Removal plugin to get a consistent behavior.
