'use strict'

const gulp        = require('gulp')
const concat      = require('gulp-concat')
// const sass        = require('gulp-sass')
// const stylus      = require('gulp-stylus')
const rename      = require('gulp-rename')
const uglify      = require('gulp-uglify')
const cleanCSS    = require('gulp-clean-css')
const babel       = require('gulp-babel')
const gulpsync    = require('gulp-sync')(gulp)
const jshint      = require('gulp-jshint')
const stylish     = require('jshint-stylish')
const expect      = require('gulp-expect-file')
const plumber     = require('gulp-plumber')
const browserSync = require('browser-sync').create()
const autoprefixer= require('gulp-autoprefixer')
const rewriteCSS  = require('gulp-rewrite-css')

const _srcdir = 'tracim/tracim/public/assets/'
const _tpldir = 'tracim/tracim/templates/'

const listCssFiles = [
  _srcdir + 'css/default_skin.css',
  _srcdir + 'css/bootstrap.css',
  _srcdir + 'font-awesome-4.2.0/css/font-awesome.css',
  _srcdir + 'select2-4.0.3/css/select2.min.css',
  _srcdir + 'css/dashboard.css'
]

const listJsFiles = [
  _srcdir + 'select2-4.0.3/js/select2.min.js',
  _srcdir + 'js/bootstrap.min.js',
  _srcdir + 'js/trad.js',
  _srcdir + 'js/main_es5.js'
]

// CSS task
gulp.task('css', function () {
  const dest = _srcdir + '/dist/'

  return gulp.src(listCssFiles)
    .pipe(expect({verbose: true}, listCssFiles))
    .pipe(rewriteCSS({
        destination: dest,
        // debug: true
    }))
    // .pipe(sass().on('error', sass.logError))
    // .pipe(stylus())
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(concat('all.css'))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.stream())
})

// JS tasks
gulp.task('js_hint', function() {
  return gulp.src(_srcdir + '/js/main.js')
    .pipe(expect({verbose: true}, _srcdir + '/js/main.js'))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
})
gulp.task('js_transpiling', function() {
  return gulp.src(_srcdir + '/js/main.js')
    .pipe(plumber())
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(concat('main_es5.js'))
    .pipe(gulp.dest(_srcdir + '/js/'))
})
gulp.task('js_concat', function() {
  return gulp.src(listJsFiles)
    .pipe(expect({verbose: true}, listJsFiles))
    .pipe(concat('all.js'))
    .pipe(gulp.dest(_srcdir + '/dist/'))
    .pipe(browserSync.stream())
})
gulp.task('js_sync', gulpsync.sync(['js_transpiling', 'js_concat']))
gulp.task('js', ['js_hint', 'js_sync'])

// BUILD tasks
gulp.task('prod_css', ['css'], function () {
    return gulp.src(_srcdir + '/dist/all.css')
        .pipe(expect({verbose: true}, _srcdir + '/dist/all.css'))
        .pipe(cleanCSS({keepSpecialComments:0}))
        .pipe(concat('all.min.css'))
        .pipe(gulp.dest(_srcdir + '/dist/'))
})
gulp.task('prod_js', ['js'], function () {
    return gulp.src(_srcdir + '/dist/all.js')
        .pipe(expect({verbose: true}, _srcdir + '/dist/all.js'))
        .pipe(uglify())
        .pipe(concat('all.min.js'))
        .pipe(gulp.dest(_srcdir + '/dist/'))
})

gulp.task('prod', ['prod_css', 'prod_js'])

gulp.task('dev', ['css', 'js'])

// WATCH task
gulp.task('watch', function () {
  gulp.watch([
    _srcdir + '/js/*.js',
    '!'+_srcdir+'/js/scripts_es5.js',
    '!'+_srcdir+'/js/*.min.*'
  ], {verbose: true, debounceDelay: 2000}, ['js'])

  gulp.watch([
    _srcdir + '/css/*.css',
    '!'+_srcdir+'/css/*.min.*',
    '!'+_srcdir+'/css/*.map'
  ], ['css'])
})

// LIVERELOAD task
gulp.task('livesync', function() {
  browserSync.init({
    ghostMode: false, // comment this line to mirror input click and scroll on all opened browsers
    proxy: "127.0.0.1:8080",
    browser: "chromium",
    port: 8081
  })

  gulp.watch(_tpldir + '**/*.html').on('change', browserSync.reload)
})

gulp.task('watchsync', ['watch', 'livesync'])

// DEFAULT task
gulp.task('default', function () {
  console.log(`
    Usable tasks : watchsync, watch, dev, prod, js, css
    Other available tasks : livesync, js_sync, js_concat, js_hint, prod_css, prod_js
  `)
})
