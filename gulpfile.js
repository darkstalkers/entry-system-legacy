'use strict';

const _ = require('lodash');
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const gulpLiveServer = require('gulp-live-server');
const $ = gulpLoadPlugins();
const grapher = require('sass-graph');

const SASS_EXT = 'scss';
const SASS_DIR = 'scss';
const SASS_FILES = `${SASS_DIR}/**/*.${SASS_EXT}`;
const CSS_DIR = 'css';

const BABEL_EXT = 'js';
const BABEL_DIR = 'babel';
const BABEL_FILES = `${BABEL_DIR}/**/*.${BABEL_EXT}`;
const JS_DIR = 'js';

let watching = false;

gulp.task('styles', () => {
  const graph = grapher.parseDir(SASS_DIR);
  return gulp.src(SASS_FILES)
    .pipe($.cached('sass'))
    .pipe(
      $.if(watching, $.foreach((currentStream, file) => {
        const files = [file.path];
        const addParent = (childPath) => {
          graph.visitAncestors(childPath, (parent) => {
            if (!_.includes(files, parent)) {
              files.push(parent);
            }
            addParent(parent);
          });
        };
        addParent(file.path);
        console.log(files);
        return gulp.src(files, {base: SASS_DIR});
      }))
    )
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    // .pipe($.sourcemaps.write())
    // .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.autoprefixer({
      browsers: ['last 3 version']
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(CSS_DIR));
});

gulp.task('scripts', () => {
  return gulp.src(BABEL_FILES)
    .pipe($.cached('babel'))
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['es2015']
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(JS_DIR));
});

gulp.task('build', ['styles', 'scripts']);

gulp.task('serve', ['build'], () => {
  // args, options, livereload
  let server = gulpLiveServer.static('./', 8081);
  server.start();
  watching = true;
  $.watch(
    ['./**/*.{js,json}',
    './node_modules/**/*.{js,json}', './package.json'], () => {
    server.start();
  });
  $.watch(
    ['./**/*',
    `!${SASS_DIR}/**/*`, `!${BABEL_DIR}/**/*`], (file) => {
    server.notify(file);
  });
  $.watch(SASS_FILES, () => {
    gulp.start('styles');
  });
  $.watch(BABEL_FILES, () => {
    gulp.start('scripts');
  });
});

// Watch files for changes & reload
gulp.task('watch', ['styles'], () => {
  watching = true;
  $.watch(SASS_FILES, function() {
    gulp.start('styles');
  });
});

gulp.task('default', () => {
  gulp.start('serve');
});
