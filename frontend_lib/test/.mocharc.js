'use strict'

module.exports = {
  require: [
    '@babel/register',
    'ignore-styles',
    'test/setup'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
