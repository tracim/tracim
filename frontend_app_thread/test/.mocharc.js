'use strict'

module.exports = {
  require: [
    'regenerator-runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup',
    // INFO - CH - 2020-06-05 - Isomorphic-fetch provide the fetch API because Node does not contain it, and unit test run in Node context
    'isomorphic-fetch'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
