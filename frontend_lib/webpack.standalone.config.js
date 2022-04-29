const path = require('path')
const glob = require('glob')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    lib: './src/index.js',
    test_utils: './test/index.js',
    style: glob.sync('./src/**/*.styl')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'tracim_frontend_lib.[name].standalone.js',
    pathinfo: !isProduction,
    library: ['tracim_frontend_lib', '[name]'],
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: {
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'react-router-dom': { // INFO - CH - this is required for using <Link> in frontend_lib
      root: 'ReactRouterDom',
      commonjs2: 'react-router-dom',
      commonjs: 'react-router-dom',
      amd: 'react-router-dom',
    },
  },
  optimization: {
    moduleIds: 'named'
  },
  devtool: false,
  // RJ - 2020-06-11 - source maps disabled for frontend_lib for now,
  // they cause a lot of warnings in the browser's console
  module: {
    rules: [
      isProduction ? {} : {
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
        use: ['style-loader', 'css-loader', 'stylus-native-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    ...[], // generic plugins always present
    ...(isProduction
      ? [] // production specific plugins
      : [] // development specific plugins
    )
  ]
}
