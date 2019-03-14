const express = require("express"),
    router = express.Router();

const SERVER_START_TIME = Date.now();

// Can be used as a simple "heartbeat" check
router.get("/", (req, res) => {
    res.send(`API is running. Started at: ${SERVER_START_TIME}`);
});

// Returns the current server time & timezone info
router.get("/time", (req, res) => {
    res.send(Date());
});

router.use("/sensors", require("./SensorController"));
router.use("/groups", require("./GroupController"));

router.use("/flows", require("./FlowsController"));

router.use("/settings", require("./SettingsController"));

module.exports = router;
