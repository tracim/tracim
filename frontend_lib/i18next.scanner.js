const scanner = require('i18next-scanner')
const vfs = require('vinyl-fs')

const option = require('../i18next.option.js')

vfs.src(['./src/**/*.jsx', './src/helper.js'])
// .pipe(sort()) // Sort files in stream by path
  .pipe(scanner(option))
  .pipe(vfs.dest('./i18next.scanner'))
