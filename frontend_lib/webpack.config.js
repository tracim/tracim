const path = require('path')
const glob = require('glob')
const isProduction = process.env.NODE_ENV === 'production'

// const isStylusFileRegex = /.+\.styl$/gm

const PnpWebpackPlugin = require('pnp-webpack-plugin')

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    lib: isProduction ? './src/index.js' : './src/index.dev.js',
    test_utils: './test/index.js',
    style: glob.sync('./src/**/*.styl')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'tracim_frontend_lib.[name].js' : 'tracim_frontend_lib.[name].dev.js',
    pathinfo: !isProduction,
    library: isProduction ? 'tracim_frontend_lib' : undefined,
    libraryTarget: isProduction ? 'umd' : undefined,
    umdNamedDefine: isProduction ? true : undefined
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
  devServer: {
    contentBase: path.join(__dirname, 'dist/'),
    proxy: { '/api': 'http://127.0.0.1:7999' },
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
      use: ['style-loader', 'css-loader', 'stylus-native-loader']
    // }, {
    //   test: /\.(jpg|png|svg)$/,
    //   loader: 'url-loader',
    //   options: {
    //     limit: 25000
    //   }
    }]
  },
  resolve: {
    plugins: [
      PnpWebpackPlugin,
    ],
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
