const webpack = require('webpack')
const path = require('path')
const glob = require('glob')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    libJs: isProduction ? './src/index.js' : './src/index.dev.js',
    libStyle: glob.sync('./src/**/*.styl')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'tracim_frontend_lib.js' : 'tracim_frontend_lib.dev.js',
    pathinfo: !isProduction,
    library: isProduction ? 'tracim_frontend_lib' : undefined,
    libraryTarget: isProduction ? 'umd' : undefined,
    umdNamedDefine: isProduction ? true : undefined
  },
  externals: isProduction
    ? {
      react: {commonjs: 'react', commonjs2: 'react', amd: 'react', root: '_'},
      'react-dom': {commonjs: 'react-dom', commonjs2: 'react-dom', amd: 'react-dom', root: '_'},
      'react-i18next': {commonjs: 'react-i18next', commonjs2: 'react-i18next', amd: 'react-i18next', root: '_'},
      classnames: {commonjs: 'classnames', commonjs2: 'classnames', amd: 'classnames', root: '_'},
      'prop-types': {commonjs: 'prop-types', commonjs2: 'prop-types', amd: 'prop-types', root: '_'},
      radium: {commonjs: 'radium', commonjs2: 'radium', amd: 'radium', root: '_'}
    }
    : {},
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
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
  },
  devtool: isProduction ? false : 'cheap-module-source-map',
  module: {
    rules: [
      isProduction
      ? {}
      : {
      test: /\.jsx?$/,
      enforce: 'pre',
      use: 'standard-loader',
      exclude: [/node_modules/]
    }, {
      test: [/\.js$/, /\.jsx$/],
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
      },
      exclude: [/node_modules/]
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.styl$/,
      use: ['style-loader', 'css-loader', 'stylus-loader']
    // }, {
    //   test: /\.(jpg|png|svg)$/,
    //   loader: 'url-loader',
    //   options: {
    //     limit: 25000
    //   }
    }]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins:[
    ...[
      new webpack.optimize.CommonsChunkPlugin({
        name: 'libStyle',
        filename: 'tracim_frontend_lib.style.js'
      })
    ], // generic plugins always present
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
