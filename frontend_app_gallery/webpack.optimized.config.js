module.exports = require('./webpack.config.js')
module.exports.externals = { tracim_frontend_lib: 'tracim_frontend_lib.lib', ...Object.fromEntries(Object.keys(require('tracim_frontend_vendors')).map(dep => [dep, "tracim_frontend_vendors['" + dep + "']"])) }
