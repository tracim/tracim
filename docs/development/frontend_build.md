# Working in frontend

## Frontend architecture

Tracim frontend is split in `apps`.
`Apps` are standalone React apps.
`frontend/` folder is Tracim core.
Each apps are folders starting with `frontend_app_*`.
`frontend_lib` is a library for reusable components in any apps.
`frontend_vendors` build the common vendor libraries to multiple apps (eg. React, date-fns, ...)

## Install frontend

To install the frontend dependencies, run:

```bash
./install_frontend_dependencies.sh
```

This script uses sudo. Make sure it is installed and configured.
Alternatively, under root:

```bash
./install_frontend_dependencies.sh root
```

Then, you can build the frontend:

```bash
./build_full_frontend.sh
```

## Build and rebuild a single app

You may want to build only an application and not the whole frontend.  
To do so, run the build script in the desired app.

If you want to build `frontend`:

```bash
cd frontend
./build_frontend.sh
```

If you want to build `frontend_lib`:

```bash
cd frontend_lib
./build_frontend_lib.sh
```

If you want to build any other app `frontend_app_<app_name>`
```bash
cd frontend_app_<app_name>
./build_app.sh
```

## Development build

### Build dev command

Use same command as production build with option `-d` to build in development mode.
It removes minifaction and add linting warnings and sourcemaps

```bash
./build_full_frontend.sh -d
```
or, for example, for app file:
```bash
cd frontend_app_file
./build_app.sh -d
```

This allows for faster builds and better debugging.

To use dev server, see [servdev bellow](#with-development-server-servdev)


## Build technical information

### Basic

- save your modifications
- run `build_app.sh`

`build_app.sh` will build the app and copy everything (bundle and translations files) into the `frontend/dist/app` folder.

Once the script ends, refresh the browser's page to load your new app version (be careful with the cache).

### With development server (servdev)

#### Pre configuration

- Be logged in to the frontend with the global admin default user (so that the api doesn't return http status 401)
  - login: admin@admin.admin
  - password: admin@admin.admin
  - _(optional) if you need to be logged in with a different user, see [below](#run-servdev-with-a-different-user)_
- Update your `debug.js` file to match your local database. See [below](#update-debugjs-for-servdev)
- update `cors.access-control-allowed-origin` from `backend/development.ini` to add the app's dev server address
  - This address is available in `webpack.servdev.config.js` in the property `devServer.port`
  - exemple for app File: `http://localhost:8075`

#### Run the server

From any app (frontend, frontend_app_file, frontend_lib, ...)

```bash
yarn run servdev
```

It will create a web server (using webpack-dev-server) where you will see the app loaded with some default values.

Its address is `localhost` and its port is in the `webpack.servdev.config.js` file of the app at the property `devServer.port`

The configuration file `debug.js` will be used, following the `debug.sample.js` template file.

#### Update debug.js for servdev

To adapt the configuration to your local database, you need to create the required data for test using Tracim's frontend interface
> See the respective app's README.md for details, part "Specific `debug.js` configuration"

### Run servdev with a different user

> Only useful for app's servdev

Login with that user in the frontend.

Add the `loggedUser` property at the root of your `debug.js` and update the properties you need.

Keep the `...defaultDebug.loggedUser` to avoid missing a required property.

Example for frontend_app_file/src/debug.js:

```javascript
import { defaultDebug } from 'tracim_frontend_lib'

export const updatedDebugExample = {
  ...debug,
  loggedUser: {
    ...defaultDebug.loggedUser,
    agendaUrl: '',
    authType: 'internal',
    avatarUrl: null,
    config: {},
    created: '2020-10-15T10:41:03Z',
    email: 'admin@admin.admin',
    isActive: true,
    isDeleted: false,
    lang: 'fr',
    logged: true,
    profile: 'administrators',
    publicName: 'Global manager',
    timezone: '',
    userId: 1,
    userRoleIdInWorkspace: 8,
    username: 'TheAdmin'
  }
}
```

## More information about available yarn scripts

See [yarn_script](/docs/development/advanced/yarn_scripts.md)
