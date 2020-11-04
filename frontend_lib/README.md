# Tracim lib

This library groups the components shared across Tracim frontend and the Tracim frontend apps.

It can be built in two different ways:

- as a standalone module, that could be published on NPM and used by external apps
- as a script to be inserted in an HTML page using the a `<script>` tag, without the shared vendors. This is what is used for Tracim.

# Building as a standalone bundle

The standalone bundle can be used in external Tracim apps as an UMD module.
It includes all its dependencies, is self-contained, and can be imported using
`require('tracim_frontend_lib')` or `import ... from 'tracim_frontend_lib'`.

Run:

    yarn run build

This will produce two UMD modules:
- `dist/tracim_frontend_lib.lib.js`: the library part
- `dist/tracim_frontend_lib.style.js`: the styling part

The Webpack configuration used to build the standalone bundle is `webpack.config.js`.

## When to use this bundle

This bundle should be used when building a Tracim app outside of Tracim.

# Building without shared vendors, using externals

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

This will produce two scripst:
- `dist/tracim_frontend_lib.tracim.lib.js`: the library part, declaring the `tracim_fontend_lib` global variable
- `dist/tracim_frontend_lib.tracim.style.js`: the styling part

The Webpack configuration used to build tracim_frontend_lib this way `webpack.optimized.config.js`.

## When to use this bundle

This bundle should be used when building a Tracim app for Tracim.

# Frontend unit tests

Frontend unit tests use the standalone bundle, hence the need to build it when building the full frontend.
Using the tracim_frontend_lib build which does not include the shared vendors does not work: `tracim_frontend_lib` needs to be compatible with CommonJS, and needs to access its dependencies. It is, however, impossible to make a `tracim_frontend_vendors` global object available for `tracim_frontend_lib` when using CommonJS modules, since their is no global namespace shared between the modules (in Node.js at least).

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
