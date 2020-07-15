'use strict'

module.exports = {
  require: [
    'core-js/stable',
    'regenerator-runtime/runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup',
    // INFO - GM - 2020-06-18 - Isomorphic-fetch provide the fetch API because Node does not contain it, and unit test run in Node context
    'isomorphic-fetch'
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
