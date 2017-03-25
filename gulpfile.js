const gulp = require('gulp');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const html_validator = require('gulp-html');
const uglify = require("gulp-uglify");
const plumber = require('gulp-plumber');
const webserver = require('gulp-webserver');


const paths = {
    scss: 'src/scss/',
    css: 'dist/css/',
    html_src: 'src/html/',
    html_dst: 'dist/',
    js_src: 'src/js/',
    js_dst: 'dist/js/',
    lib_src: 'src/lib/',
    lib_dst: 'dist/lib/'
}

gulp.task('scss', function() {
    return gulp.src(paths.scss + '**/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compact'}))
        .on('error', sass.logError)
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.css))
});

gulp.task('html', function() {
    return gulp.src(paths.html_src + '**/*.html')
        .pipe(plumber())
        // .pipe(html_validator()) // TODO あとでvalidにする
        .pipe(gulp.dest(paths.html_dst))
});

gulp.task('js', function() {
    return gulp.src(paths.js_src + '**/*.js')
        .pipe(plumber())
        .pipe(babel({ presets: ['es2015'] }))
        .pipe(uglify())
        .pipe(gulp.dest(paths.js_dst));
});

gulp.task('lib', function() {
    return gulp.src(paths.lib_src + '**/*')
        .pipe(gulp.dest(paths.lib_dst));
});

gulp.task('default', ['scss', 'html', 'js', 'lib']);

gulp.task('webserver', function() {
     gulp.src('dist/') // 公開したい静的ファイルを配置したディレクトリを指定する
     .pipe(webserver({
         host: 'localhost',
         port: 8000,
         livereload: true
     }));
});

gulp.task('watch', ['webserver', 'default'], function() {
    gulp.watch('./src/**/*', ['default']);
});
