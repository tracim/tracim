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

 - Building `externals.json`, containing the line used in the `externals` Webpack property of each frontend component.
   This line is an object containing a key:value pair for each package in the form:

     'require-string': 'tracim_frontend_vendors["require-string"]'

   This line tells Webpack to find the package in the `tracim_frontend_vendors` global object, which is added.
   `externals.json is built by the script `src/build-externals-and-require-file.js` using `bundle.json`.
   by importing `tracim_frontnend_vendors.js` in Tracim using a script tag.

 - Building `tracim_frontnend_vendors.js`,from `require-file.js`, itself also built by `src/build-externals-and-require-file.js`.
   This script exports every packages listed  in `bundle.json`.
