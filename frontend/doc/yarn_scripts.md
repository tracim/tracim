Available yarn scripts
======================

These commands can be executed from any folders starting by `frontend` except `frontend_vendors` and `frontend_lib`.  
Example: `frontend/`, `frontend_app_file/`, `frontend_app_agenda/`, `frontend_app_workspace/` ...

### build the app - Standalone build

    yarn run build

- Build the app as standalone app including all its dependencies
- Uses the local `webpack.config.js`
- You might not need this script

### build Tracim the app Standalone for debugging

     yarn run build-dev

- Identical to `build` but with less code obfuscation
- Is faster than `build` (less processing)
- Include sourcemaps
- Useful for debugging

### build the app without shared dependencies - Optimized build

    yarn run buildoptimized

- Build the app including only its specific dependencies
- Uses the merge dependencies feature of Tracim (see `frontend_vendors` folder)
- Uses the local webpack.optimized.config.js
- Is the script used by `build_[appName].sh` files

### build Tracim lib Optimized for debugging

     yarn run buildoptimized-dev

- Identical to `buildoptimized` but with less code obfuscation
- Is faster than `buildoptimized` (less processing)
- Include sourcemaps
- Useful for debugging

### build the translation files

    yarn run build-translation

- Build the translation files
- It will add any new translation keys and remove unseen one
- see [./i18n.md](./i18n.md)
- Must be run before pushing modifications to the displayed texts of the app

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

