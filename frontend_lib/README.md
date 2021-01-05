Tracim lib
==========

This library groups the components shared across Tracim frontend and the Tracim frontend apps.

It can be built in two different ways:

- [**Optimized build**](#optimized-build):
  - A script to be inserted in an HTML page using the a `<script>` tag
  - Build without the shared dependencies
  - The default usage for Tracim
- [**Standalone build**](#standalone-build):
  - a script that can be published on NPM and used by external apps
  - Build with every dependency
  - A UMD build

## Optimized build

This build can be included using a `<script>` tag.  
It does not come with all its dependencies which makes it lighter.  
Some of them are in the `tracim_frontend_vendors` bundle.  
This is the build used in Tracim's default configuration.

The build and its functions can be used by accessing the global variable `tracim_frontend_lib` or in a package built with Webpack as long as:

- `tracim_frontend_lib` is listed in the `externals` property of the Webpack configuration
- all the libraries in `tracim_frontend_vendors` are also listed in `externals`
- `tracim_frontend_vendors` and `tracim_frontend_libs` are included using the `<script>` tag before the app is loaded.
  - In this configuration, `tracim_frontend_lib` expects the global object `tracim_frontend_vendors` to be available.
  - This can be done by using the `externals.json` file built when bundling `tracim_frontend_vendors`.

Run:

    yarn run buildoptimized

This will produce two scripts:
- `dist/tracim_frontend_lib.tracim.lib.js`: the library part, declaring the `tracim_fontend_lib` global variable
- `dist/tracim_frontend_lib.tracim.style.js`: the styling part

The Webpack configuration used is [webpack.optimized.config.js](./webpack.optimized.config.js).

You may include the source maps using the following command:

    yarn run buildoptimized-dev

### When to use this bundle

This bundle should be used when building an app to be used inside Tracim.

#### Pros
- it is lighter: some dependencies are externals therefore, not in the bundle
- it builds faster: since it is lighter

#### Cons
- It declares a global variable tracim_frontend_lib: that the Tracim apps expect (when they are build with `yarn run buildoptimized`)
- It must be used with the tracim_vendors feature: it is the features that merge the shared dependencies


## Standalone build

The standalone module can be used in external apps as a UMD module.  
It includes all its dependencies, is self-contained, and can be imported using
`require('tracim_frontend_lib')` or `import ... from 'tracim_frontend_lib'`.

Run:

    yarn run build

This will produce two UMD modules:
- `dist/tracim_frontend_lib.lib.js` is the library part
- `dist/tracim_frontend_lib.style.js` is the styling part (css)

The Webpack configuration used is [webpack.config.js](./webpack.config.js).

### When to use this bundle

This bundle should be used for using Tracim lib's features outside Tracim.

#### Pros
- it is a conventional build
- it is exported as a UMD module

#### Cons
- it cannot use the tracim_vendors feature. So it will bundle dependencies that are already available in Tracim


## Frontend unit tests

Frontend unit tests uses the standalone build, hence the need to build it when running [build_full_frontend.js](../build_full_frontend.js).  
Using the optimized build which does not include the shared vendors does not work: `tracim_frontend_lib` needs to be compatible with CommonJS, and needs to access its dependencies. It is, however, impossible to make a `tracim_frontend_vendors` global object available for `tracim_frontend_lib` when using CommonJS modules, since there is no global namespace shared between the modules (in Node.js at least).

## Building a Tracim app that uses `tracim_fontend_lib`

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

## yarn scripts list

### build Tracim lib

     yarn run buildtracimlib

- It builds both Tracim lib bundles, for Tracim and for unit tests
- It is the script you should use

### build Tracim lib for debugging

     yarn run buildtracimlib-dev

- Identical to `buildtracimlib` but with less code obfuscation
- Is faster than `buildtracimlib` (less processing)
- Useful for debugging

### build Tracim lib Standalone

     yarn run build

- Is faster than `buildtracimlib`
- Useful for **unit** testing your most recent changes
- Don't expect to see your most recent changes in Tracim after running this scripts. Tracim won't use the version you just built

### build Tracim lib Standalone for debugging

     yarn run build-dev

- Identical to `build` but with less code obfuscation
- Is faster than `build` (less processing)
- Useful for debugging

### build Tracim lib Optimized

     yarn run buildoptimized

- Is faster than `buildtracimlib`
- Useful for testing your most recent changes in Tracim
- Don't run unit tests after running this script, the tests won't run on the version you just built

### build Tracim lib Optimized for debugging

     yarn run buildoptimized-dev

- Identical to `buildoptimized` but with less code obfuscation
- Is faster than `buildoptimized` (less processing)
- Useful for debugging

### build the translation files

     yarn run build-translation

- It will add any new translation keys and eventually remove the ones than doesn't exists anymore
- see [frontend/doc/i18n.md](../frontend/doc/i18n.md)
- Must be run before pushing modifications to the displayed texts

### run the linting

     yarn run lint

- Run the linting on any source files in the folders `src/` and `test/`

### run all the tests

     yarn run test

- Run the linting and run the tests from the `test/` folder
- This command must be run without any errors before pushing code modifying this library

### run only the unit tests

     yarn run test:quick

- Run the tests from the `test/` folder
- Is faster than `yarn run test` since it doesn't run the linting
- Is useful for unit test debug

___

### Before pushing changes to this app, you must

see [frontend/doc/before_push.md](../frontend/doc/before_push.md)
