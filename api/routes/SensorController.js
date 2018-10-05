const express = require("express"),
	router = express.Router();

var DBHelper = require("../../common/helpers/dbhelper");
DBHelper.init(require("../config.json"));

// Will return a paginated list of Sensors
// By default, will get the first page.
//
router.get("/list/:page?/:limit?", (req, res) => {
	DBHelper.listByType("Sensor", req.params.page || 0, req.params.limit || 10, [
		{ model: DBHelper.dbObjects["Group"], required: false }
	])
		.then(dbResp => {
			res.status(200).send(dbResp);
		})
		.catch(err => {
			res.status(500).send({ error: "Error getting sensors." });
		});
});

// Will set the groupID for the sensor with ID of sensorID.
// If groupID is undefined, then it will clear the group.
//
router.post("/setGroup", (req, res) => {
	let body = req.body;

	if (body.sensorID == undefined || body.groupID == undefined) {
		res
			.status(400)
			.send({ error: "Must send both sensorID and groupID fields." });
	}

	DBHelper.checkExists([
		{ type: "Sensor", id: body.sensorID },
		{ type: "Group", id: body.groupID }
	])
		.then(bothExist => {
			if (bothExist) {
				DBHelper.addSensorToGroup(body.sensorID, body.groupID)
					.then(didUpdate => {
						res.status(200).send({ response: "ok" });
					})
					.catch(setErr => {
						res.status(500).send({
							error: `Error setting groupID(${body.groupID}) for sensorID (${
								body.sensorID
							})`
						});
					});
			} else {
				res
					.status(400)
					.send({ error: "Either groupID or sensorID does not exist" });
			}
		})
		.catch(err => {
			console.error(err);
			res.status(500).send({ error: "Error reading from database." });
		});
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

router.get("/logs/:sensorID/:startTime?/:endTime?", (req, res) => {
	let p = req.params;

	DBHelper.getReadings(
		p.sensorID,
		p.startTime || Date.UTC(1970, 01, 01),
		p.endTime || Date.now()
	)
		.then(dbResp => {
			res.status(200).send(dbResp);
		})
		.catch(err => {
			console.log(err);
			res
				.status(500)
				.send({ error: `Error getting logs for sensor ${p.sensorID}.` });
		});
});

module.exports = router;
