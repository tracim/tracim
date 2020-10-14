'use strict'

module.exports = {
  require: [
    'core-js/stable',
    'regenerator-runtime/runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup',
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
