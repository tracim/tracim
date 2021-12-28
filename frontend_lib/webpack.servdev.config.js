const path = require('path')
module.exports = require('./webpack.optimized.config.js')

module.exports.entry.lib = './src/index.dev.js'
module.exports.output.library = undefined

module.exports.devServer = {
  contentBase: path.join(__dirname, 'dist/'),
    proxy: { '/api': 'http://127.0.0.1:7999' },
  port: 8070,
    hot: true,
    noInfo: true,
    overlay: {
    warnings: false,
      errors: true
  },
  historyApiFallback: true
  // headers: {
  //   'Access-Control-Allow-Origin': '*'
  // }
}
