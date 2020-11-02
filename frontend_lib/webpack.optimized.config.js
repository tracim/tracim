module.exports = require('./webpack.config.js')

const optimizedVendors = {}
for (const dep of require('tracim_frontend_vendors/dist/list.js')) {
    optimizedVendors[dep] = `tracim_frontend_vendors['${dep}']`
}

module.exports.externals = optimizedVendors

Object.assign(module.exports.output, {
  libraryTarget: 'var',
  filename: module.exports.mode === 'production' ? 'tracim_frontend_lib.tracim.[name].js' : 'tracim_frontend_lib.tracim.[name].dev.js'
})
