const path = require('path')
module.exports = require('./webpack.optimized.config.js')

module.exports.devServer = {
  contentBase: path.join(__dirname, 'dist/'),
  proxy: { '/api': 'http://127.0.0.1:7999' },
  host: '0.0.0.0',
  port: 8090,
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