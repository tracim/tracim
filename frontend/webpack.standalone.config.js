const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist/assets'),
    filename: 'tracim.[name].standalone.js',
    pathinfo: !isProduction,
    publicPath: '/assets/'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendors~main'
    }
  },
  devtool: isProduction ? false : 'eval-cheap-module-source-map',
  resolve: {
    fallback: {
      fs: false
    }
  },
  performance: {
    hints: false
  },
  module: {
    rules: [isProduction ? {} : {
      test: /\.jsx?$/,
      enforce: 'pre',
      exclude: [/node_modules/, /frontend_lib/],
      use: 'standard-loader'
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
      type: 'asset',
      generator: {
        filename: 'images/[name][ext]' // assets/ is in output.path
      },
      parser: {
        dataUrlCondition: {
          maxSize: 2 * 1024 // 2KB
        }
      }
    }]
  },
  resolve: {
    alias: {
      // Make ~tracim_frontend_lib work in stylus files
      '~tracim_frontend_lib': path.dirname(path.dirname(require.resolve('tracim_frontend_lib')))
    },
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
