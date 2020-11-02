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
      // RJ - 2020-11-02 - NOTE
      //
      // This function intercepts all the calls to require.
      // It replaces require calls to libraries by the variable this.
      // This is needed because these libraries assume a browser and break
      // when run in webpack.

      //  Parameters:
      //   - request  - the string that was passed to require
      //   - callback - the function used to tell how to resolve this dependency
      //     - callback() says: resolve this dependency as usual
      //     - callback(null, 'var this') says: use variable 'this' for this
      //       dependency.

      if (request === './index.js' || request === './src/list.js') {
        return callback()
      }

      return callback(null, 'var this')
    }
  ]
}
