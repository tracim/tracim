module.exports = require('./webpack.config.js')

const optimizedVendors = {}
for (const dep of Object.keys(require('tracim_frontend_vendors'))) {
    optimizedVendors[dep] = `tracim_frontend_vendors['${dep}']`
}

module.exports.externals = {
    tracim_frontend_lib: 'tracim_frontend_lib.lib',
    ...optimizedVendors
}
