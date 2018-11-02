const webpack = require('webpack')
const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'
const dashboardPlugin = require('webpack-dashboard/plugin')

module.exports = {
  entry: {
    app: ['babel-polyfill', 'whatwg-fetch', './src/index.js'],
    vendor: [
      'babel-plugin-transform-class-properties',
      'babel-plugin-transform-object-assign',
      'babel-plugin-transform-object-rest-spread',
      'babel-polyfill',
      // 'lodash.pull',
      // 'lodash.reject',
      // 'lodash.uniqby',
      'react',
      'react-dom',
      'react-redux',
      'react-router-dom',
      // 'react-select',
      'redux',
      'redux-logger',
      // 'redux-saga',
      'redux-thunk',
      'whatwg-fetch',
      'classnames'
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist/assets'),
    filename: 'tracim.app.entry.js',
    pathinfo: !isProduction,
    publicPath: '/assets/'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
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
  },
  devtool: isProduction ? false : 'cheap-module-source-map',
  module: {
    rules: [{
      test: /\.jsx?$/,
      enforce: 'pre',
      use: 'standard-loader',
      exclude: [/node_modules/]
    }, {
      test: [/\.js$/, /\.jsx$/],
      loader: 'babel-loader',
      options: {
        presets: ['env', 'react'],
        plugins: ['transform-object-rest-spread', 'transform-class-properties', 'transform-object-assign']
      },
      exclude: [/node_modules/]
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.styl$/,
      use: ['style-loader', 'css-loader', 'stylus-loader']
    }, {
      test: /\.(jpg|png|svg)$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
        outputPath: 'images/', // asset/ is in output.path
        limit: 2000
      }
    }]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins:[
    ...[ // generic plugins always present
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        filename: 'tracim.vendor.bundle.js'
      })
      // new dashboardPlugin()
    ],
    ...(isProduction
      ? [ // production specific plugins
        new webpack.DefinePlugin({
          'process.env': { 'NODE_ENV': JSON.stringify('production') }
        }),
        new webpack.optimize.UglifyJsPlugin({
          compress: { warnings: false }
        })
      ]
      : [] // development specific plugins
    )
  ]
}
