# App File for Tracim

This repo is an app loaded by Tracim.

Its installation and build are handled by `install_frontend_dependencies.sh` and `build_full_frontend.sh`.

See README.md at the root of the repository.

### Development

#### Basic
- save your modifications
- run `build_file.sh`

`build_file.sh` will build the app and its translations files and copy everything into the frontend/dist/app folder.
Once the script is done, reload the frontent which will load your new app version (careful for cache).

#### With development server
To use the development server, you need to:
- be logged in to the frontend with the global admin default user (so that the api doesn't return http status 401)
  - login: admin@admin.admin
  - password: admin@admin.admin
  - (optional) if you need to be logged with a different user, see bellow
- update your `debug.js` file. See bellow
- run `yarn run servdev`

It will create a web server (webpack-dev-server) where you will see the app loaded with some default values.

The configuration file `debug.js` will be used which follows the template of the file `debug.sample.js`.

##### Update debug.js for servdev
To adapt the configuration to your local database, you need to:
- create a content of type file (in any workspace) using the frontend's interface
- in `src/debug.js`, change:
  - `content_id` to the id of the content you just created
  - `workspace_id` to the id of the workspace you just created the content in

#### Run servdev with a different user
Login with that user in the frontend.

Add the `loggedUser` properties at the root of your `debug.js` and update the properties you need.

Keep the `...defaultDebug.loggedUser` to avoid missing a required properties.

Example:
```` js
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
