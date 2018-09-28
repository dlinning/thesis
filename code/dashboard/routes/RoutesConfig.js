var express = require("express"),
	router = express.Router();

router.use("/", require("./MainController"));

router.use("/api", require("./ApiController"));

router.use("/api/groups", require("./GroupController"));

router.use("/api/sensors", require("./SensorController"));

module.exports = router;
