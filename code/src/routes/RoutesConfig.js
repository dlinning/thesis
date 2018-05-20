var express = require("express"),
    router = express.Router();

router.use("/connect", require("./ConnectController"));

router.use("/send", require("./SendController"));

router.use("/sensor", require("./SensorController"));
router.use("/group", require("./GroupController"));

module.exports = router;
