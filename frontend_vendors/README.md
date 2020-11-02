# Tracim vendors

This bundles includes the common dependencies used in the Tracim frontend, the Tracim frontend apps and `tracim_frontend_lib` in a global variable, `tracim_frontend_vendors`, so they are included once in Tracim.
This helps making Tracim faster to build, download and run.

# How to add a shared dependencies in this vendor bundle

1. Check that all the apps using this dependency use the same version
2. Do not remove it from these apps' list of dependencies in package.json
3. Add it to the dependencies of frontend_vendors's package.json
4. add the "require string", used to import the library (import statement or call to require) in src/bundle.json
5. yarn install
6. recompile the vendors and the apps using this library for the change to take effect.

# How does this work

Building the frontend vendors bundle is done by:

 - Building `dist/list.js`, containing the list used in the `externals` Webpack property of each frontend component. This tells Webpack to find the package in the `tracim_frontend_vendors` global object, which is added. See the `webpack.optimized.config.js` in a frontend app to see how it is used.
 - Building `dist/tracim_frontend_vendors.js`, suitable for inclusion in a script tag, containing the vendors listed in `src/index.js`.

Here is how the build process works:

 - `./build_vendors.sh` runs `yarn run build`
   - `build` compiles `dist/tracim_frontend_vendors.js` using the `libraryTarget: var` (suitable for inclusion with an HTML `<script>` tag) from `/src/index.js`, and then runs the `build-list` NPM script.
     - `build-list` builds `dist/list.js` from `src/list.js` using the `webpack.list.config.js` Webpack config file. `src/list.js` does `Object.keys(require('./index.js'))`, which produces the list of dependencies from the keys of the vendors object defined in `./index.js` as a Common JS module.

 - `./build_vendors.sh` copies `tracim_frontend_vendors.js` in `frontend/`
