const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

console.log('isProduction : ', isProduction)

const PnpWebpackPlugin = require('pnp-webpack-plugin')

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: isProduction
    ? './src/index.js' // only one instance of babel-polyfill is allowed
    : ['@babel/polyfill', './src/index.dev.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'workspace_advanced.app.js' : 'workspace_advanced.app.dev.js',
    pathinfo: !isProduction,
    library: isProduction ? 'appWorkspaceAdvanced' : undefined,
    libraryTarget: isProduction ? 'var' : undefined
  },
  externals: {},
  // isProduction ? { // Côme - since plugins are imported through <script>, cannot externalize libraries
  //   react: {commonjs: 'react', commonjs2: 'react', amd: 'react', root: '_'},
  //   'react-dom': {commonjs: 'react-dom', commonjs2: 'react-dom', amd: 'react-dom', root: '_'},
  //   classnames: {commonjs: 'classnames', commonjs2: 'classnames', amd: 'classnames', root: '_'},
  //   'prop-types': {commonjs: 'prop-types', commonjs2: 'prop-types', amd: 'prop-types', root: '_'},
  //   tracim_frontend_lib: {commonjs: 'tracim_frontend_lib', commonjs2: 'tracim_frontend_lib', amd: 'tracim_frontend_lib', root: '_'}
  // }
  // : {},
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    proxy: { '/api': 'http://127.0.0.1:7999' },
    host: '0.0.0.0',
    port: 8076,
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
  performance: {
    hints: false
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      enforce: 'pre',
      use: 'standard-loader',
      exclude: [/node_modules/, /frontend_lib/, /debug\.js/]
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
      test: /\.(jpg|png|svg)$/,
      loader: 'url-loader',
      options: {
        limit: 25000
      }
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
    ...[], // generic plugins always present
    ...(isProduction
      ? [] // production specific plugins
      : [] // development specific plugins
    )
  ]
}
