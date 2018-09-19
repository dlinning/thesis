const config = require("../configs/dashboard.json");

const express = require("express"),
	exphbs = require("express-handlebars");

var server = express();
server.use(express.json());

server.engine("hbs", exphbs({ defaultLayout: "layout", extname: "hbs" }));
server.set("view engine", "hbs");

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
server.listen(config.port, () => {
	console.log(`Server Running on port ${config.port}`);
});
