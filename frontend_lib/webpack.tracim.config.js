module.exports = require('./webpack.config.js')
module.exports.externals = require('tracim_frontend_vendors/dist/externals.json')

Object.assign(module.exports.output, {
  libraryTarget: 'var',
  library: 'tracim_frontend_[name]', // this allows tracim_frontend_lib.tracim.style.js not to rewrite the tracim_frontend_lib global object
  filename: module.exports.mode === 'production' ? 'tracim_frontend_lib.tracim.[name].js' : 'tracim_frontend_lib.tracim.[name].dev.js',
  umdNamedDefine: undefined
})
