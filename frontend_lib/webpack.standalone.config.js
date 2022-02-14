const path = require('path')
const glob = require('glob')
const isProduction = process.env.NODE_ENV === 'production'

// const isStylusFileRegex = /.+\.styl$/gm

const PnpWebpackPlugin = require('pnp-webpack-plugin')

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
    'react-router-dom': { // INFO - CH - this is required for using <Link> in frontend_lib
      root: 'ReactRouterDom',
      commonjs2: 'react-router-dom',
      commonjs: 'react-router-dom',
      amd: 'react-router-dom',
    },
  },
  optimization: {
    namedModules: true
    // splitChunks: {
    //   chunks: 'all',
    //   cacheGroups: {
    //     default: false,
    //     vendors: false,
    //     style: {
    //       test: isStylusFileRegex,
    //       enforce: true,
    //       filename: 'tracim_frontend_lib.style.js'
    //     }
    //   }
    // }
  },
  devtool: false,
  // RJ - 2020-06-11 - source maps disabled for frontend_lib for now,
  // they cause a lot of warnings in the browser's console
  module: {
    rules: [
      true || isProduction ? {} : {
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
        // }, {
        //   test: /\.(jpg|png|svg)$/,
        //   loader: 'url-loader',
        //   options: {
        //     limit: 25000
        //   }
      }
    ]
  },
  resolve: {
    plugins: [
      PnpWebpackPlugin
    ],
    extensions: ['.js', '.jsx']
  },
  resolveLoader: {
    plugins: [
      PnpWebpackPlugin.moduleLoader(module)
    ]
  },
  plugins: [
    ...[], // generic plugins always present
    ...(isProduction
      ? [] // production specific plugins
      : [] // development specific plugins
    )
  ]
}
