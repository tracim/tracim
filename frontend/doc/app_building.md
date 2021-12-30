App Building
============

## Production

Its installation and building are respectively handled by [install_frontend_dependencies.sh](../../install_frontend_dependencies.sh) and [build_full_frontend.sh](../../build_full_frontend.sh).

See [README.md](../../README.md) at the root of the repository.

## Development

You must run [install_frontend_dependencies.sh](../../install_frontend_dependencies.sh) before starting any build.

### Basic
- save your modifications
- run `build_app.sh`

`build_app.sh` will build the app and copy everything (bundle and translations files) into the `frontend/dist/app` folder.

Once the script ends, refresh the browser's page to load your new app version (be careful with the cache).

### With development server (servdev)

#### Pre configuration

1. Be logged in to the frontend with the global admin default user (so that the api doesn't return http status 401)
    - login: admin@admin.admin
    - password: admin@admin.admin
    - _(optional) if you need to be logged in with a different user, see [below](#run-servdev-with-a-different-user)_
2. Update your `debug.js` file to match your local database. See [below](#update-debugjs-for-servdev)
3. update `cors.access-control-allowed-origin` from `backend/development.ini` to add the app's dev server address
   - This address is available in `webpack.servdev.config.js` in the property `devServer.port`
   - exemple for app File: `http://localhost:8075`

#### Run the server
From any app (frontend, frontend_app_file, frontend_lib, ...)

    yarn run servdev

It will create a web server (using webpack-dev-server) where you will see the app loaded with some default values.

Its address is `localhost` and its port is in the `webpack.servdev.config.js` file of the app at the property `devServer.port`

The configuration file `debug.js` will be used, following the `debug.sample.js` template file.

#### Update debug.js for servdev

To adapt the configuration to your local database, you need to create the required data for test using Tracim's frontend interface
> See the respective app's README.md for details, part "Specific `debug.js` configuration"

### Run servdev with a different user (only useful for app's servdev)

Login with that user in the frontend.

Add the `loggedUser` property at the root of your `debug.js` and update the properties you need.

Keep the `...defaultDebug.loggedUser` to avoid missing a required property.

Example for frontend_app_file/src/debug.js:
```js
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
