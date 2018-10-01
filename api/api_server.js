const config = require("./config.json");

const express = require("express"),
    server = express();

server.use(express.json());

/* BEGIN Route Configuration */
var router = require("./routes/RoutesConfig");
server.use("/", router);
/* END Route Configuration */

// Start the server listening
server.listen(config.port, () => {
    console.log(`Server Running on port ${config.port}`);
});
