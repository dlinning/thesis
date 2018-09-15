var gulp = require("gulp");
var less = require("gulp-less");
var path = require("path");

const paths = {
    lessIn: "../public/assets/less",
    lessOut: "../public/assets/css"
};

gulp.task("compile-less", function() {
    return gulp
        .src(`${paths.lessIn}/**/*.less`)
        .pipe(
            less({
                paths: [path.join(__dirname, "less", "includes")]
            })
        )
        .pipe(gulp.dest(paths.lessOut));
});

gulp.task("watch-less", function() {
    gulp.watch(`${paths.lessIn}/**/*.less`, ["compile-less"]);
});
