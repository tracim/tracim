const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    app: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'file.[name].standalone.js',
    pathinfo: !isProduction,
    library: 'appFile',
    libraryTarget: isProduction ? 'var' : undefined
  },
  devtool: isProduction ? false : 'eval-cheap-module-source-map',
  performance: {
    hints: false
  },
  module: {
    rules: [isProduction ? {} : {
      test: /\.jsx?$/,
      enforce: 'pre',
      use: 'standard-loader',
      exclude: [/node_modules/, /frontend_lib/]
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
    }, {
      test: /\.(jpg|png|svg)$/,
      type: 'asset',
      parser: {
        dataUrlLimit: 25 * 1024 // 25 KB
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
  ],
  experiments: {
    // INFO - CH - 2025-04-07 - Option bellow make webpack to generate a <hash>.module.wasm file in the output path
    // It is required for PointCloudViewer.jsx
    // build_app.sh copy that file to frontend/dist/app/
    asyncWebAssembly: true,
  }
}
