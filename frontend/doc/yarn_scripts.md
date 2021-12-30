Available yarn scripts
======================

These commands can be executed from any folder starting by `frontend` except `frontend_vendors`.

Example: `frontend/`, `frontend_app_file/`, `frontend_app_agenda/`, `frontend_app_workspace/` ...

### build the app without shared dependencies - Optimized build

    yarn run build:optimized

- Build the app including only its specific dependencies
- Uses the merge dependencies feature of Tracim (see `frontend_vendors` folder)
- Uses the local webpack.optimized.config.js
- Is the script used by `build_app.sh` files

### build Tracim lib Optimized for debugging

     yarn run build:optimized:dev

- Identical to `buildoptimized` but with less code obfuscation
- Is faster than `buildoptimized` (less processing)
- Include sourcemaps
- Useful for debugging
- Is the script used by `build_app.sh -d` files using the `-d` option

### build the translation files

    yarn run build:translation

- Build the translation files
- It will add any new translation keys and remove unused one
- see [./i18n.md](./i18n.md)
- Must be run before pushing modifications to any text displayed in the app

### run the linting

    yarn run lint

- Run the linting on any source files in the folders `src/` and `test/`

### run all the tests

    yarn run test

- Run the linting and run the tests from the `test/` folder
- This command must be run without any errors before pushing code modifying this app

### run only the unit tests

    yarn run test:quick

- Run the tests from the `test/` folder
- Is faster than `yarn run test` since it doesn't run the linting
- Is useful for **unit** test debug

## Deprecated scripts

### build the app - Standalone build

    yarn run build:standalone

- Build the app as standalone app including all its dependencies
- Uses the local `webpack.config.standalone.js`

### build Tracim the app Standalone for debugging

     yarn run build:standalone:dev

- Identical to `build:standalone` but with less code obfuscation
- Is faster than `build:standalone` (less processing)
- Include sourcemaps
- Useful for debugging
