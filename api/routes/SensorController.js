const express = require("express"),
	router = express.Router();

const DBHelperBuilder = require("../../common/helpers/dbhelper"),
	DBHelper = new DBHelperBuilder(require("../config.json").db);

// Will return a paginated list of Sensors
// By default, will get the first page.
//
router.get("/list/:page?/:limit?", (req, res) => {
    DBHelper.listByType(
        "Sensor",
        req.params.page || 0,
        req.params.limit || 10,
        [{model:DBHelper.dbObjects["Group"], required:false}])
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
						res.status(200).send({ response: 'ok' });
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

module.exports = router;
