const config = require("./config.json");

const path = require("path");

const express = require("express"),
    app = express();

app.use("/", require("./dashboard/dashboard_server").server);
app.use("/api", require("./api/api_server").server);

app.use("/assets", express.static(path.join(__dirname, "dashboard/assets")));

// Start the server listening
app.listen(config.port, () => {
    console.log(`\n\n\nDashboard and API servers Running on port ${config.port}\n\n\n`);
});
