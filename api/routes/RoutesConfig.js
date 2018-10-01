const express = require("express"),
    router = express.Router();

const SERVER_START_TIME = Date.now();

router.get("/", (req, res) => {
    res.send(`API is running. Started at: ${SERVER_START_TIME}`);
});

router.use("/api/sensors", require("./SensorController"));
router.use("/api/groups", require("./GroupController"));

module.exports = router;
