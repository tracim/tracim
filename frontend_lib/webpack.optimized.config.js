module.exports = require('./webpack.config.js')

const optimizedVendors = {}
for (const dep of Object.keys(require('tracim_frontend_vendors'))) {
    optimizedVendors[dep] = `tracim_frontend_vendors['${dep}']`
}

module.exports.externals = optimizedVendors

Object.assign(module.exports.output, {
  libraryTarget: 'var',
  filename: module.exports.mode === 'production' ? 'tracim_frontend_lib.tracim.[name].js' : 'tracim_frontend_lib.tracim.[name].dev.js'
})
