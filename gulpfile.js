var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
    'scss': 'src/scss/',
    'css': 'dist/css/'
}

gulp.task('scss', function() {
    return gulp.src(paths.scss + '**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compact'}))
        .on('error', sass.logError)
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.css))
});
