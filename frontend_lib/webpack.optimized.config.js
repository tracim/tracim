module.exports = require('./webpack.standalone.config.js')

const optimizedVendors = {}
for (const dep of require('tracim_frontend_vendors/dist/list.js')) {
    optimizedVendors[dep] = `tracim_frontend_vendors['${dep}']`
}

module.exports.externals = optimizedVendors

Object.assign(module.exports.output, {
  libraryTarget: 'var',
  filename: 'tracim_frontend_lib.optimized.[name].js'
})
