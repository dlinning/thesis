const config = require("../config.json");

const express = require("express"),
    server = express();

server.use(express.json());

/* BEGIN Route Configuration */
var router = require("./routes/RoutesConfig");
server.use("/", router);
/* END Route Configuration */

module.exports = {
    server: server
};
