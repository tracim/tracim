# Available yarn scripts

These commands can be executed from any folder starting by `frontend` except `frontend_vendors`.

Example: `frontend/`, `frontend_app_file/`, `frontend_app_agenda/`, `frontend_app_workspace/` ...

## build the app without shared dependencies - Optimized build

```bash
yarn run build:optimized
```

- Build the app including only its specific dependencies
- Uses the merge dependencies feature of Tracim (see `frontend_vendors` folder)
- Uses the local webpack.optimized.config.js
- Is the script used by `build_app.sh` files

## build Tracim lib Optimized for debugging

```bash
yarn run build:optimized:dev
```

- Identical to `buildoptimized` but with less code obfuscation
- Is faster than `buildoptimized` (less processing)
- Include sourcemaps
- Useful for debugging
- Is the script used by `build_app.sh -d` files using the `-d` option

## build the translation files

```bash
yarn run build:translation
```

- Build the translation files
- It will add any new translation keys and remove unused one
- see [./i18n.md](/docs/development/i18n/i18n-frontend.md)
- Must be run before pushing modifications to any text displayed in the app

## run the linting

```bash
yarn run lint
```

- Run the linting on any source files in the folders `src/` and `test/`

## run all the tests

```bash
yarn run test
```

- Run the linting and run the tests from the `test/` folder
- This command must be run without any errors before pushing code modifying an app

## run only the unit tests

```bash
yarn run test:quick
```

- Run the tests from the `test/` folder
- Is faster than `yarn run test` since it doesn't run the linting
- Is useful for __unit__ test debug

## Deprecated scripts

### build the app - Standalone build

```bash
yarn run build:standalone
```

- Build the app as standalone app including all its dependencies
- Uses the local `webpack.standalone.config.js`

### build the app Standalone for debugging

```bash
yarn run build:standalone:dev
```

- Identical to `build:standalone` but with less code obfuscation
- Is faster than `build:standalone` (less processing)
- Include sourcemaps
- Useful for debugging
