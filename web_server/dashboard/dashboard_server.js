const path = require("path");

const express = require("express"),
    server = express();

const DBHelper = require("../../common/helpers/dbhelper");

const ISDEV = process.env.NODE_ENV !== "production";

server.set("view engine", "ejs");

server.set("views", path.join(__dirname, "./views"));

process.env.NODE_ENV === "production" && server.enable("view cache");

server.use("/dist", express.static(path.join(__dirname, "./dist")));

server.get("/:page?", (req, res) => {
    let page = req.params.page || "home";

    const theme = DBHelper.getSpecificSetting("darkMode").value == "on" ? "dark" : "light";

    res.render("home", {
        title: `Simple IoT - ${page.charAt(0).toUpperCase() + page.substr(1)}`,
        page: page,
        isDev: ISDEV,
        theme: theme
    });
});

module.exports = {
    server: server
};
