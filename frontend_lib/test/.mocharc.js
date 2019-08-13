'use strict'

module.exports = {
  require: [
    '@babel/register',
    'core-js/stable',
    'regenerator-runtime/runtime',
    'ignore-styles',
    'test/setup'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
