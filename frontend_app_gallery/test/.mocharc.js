'use strict'

module.exports = {
  require: [
    'regenerator-runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup',
    'isomorphic-fetch'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
