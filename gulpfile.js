var gulp = require('gulp');
var sass = require('gulp-sass');

var paths = {
    'scss': 'src/scss/',
    'css': 'dist/css/'
}

gulp.task('scss', function() {
    return gulp.src(paths.scss + '**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest(paths.css))
});
