const config = require("./config.json");

const express = require("express"),
    app = express();

app.use("/", require("./dashboard/dashboard_server").server);
app.use("/api", require("./api/api_server").server);

// Start the server listening
app.listen(config.port, () => {
    console.log(`\n\n\nDashboard and API servers Running on port ${config.port}\n\n\n`);
});
