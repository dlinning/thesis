const path = require("path");

const express = require("express"),
    server = express();

const exphbs = require("express-handlebars");

server.engine(
    "hbs",
    exphbs({
        defaultLayout: "_layout",
        extname: "hbs",
        layoutsDir: path.join(__dirname, "./views/layouts")
    })
);
server.set("view engine", "hbs");
server.set("views", path.join(__dirname, "./views"));

process.env.NODE_ENV === "production" && server.enable("view cache");

server.use("/dist", express.static(path.join(__dirname, "./dist")));

server.get("/", (req, res) => {
    res.render("home", { title: "Dashboard" });
});

module.exports = {
    server: server
};
