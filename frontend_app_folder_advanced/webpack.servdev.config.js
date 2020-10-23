module.exports = require('./webpack.config.js')
module.exports.entry = './src/index.dev.js'
delete module.exports.output.library
