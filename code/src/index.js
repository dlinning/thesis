const express = require("express");
var server = express();
server.use(express.json());

const CONFIG = require("../config/server.json");

/* BEGIN Route Configuration */
var router = require("./routes/RoutesConfig");
server.use("/", router);
/* END Route Configuration */

// Just a simple response now, to make sure the server is running
const SERVER_START_TIME = Date.now();
server.get("/", (req, res) => {
    res.send(`Server started at: ${SERVER_START_TIME}`);
});

// Start the server listening
server.listen(CONFIG.port, () => {
    console.log(`Server Running on port ${CONFIG.port}`);
});
