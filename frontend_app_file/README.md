App File for Tracim
===================

This folder is an app loaded by Tracim.

It is meant to handle Tracim contents of any format. Allowing renaming, download, status change, public share and modification. It also shows the history of the content. 

It will try to generate a jpeg preview of the uploaded file using [Preview Generator](https://github.com/algoo/preview-generator). See [here](https://github.com/algoo/preview-generator/blob/develop/doc/supported_mimetypes.rst) the list of currently handled file format by Preview Generator. 

This app also allow opening Collaborative documents.

## Production

Its installation and build are handled by [install_frontend_dependencies.sh](../install_frontend_dependencies.sh) and [build_full_frontend.sh](../build_full_frontend.sh).

See [README.md](../README.md) at the root of the repository.

## Development

### Basic
- save your modifications
- run `build_file.sh`

[build_file.sh](./build_file.sh) will build the app and its translations files and copy everything into the `frontend/dist/app` folder.

Once the script is done, reload the frontend which will load your new app version (careful for cache).

### With development server
To use the development server, you need to:
- be logged in to the frontend with the global admin default user (so that the api doesn't return http status 401)
  - login: admin@admin.admin
  - password: admin@admin.admin
  - (optional) if you need to be logged in with a different user, see [below](#run-servdev-with-a-different-user)
- update your `debug.js` file. See [below](#update-debug.js-for-servdev)
- run `yarn run servdev`

It will create a web server (using webpack-dev-server) where you will see the app loaded with some default values.

The configuration file `debug.js` will be used, following the `debug.sample.js` template file.

#### Update debug.js for servdev
To adapt the configuration to your local database, you need to:
- create a content of type file (in any workspace) using Tracim's frontend interface
- in `src/debug.js`, change:
  - `content.content_id` to the id of the content you just created
  - `content.workspace_id` to the id of the workspace you just created the content in

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

___

## Other available yarn scripts

### yarn run build

- Build the app as standalone app including all its dependencies
- Uses [webpack.config.js](./webpack.config.js)
- You might not need this script

### yarn run buildoptimized

- Build the app including only its specific dependencies
- Uses the merge dependencies feature of Tracim (see `frontend_vendors` folder)
- Uses [webpack.optimized.config.js](webpack.optimized.config.js)
- Is the script used by [build_file.sh](./build_file.sh)

### yarn run build-translation

- Build the translation files
- It will add any new translation keys and remove unseen one
- see [frontend/doc/i18n.md](../frontend/doc/i18n.md)
- Must be run before pushing modifications to the displayed texts of the app

### yarn run lint

- Run the linting on any source files in the folders `src/` and `test/`

### yarn run test

- Run the linting and run the tests from the `test/` folder
- This command must be run without any errors before pushing code modifying this app

### yarn run test:quick

- Run the tests from the `test/` folder
- Is faster than `yarn run test` since it doesn't run the linting
- Is useful for unit test debug

___

### Before pushing changes to this app, you must

###### Run the script for linting and unit tests without any errors

    yarn run test

###### Run the translation generation script and update any values marked `__NOT_TRANSLATED__` at least in the english translation ([here](./i18next.scanner/en/translation.json)). Notify your PR if some translations are missing

    yarn run build-translation
