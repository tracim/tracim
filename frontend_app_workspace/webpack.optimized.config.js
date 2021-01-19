module.exports = require('./webpack.config.js')

const optimizedVendors = {}
for (const dep of require('tracim_frontend_vendors/dist/list.js')) {
  optimizedVendors[dep] = `tracim_frontend_vendors['${dep}']`
}

module.exports.output.filename = 'workspace.app.js'
module.exports.externals = {
  tracim_frontend_lib: 'tracim_frontend_lib.lib',
  ...optimizedVendors
}
