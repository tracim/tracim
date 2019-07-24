'use strict'

module.exports = {
  require: [
    'regenerator-runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
