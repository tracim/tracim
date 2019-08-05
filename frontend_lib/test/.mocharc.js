'use strict'

module.exports = {
  require: [
    '@babel/register',
    '@babel/polyfill',
    'ignore-styles',
    'test/setup'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
