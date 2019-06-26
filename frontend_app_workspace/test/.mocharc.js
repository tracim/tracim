'use strict'

module.exports = {
  require: [
    '@babel/polyfill',
    '@babel/register',
    'ignore-styles',
    'test/setup'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true,
  extension: ['.spec.js']
}
