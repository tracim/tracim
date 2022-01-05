Frontend
========

This folder is the frontend part of Tracim.

## Build the app

### Production

Its installation and building are respectively handled by [install_frontend_dependencies.sh](../../install_frontend_dependencies.sh) and [build_full_frontend.sh](../../build_full_frontend.sh).

See [README.md](../../README.md) at the root of the repository.


### Development

#### Rebuild the app

    ./build_frontend.sh

This shell script accept `-d` to bypass obfuscation and minification to help debugging.

#### Start the development server

    yarn run servdev

The development server uses webpack-dev-server with hot module reloading.

It uses a proxy for the api and pushpin so that there is nothing more to configure.

## Linting and translation
Before pushing changes to this folder, you must:

see [frontend/doc/before_push.md](../frontend/doc/before_push.md)

## Other available yarn scripts

see [frontend/doc/yarn_scripts.md](../frontend/doc/yarn_scripts.md)
