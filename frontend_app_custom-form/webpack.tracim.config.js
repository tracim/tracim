module.exports = require('./webpack.config.js')
module.exports.externals = { tracim_frontend_lib: 'tracim_frontend_lib.lib', ...require('tracim_frontend_vendors/dist/externals.json') }
