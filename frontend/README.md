Frontend
===================

This folder is the frontend part of Tracim.


## Build the app

### Production

Its installation and building are respectively handled by [install_frontend_dependencies.sh](../../install_frontend_dependencies.sh) and [build_full_frontend.sh](../../build_full_frontend.sh).

See [README.md](../../README.md) at the root of the repository.

### Development

#### Rebuild the app

    yarn run buildoptimized

#### Start de development server

    yarn run servdev

The development server uses webpack-dev-server with hot module reloading.

It uses a proxy for the api and pushpin so that there is nothing more to configure.
___

### Other available yarn scripts

see [frontend/doc/yarn_scripts.md](../frontend/doc/yarn_scripts.md)

### Before pushing changes to this app, you must

see [frontend/doc/before_push.md](../frontend/doc/before_push.md)

## Apps

Tracim frontend is a skeleton that runs apps to do the actual work. (like managing Documents, Files, Threads ...)

Apps are all independent React applications.  
They can be freely added to or removed from Tracim without the need for a rebuild, only a backend config change.  
They can be run outside of Tracim as well.  
In Tracim, they act as plugins.

> To build apps, see the README.md of the specific app

