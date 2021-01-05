App Building
============

## Production

Its installation and building are respectively handled by [install_frontend_dependencies.sh](../../install_frontend_dependencies.sh) and [build_full_frontend.sh](../../build_full_frontend.sh).

See [README.md](../../README.md) at the root of the repository.

## Development

You must have run [install_frontend_dependencies.sh](../../install_frontend_dependencies.sh) before starting any build.

### Basic
- save your modifications
- run `build_[appName].sh`

`build_[appName].sh` will build the app and its translations files and copy everything into the `frontend/dist/app` folder.

Once the script ends, refresh the browser's page to load your new app version (be careful with the cache).

### With development server

#### Pre configuration

1. Be logged in to the frontend with the global admin default user (so that the api doesn't return http status 401)
    - login: admin@admin.admin
    - password: admin@admin.admin
    - _(optional) if you need to be logged in with a different user, see [below](#run-servdev-with-a-different-user)_
2. Update your `debug.js` file to match your local database. See [below](#update-debugjs-for-servdev)

#### Run the server

    yarn run servdev

It will create a web server (using webpack-dev-server) where you will see the app loaded with some default values.

Its address is `localhost` and its port is in the `webpack.config.js` file of the app at the property `devServer.port`

The configuration file `debug.js` will be used, following the `debug.sample.js` template file.

#### Update debug.js for servdev

To adapt the configuration to your local database, you need to create the required data for test using Tracim's frontend interface
> See the respective app's README.md for details, part "Specific `debug.js` configuration"

### Run servdev with a different user

Login with that user in the frontend.

Add the `loggedUser` property at the root of your `debug.js` and update the properties you need.

Keep the `...defaultDebug.loggedUser` to avoid missing a required properties.

Example:
```js
const updatedDebugExample = {
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
