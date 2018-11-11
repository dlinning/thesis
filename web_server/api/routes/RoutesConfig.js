const express = require("express"),
    router = express.Router();

const SERVER_START_TIME = Date.now();
router.get("/", (req, res) => {
    res.send(`API is running. Started at: ${SERVER_START_TIME}`);
});

router.use("/sensors", require("./SensorController"));
//router.use("/groups", require("./GroupController"));

module.exports = router;
