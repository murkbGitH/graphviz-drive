var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var html_validator = require('gulp-html');

var paths = {
    scss: 'src/scss/',
    css: 'dist/css/',
    html_src: 'src/html',
    html_dst: 'dist/html'
}

gulp.task('scss', function() {
    return gulp.src(paths.scss + '**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compact'}))
        .on('error', sass.logError)
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.css))
});

gulp.task('html', function() {
    return gulp.src(paths.html_src + '**/*.html')
        // .pipe(html_validator()) // TODO あとでvalidにする
        .pipe(gulp.dest(paths.html_dst))
});
