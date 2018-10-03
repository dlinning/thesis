const express = require("express"),
	router = express.Router();

var DBHelper = require("../../common/helpers/dbhelper");
DBHelper.init(require("../config.json"));

// Expects {groupName:STRING, [uuid:UUID]}
// Only provide `uuid` if updating `groupName`
//
router.post("/createorupdate", (req, res) => {
	var groupName = req.body.groupName;

	console.log("REQUEST BODY::", req.body);

	if (groupName && groupName.length > 0) {
		DBHelper.createOrUpdateGroup(groupName, req.body.uuid)
			.then(dbResp => {
				res.status(200).send(`Created/Updated Group: ${groupName}`);
			})
			.catch(dbErr => {
				res.status(500).send("Error creating/updating group.");
			});
	} else {
		res.status(400).send("Must send `groupName` on body");
	}
});

// Will return a paginated list of Groups
// (UUID, Name).
// By default, will get the first page.
//
router.get("/list/:page?/:limit?", (req, res) => {
	DBHelper.listByType("Group", req.params.page || 0, req.params.limit || 10)
		.then(dbResp => {
			res.status(200).send(dbResp);
		})
		.catch(err => {
			res.status(500).send({ error: "Error getting all groups." });
		});
});

module.exports = router;
