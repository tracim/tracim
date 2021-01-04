# Tracim lib

This library groups the components shared across Tracim frontend and the Tracim frontend apps.

It can be built in two different ways:

- Optimized bundle: a script to be inserted in an HTML page using the a `<script>` tag, without the shared vendors. This is the default usage for Tracim.
- Standalone bundle: a script that can be published on NPM and used by external apps

# Optimized build, without shared dependencies

This build can be included using a `<script>` tag.
It does not come with all its dependencies.
Some of them are in the `tracim_frontend_vendors` bundle.
The point of this way of building is to share the `tracim_fontend_lib` and common `dependencies` across the frontend, the apps and the lib in Tracim.

The build can be used from a package (a Tracim frontend app) by accessing the global variable `tracim_frontend_lib` or in a package built with Webpack as long as:

- `tracim_frontend_lib` is listed in the `externals` property of the Webpack configuration
- all the libraries in `tracim_frontend_vendors` are also listed in `externals`
- `tracim_frontend_vendors` and `tracim_frontend_libs` are included using the `<script>` tag before the app is loaded. In this configuration, `tracim_frontend_lib` expects the global object `tracim_frontend_vendors` to be available.

This can be done by using the `externals.json` file built when bundling `tracim_frontend_vendors`.

Run:

    yarn run buildwithextvendors

This will produce two scripts:
- `dist/tracim_frontend_lib.tracim.lib.js`: the library part, declaring the `tracim_fontend_lib` global variable
- `dist/tracim_frontend_lib.tracim.style.js`: the styling part

The Webpack configuration used to build tracim_frontend_lib this way `webpack.optimized.config.js`.

## When to use this bundle

This bundle should be used when building a Tracim app for Tracim.

### Pros
- it is lighter: some dependencies are externals therefore, not in the bundle
- it builds faster: since it is lighter

### Cons
- It declares a global variable tracim_frontend_lib: that the Tracim's apps expect (when built with `yarn run buildoptimized`)
- It must be used with the tracim_vendors feature: it is the features that merge the shared dependencies


# Building as a standalone module

The standalone module can be used in external Tracim apps as an UMD module.
It includes all its dependencies, is self-contained, and can be imported using
`require('tracim_frontend_lib')` or `import ... from 'tracim_frontend_lib'`.

Run:

    yarn run build

This will produce two UMD modules:
- `dist/tracim_frontend_lib.lib.js`: the library part
- `dist/tracim_frontend_lib.style.js`: the styling part

The Webpack configuration used to build the standalone bundle is `webpack.config.js`.

## When to use this bundle

This bundle should be used for using Tracim lib's features outside of Tracim.

### Pros
- it is a conventional build
- it is exported as a UMD module

### Cons
- it cannot use the tracim_vendors feature: so it will bundle dependencies that are already available in Tracim


# Frontend unit tests

Frontend unit tests uses the standalone bundle, hence the need to build it when building the full frontend.
Using the optimized build which does not include the shared vendors does not work: `tracim_frontend_lib` needs to be compatible with CommonJS, and needs to access its dependencies. It is, however, impossible to make a `tracim_frontend_vendors` global object available for `tracim_frontend_lib` when using CommonJS modules, since their is no global namespace shared between the modules (in Node.js at least).

# Building a Tracim app using `tracim_fontend_lib`

In the code of your app, use `import ... from tracim_fontend_lib` to import the library (or `require('tracim_fontend_lib')`).

In its webpack configuration, either use the bundle, which is the default entry point of `tracim_fontend_lib`, or use the browser library:

 - declare `tracim_fontend_lib` and the optimized vendors in the `externals` field of the Webpack configuration of the app.
   See [../frontend_app_file/webpack.optimized.config.js](../frontend_app_file/webpack.optimized.config.js) for an example.
 - include `tracim_fontend_lib` and `tracim_fontend_vendors` in the HTML pages where the app is used:

    ```html
    <script src='./app/tracim_frontend_vendors.js'></script>
    <script src='./app/tracim_frontend_lib.lib.js'></script>
    ```

Apps in the Tracim project need to support both methods, using separate Webpack configurations.

# yarn scripts list

## yarn run buildtracimlib

- It builds both Tracim lib bundles, for Tracim and for unit tests
- It is the script you should use

## yarn run buildtracimlib-dev

- Identical to `buildtracimlib` but with less code obfuscation
- Is faster than `buildtracimlib` (less processing)
- Useful for debugging

## yarn run build

- Build the Standlone bundle
- Is faster than `buildtracimlib`
- Useful for unit testing your most recent changes
- Don't expect to see your most recent changes in Tracim after running this scripts. Tracim won't use the version you just built

## yarn run build-dev

- Identical to `build` but with less code obfuscation
- Is faster than `build` (less processing)
- Useful for debugging

## yarn run buildoptimized

- Build the Optimized bundle
- Is faster than `buildtracimlib`
- Useful for testing your most recent changes in Tracim
- Don't run unit tests after running this script, the tests won't run on the version you just built

## yarn run buildoptimized-dev

- Identical to `buildoptimized` but with less code obfuscation
- Is faster than `buildoptimized` (less processing)
- Useful for debugging

## yarn run build-translation

- Build the translation files
- It will add any new translation keys and eventuallt remove the ones than doesn't exists anymore
- see [frontend/doc/i18n.md](../frontend/doc/i18n.md)
- Must be run before pushing modifications to the displayed texts of the app

## yarn run lint

- Run the linting on any source files in the folders `src/` and `test/`

## yarn run test

- Run the linting and run the tests from the `test/` folder
- This command must be run without any errors before pushing code modifying this library

## yarn run test:quick

- Run the tests from the `test/` folder
- Is faster than `yarn run test` since it doesn't run the linting
- Is useful for unit test debug

___

### Before pushing changes to this library, you must

###### Run the script for linting and unit tests without any errors

    yarn run test

###### Run the translation generation script and update any values marked `__NOT_TRANSLATED__` at least in the english translation ([here](./i18next.scanner/en/translation.json)). Notify your PR if some translations are missing

    yarn run build-translation
