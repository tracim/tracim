const path = require('path')
module.exports = require('./webpack.optimized.config.js')

module.exports.entry.lib = './src/index.dev.js'
module.exports.output.library = undefined
module.exports.output.libraryTarget = undefined
module.exports.output.umdNamedDefine = undefined

module.exports.devServer = {
  client: {
    overlay: {
      errors: true,
      warnings: false
    },
    progress: true
  },
  compress: false,
  proxy: { '/api': 'http://127.0.0.1:7999' },
  historyApiFallback: true,
  hot: true,
  port: 8070,
  static: {
    directory: path.resolve(__dirname, 'dist/'),
  }
}
