const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  stats: process.env.VERBOSE === 'false' ? 'errors-warnings' : undefined,
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './dist/require-file.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'tracim_frontend_vendors.js' : 'tracim_frontend_vendors.dev.js',
    pathinfo: !isProduction,
    library: 'tracim_frontend_vendors',
    libraryTarget: 'var'
  },
  module: {
    rules: [ process.env.LINTING === "false" ? {} : {
      test: /\.jsx?$/,
      enforce: 'pre',
      use: 'standard-loader',
      exclude: [/node_modules/]
    }, {
      test: [/\.js$/, /\.jsx$/],
      exclude: [/node_modules/],
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-env',
          '@babel/preset-react'
        ],
        plugins: [
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-transform-object-assign'
        ]
      }
    }]
  },
  devtool: isProduction ? false : 'eval-cheap-module-source-map',
  performance: {
    hints: false
  }
}
