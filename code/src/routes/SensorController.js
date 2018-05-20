var express = require("express"),
    router = express.Router();

router.get("/:sensorid", (req, res) => {
    res.send(`Reading from SENSOR: ${req.params.sensorid}`);
});

module.exports = router;
