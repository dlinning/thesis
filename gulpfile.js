const gulp = require("gulp"),
    plumber = require("gulp-plumber"),
    rename = require("gulp-rename"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify-es").default,
    babel = require("gulp-babel");

const path = require("path");

const minifycss = require("gulp-minify-css"),
    less = require("gulp-less");

const paths = {
    styles: {
        in: path.join(__dirname, "./dashboard/src/styles/**/*.less"),
        out: path.join(__dirname, "./dashboard/dist/styles/")
    },
    scripts: {
        in: path.join(__dirname, "./dashboard/src/scripts/**/*.js"),
        out: path.join(__dirname, "./dashboard/dist/scripts/")
    }
};

const babelPresetOptions = {
    targets: {
        chrome: 60,
        android: 60,
        safari: 9,
        ios: 9,
        ie: 11
    }
};

const errorHander = function(err) {
    console.log(err.message);
};

gulp.task("styles", function() {
    gulp.src(paths.styles.in)
        .pipe(
            plumber({
                errorHandler: errorHander
            })
        )
        .pipe(less())
        .pipe(gulp.dest(paths.styles.out))
        .pipe(rename({ suffix: ".min" }))
        .pipe(minifycss())
        .pipe(gulp.dest(paths.styles.out));
});

gulp.task("scripts", function() {
    return gulp
        .src(paths.scripts.in)
        .pipe(
            plumber({
                errorHandler: errorHander
            })
        )
        .pipe(concat("bundle.js"))
        .pipe(babel())
        .pipe(gulp.dest(paths.scripts.out))
        .pipe(rename({ suffix: ".min" }))
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.out));
});

gulp.task("watcher", function() {
    gulp.watch(paths.styles.in, ["styles"]);
    gulp.watch(paths.scripts.in, ["scripts"]);
});
