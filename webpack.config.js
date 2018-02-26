const webpack = require('webpack')
const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'tracim_lib.js',
    pathinfo: !isProduction,
    library: 'tracim_lib',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    port: 8071,
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
      loader: 'url-loader',
      options: {
        limit: 25000
      }
    }]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins:[
    ...[], // generic plugins always present
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
