const path = require("path");

const express = require("express"),
    server = express();

server.set("view engine", "ejs");

server.set("views", path.join(__dirname, "./views"));

process.env.NODE_ENV === "production" && server.enable("view cache");

server.use("/dist", express.static(path.join(__dirname, "./dist")));

server.get("/:page?", (req, res) => {
    let page = req.params.page || "home";

    res.render("home", { title: `Simple IoT - ${page.charAt(0).toUpperCase() + page.substr(1)}`, page: page });
});

module.exports = {
    server: server
};
