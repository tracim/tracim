'use strict'

module.exports = {
  require: [
    'mock-local-storage',
    'core-js/stable',
    'regenerator-runtime/runtime',
    '@babel/register',
    'ignore-styles',
    'test/setup',
  ],
  reporter: 'spec',
  colors: true,
  recursive: true,
  exit: true
}
