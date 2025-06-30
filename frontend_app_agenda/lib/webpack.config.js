const path = require('path')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const DtsBundleWebpack = require('dts-bundle-webpack')
const isProduction = process.env.NODE_ENV === 'production' || true
const name = '@algoo/calendar-client'

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    index: "./src/index.ts",
  },
  target: 'web',
  plugins: [
    new NodePolyfillPlugin(),
    new DtsBundleWebpack({
        name: name,
        main: path.resolve(__dirname, "build/src/index.d.ts"),
        out: path.resolve(__dirname, "dist/index.d.ts"),
    })
  ],
  module: {
    rules: [{
      test: /\.ts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      type: 'umd',
      name: name,
      umdNamedDefine: true
    }
  }
}
