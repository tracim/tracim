const webpack = require('webpack')
const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

console.log('isProduction : ', isProduction)

module.exports = {
  entry: isProduction
    ? './src/index.js' // only one instance of babel-polyfill is allowed
    : ['babel-polyfill', './src/index.dev.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'folder.app.js' : 'folder.app.dev.js',
    pathinfo: !isProduction,
    library: isProduction ? 'appFolderAdvanced' : undefined,
    libraryTarget: isProduction ? 'var' : undefined
  },
  externals: {},
  // isProduction ? { // Côme - since plugins are imported through <script>, cannot externalize libraries
  //   react: {commonjs: 'react', commonjs2: 'react', amd: 'react', root: '_'},
  //   'react-dom': {commonjs: 'react-dom', commonjs2: 'react-dom', amd: 'react-dom', root: '_'},
  //   classnames: {commonjs: 'classnames', commonjs2: 'classnames', amd: 'classnames', root: '_'},
  //   'prop-types': {commonjs: 'prop-types', commonjs2: 'prop-types', amd: 'prop-types', root: '_'},
  //   tracim_lib: {commonjs: 'tracim_lib', commonjs2: 'tracim_lib', amd: 'tracim_lib', root: '_'}
  // }
  // : {},
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    host: '0.0.0.0',
    port: 8077,
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
  plugins: [
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
