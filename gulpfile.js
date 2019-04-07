const gulp = require("gulp"),
    plumber = require("gulp-plumber"),
    rename = require("gulp-rename"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify-es").default,
    babel = require("gulp-babel"),
    combineMq = require("gulp-combine-mq");

const replace = require("gulp-replace");

const path = require("path");

const minifycss = require("gulp-clean-css"),
    less = require("gulp-less");

const paths = {
    styles: {
        in: path.join(__dirname, "./web_server/dashboard/src/styles/*.less"),
        out: path.join(__dirname, "./web_server/dashboard/dist/styles/")
    },
    scripts: {
        in: path.join(__dirname, "./web_server/dashboard/src/scripts/**/*.js"),
        out: path.join(__dirname, "./web_server/dashboard/dist/scripts/")
    },
    react: {
        in: path.join(__dirname, "./web_server/dashboard/src/react/**/*.jsx"),
        out: path.join(__dirname, "./web_server/dashboard/dist/react/")
    },

    // Used by `build-for-release` task
    build: {
        views: path.join(__dirname, "./web_server/dashboard/views/**/*.hbs")
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
    console.error(err.message);
};

gulp.task("styles", function() {
    gulp.src(paths.styles.in)
        .pipe(
            plumber({
                errorHandler: errorHander
            })
        )
        .pipe(concat("bundle.css"))
        .pipe(less())
        .pipe(combineMq())
        .pipe(rename({ suffix: ".min" }))
        .pipe(minifycss({ level: 2 }))
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

gulp.task("react", function() {
    return gulp
        .src(paths.react.in)
        .pipe(
            plumber({
                errorHandler: errorHander
            })
        )
        .pipe(concat("bundle.js"))
        .pipe(
            babel({
                presets: [["@babel/preset-react", babelPresetOptions]]
            })
        )
        .pipe(gulp.dest(paths.react.out))
        .pipe(rename({ suffix: ".min" }))
        .pipe(uglify())
        .pipe(gulp.dest(paths.react.out));
});

gulp.task("default", ["styles", "scripts", "react"], function() {
    gulp.watch(paths.styles.in, ["styles"]);
    gulp.watch(paths.scripts.in, ["scripts"]);
    gulp.watch(paths.react.in, ["react"]);
});

gulp.task("build-for-release", ["styles", "scripts", "react"]);
