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
It does not come with all its dependencies which makes it smaller.
Some of them are in the `tracim_frontend_vendors` bundle.  
This is the build used in Tracim's default configuration.

The build and its functions can be used by accessing the global variable `tracim_frontend_lib` or in a package built with Webpack as long as:

- `tracim_frontend_lib` is listed in the `externals` property of the Webpack configuration
- all the libraries in `tracim_frontend_vendors` are also listed in `externals`
- `tracim_frontend_vendors` and `tracim_frontend_lib` are included using the `<script>` tag before the app is loaded.
  - In this configuration, `tracim_frontend_lib` expects the global object `tracim_frontend_vendors` to be available.
  - This can be done by using the `externals.json` file built when bundling `tracim_frontend_vendors`.
  
Note: All the above is already configured for Tracim's `optimized` bundles.

Run:

    ./build_frontend_lib.sh

This shell script accept `-d` to bypass obfuscation and minification to help debugging.

This will produce two scripts:
- `dist/tracim_frontend_lib.lib.optimized.js`: the library part
- `dist/tracim_frontend_lib.style.optimized.js`: the styling part

The Webpack configuration used to build the optimized bundle is [webpack.optimized.config.js](./webpack.optimized.config.js).

#### Pros
- it is smaller: some dependencies are externals thus not in the bundle
- it builds faster: since it is lighter

#### Cons
- It declares a global variable tracim_frontend_lib that the Tracim apps expect (when they are built as `optimized`)
- It must be used with the `tracim_vendors` feature: it is the features that merge the shared dependencies

## Standalone build

The standalone module can be used in external apps as a UMD module.  
It includes all its dependencies, is self-contained, and can be imported using
`require('tracim_frontend_lib')` or `import {...} from 'tracim_frontend_lib'`.

Run:

    yarn run build:standalone

Or, to bypass obfuscation and minification

    yarn run build:standalone:dev

This will produce two UMD modules:
- `dist/tracim_frontend_lib.lib.js` is the library part
- `dist/tracim_frontend_lib.style.js` is the styling part (css)

The Webpack configuration used is [webpack.standalone.config.js](./webpack.standalone.config.js).

#### Pros
- it is the conventional build way for js libraries
- it is exported as a UMD module

#### Cons
- it cannot use the tracim_vendors feature. So it will bundle dependencies that are already available in Tracim


## Using servdev

You can develop and test your components directly in frontend_lib servdev (development server) without the need to test
them in another app.

#### To do so

Servdev uses the file `src/index.dev.js` which is created by running `./build_frontend_lib.sh`.

If you have run `build_full_frontend.sh` at the root of the repository, the file should already exists.

Update `src/index.dev.js` with your component and give it some static props.

`src/index.dev.js` is in the `.gitignore` so don't worry about modifying it.

Run

    yarn run servdev

connect to `http://localhost:8070`
