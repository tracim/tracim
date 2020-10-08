'use strict'

module.exports = {
  require: [
    'regenerator-runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup',
    'isomorphic-fetch' // INFO - GB - 2020-10-08 - Isomorphic-fetch provide the fetch API because Node does not contain it, and unit test run in Node context
  ],
  reporter: 'spec',
  colors: true,
  recursive: true
}
