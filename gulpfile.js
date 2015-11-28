var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var tsConfig = require('./tsconfig.json');
var babel = require('gulp-babel');
var concat = require('gulp-concat');

gulp.task('default', ['build']);

gulp.task('build', function() {
  return gulp.src('src/**/*.ts')
    //.pipe(sourcemaps.init())
    .pipe(ts(tsConfig.compilerOptions))
    .pipe(babel())
    //.pipe(sourcemaps.write('.', { sourceRoot: 'src'}))
    .pipe(gulp.dest('out/src'));
});