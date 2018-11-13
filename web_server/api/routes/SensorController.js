const express = require("express"),
    router = express.Router(),
    cache = require("../../../common/middleware/memorycache");

var DBHelper = require("../../../common/helpers/new_dbhelper");

// Will return a paginated list of Sensors
// By default, will get the first page.
//
// Below will cache output for 30 seconds
//router.get("/list/:page?/:limit?", cache(30), (req, res) => {
router.get("/list/:page?/:limit?", (req, res) => {
    res.status(200).send(DBHelper.logsAndGroupsForAllSensors());
});

// Will set the groupID for the sensor with ID of sensorID.
// If groupID is undefined, then it will clear the group.
//
router.post("/setGroup", (req, res) => {
    let body = req.body;

    if (body.sensorID == undefined || body.groupID == undefined) {
        res.status(400).send({ error: "Must send both sensorID and groupID fields." });
    }

    var data = DBHelper.addSensorToGroup(body.sensorID, body.groupID);

    if (data === 1) {
        res.status(200).send("UPDATED");
    } else {
        res.status(500).send("ERROR::UNABLE_TO_ADD_SENSOR_TO_GROUP");
    }
});

// Allows modification of Sensors.
//
router.post("/modify", (req, res) => {
    let body = req.body;
    var sensorID = body.sensorID;

    if (sensorID == undefined) {
        res.status(400).send({ error: "Must send sensorID on body." });
    }

    var opts = body.opts;

    DBHelper.updateSensor(sensorID, opts)
        .then(dbResp => {
            res.status(200).send("Modified sensor successfully");
        })
        .catch(dbErr => {
            res.status(500).send(`Error modifying sensor: ${dbErr}`);
        });
});

router.get("/logs/:sensorID/:page?/:limit?/:startTime?/:endTime?", (req, res) => {
    let p = req.params;

    // TODO: Add paging/limiting/startTime/EndTime

    res.status(200).send(DBHelper.getLogsForSensor(p.sensorID));
});

// Used for modifying the sensors via dashboard.
// Provides data such as groups, name, data type, id.
//
// Note: Data type and ID cannot be changed, they are
// simply provided for management purposes.
//
router.get("/settings/:sensorID", (req, res) => {
    DBHelper.getSensorSettings(req.params.sensorID)
        .then(dbResp => {
            res.status(200).send(dbResp);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: `Error getting settings data for sensor ${req.params.sensorID}.` });
        });
});

module.exports = router;
