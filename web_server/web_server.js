const config = require("./config.json");

const path = require("path");

const express = require("express"),
    app = express();

// Serve the demo static folder
app.use("/demo", express.static(path.join(__dirname, "../demo")));

app.use("/assets", express.static(path.join(__dirname, "dashboard/assets")));

app.use("/", require("./dashboard/dashboard_server").server);
app.use("/api", require("./api/api_server").server);

// Start the server listening
app.listen(config.port, () => {
    console.log(`\nDashboard and API servers Running on port ${config.port}\n`);
});
