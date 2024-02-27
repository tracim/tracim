const path = require('path')

module.exports = require('./webpack.optimized.config.js')
module.exports.entry = './src/index.dev.js'
delete module.exports.output.library

module.exports.devServer = {
  client: {
    overlay: {
      errors: true,
      warnings: false
    },
    progress: true
  },
  compress: false,
  proxy: { '/api': 'http://localhost:7999' },
  historyApiFallback: true,
  host: 'localhost',
  hot: true,
  port: 8076,
  static: {
    directory: path.resolve(__dirname, 'dist/'),
    watch: true
  }
}
