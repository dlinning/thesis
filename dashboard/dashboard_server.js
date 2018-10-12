const config = require("./config.json");

const express = require("express"),
	server = express();

server.get("/", (req, res) => {
    res.send('Hello World');
});

// Start the server listening
server.listen(config.port, () => {
	console.log(`Server Running on port ${config.port}`);
});
