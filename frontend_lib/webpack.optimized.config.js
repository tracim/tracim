module.exports = require('./webpack.config.js')
module.exports.externals = Object.fromEntries(Object.keys(require('tracim_frontend_vendors')).map(dep => [dep, "tracim_frontend_vendors['" + dep + "']"]))

Object.assign(module.exports.output, {
  libraryTarget: 'var',
  filename: module.exports.mode === 'production' ? 'tracim_frontend_lib.tracim.[name].js' : 'tracim_frontend_lib.tracim.[name].dev.js'
})
