const path = require('path')

module.exports = {
  entry: {
    main: './src/list.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'list.js',
    libraryTarget: 'commonjs2'
  },
  externals: [
    (context, request, callback) => {
      if (request.startsWith('./')) return callback()
      return callback(null, 'var this')
    }
  ]
}
