const scanner = require('i18next-scanner')
const vfs = require('vinyl-fs')

const option = require('../i18next.option.js')

// this script is run by npm run build-translation and generate i18next.scanner/**/*.json

// --------------------
// 2018/07/27 - currently, last version is 2.6.5 but a bug is spaming log with errors. So I'm using 2.6.1
// this issue seems related : https://github.com/i18next/i18next-scanner/issues/88
// --------------------

vfs.src(['./src/**/*.js*', './src/util/helper.js'])
  // .pipe(sort()) // Sort files in stream by path
  .pipe(scanner(option))
  .pipe(vfs.dest('./i18next.scanner'))
