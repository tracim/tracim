#!/usr/bin/env sh

# INFO - RJ - 2020-05-10 This is a hack to make frontend unit test work.
# There is no way to include the vendor dependencies from there
# to we prepend them to the tracim frontend lib.
# at this point, the unaltered lib has already been copied to the frontend
# we also append an export directive so the tracim lib can be imported from
# node as a regular module.

mv dist/tracim_frontend_lib.lib.js dist/tracim_frontend_lib.lib.js.orig
cat ../frontend_vendors/dist/vendors.js > dist/tracim_frontend_lib.lib.js
echo >> dist/tracim_frontend_lib.lib.js
cat dist/tracim_frontend_lib.lib.js.orig >> dist/tracim_frontend_lib.lib.js
echo "module.exports = tracim_frontend_lib" >> dist/tracim_frontend_lib.lib.js
rm dist/tracim_frontend_lib.lib.js.orig
