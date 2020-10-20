const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

console.log('isProduction : ', isProduction)

const PnpWebpackPlugin = require('pnp-webpack-plugin')

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: isProduction
    ? './src/index.js' // only one instance of babel-polyfill is allowed
    : ['./src/index.dev.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'agenda.app.js' : 'agenda.app.dev.js',
    pathinfo: !isProduction,
    library: isProduction ? 'appAgenda' : undefined,
    libraryTarget: isProduction ? 'var' : undefined
  },
  externals: {},
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    proxy: { '/api': 'http://127.0.0.1:7999' },
    host: '0.0.0.0',
    port: 8078,
    hot: true,
    noInfo: true,
    overlay: {
      warnings: false,
      errors: true
    },
    historyApiFallback: true
  },
  devtool: isProduction ? false : 'cheap-module-source-map',
  performance: {
    hints: false
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      enforce: 'pre',
      use: 'standard-loader',
      exclude: [/node_modules/, /frontend_lib/]
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
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.styl$/,
      use: ['style-loader', 'css-loader', 'stylus-native-loader']
    }, {
      test: /\.(jpg|png|svg|gif)$/,
      loader: 'url-loader'
    }, {
      test: /\.(eot|woff|ttf)$/,
      loader: 'url-loader'
    }]
  },
  resolve: {
    plugins: [
      PnpWebpackPlugin,
    ],
    alias: {
      // Make ~tracim_frontend_lib work in stylus files
      '~tracim_frontend_lib': path.dirname(path.dirname(require.resolve('tracim_frontend_lib')))
    },
    extensions: ['.js', '.jsx']
  },
  resolveLoader: {
    plugins: [
      PnpWebpackPlugin.moduleLoader(module),
    ],
  },
  plugins: [
    ...[], // @INFO - CH - 2019/04/01 - generic plugins always present
    ...(isProduction
      ? [] // @INFO - CH - 2019/04/01 - production specific plugins
      : [] // @INFO - CH - 2019/04/01 - development specific plugins
    )
  ]
}
