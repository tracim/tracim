module.exports = require('./webpack.config.js')
module.exports.externals = require('tracim_frontend_vendors/dist/externals.json')
delete module.exports.performance.hints

Object.assign(module.exports.output, {
  libraryTarget: 'var',
  filename: module.exports.mode === 'production' ? 'tracim_frontend_lib.tracim.[name].js' : 'tracim_frontend_lib.tracim.[name].dev.js'
})
