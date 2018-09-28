const express = require("express"),
	router = express.Router();

const DBHelperBuilder = require("../../helpers/dbhelper"),
	DBHelper = new DBHelperBuilder(require("../../configs/server.json").db);

// Expects {groupName:STRING, [uuid:UUID]}
// Only provide `uuid` if updating `groupName`
//
router.post("/createorupdate", (req, res) => {
	console.log(req.body.groupName);

	var groupName = req.body.groupName;

	if (groupName) {
		groupName = groupName.toString();
		if (groupName.length > 0) {
			DBHelper.createOrUpdateGroup(groupName, req.body.uuid)
				.then(dbResp => {
					res.status(200).send(`Created/Updated Group: ${groupName}`);
				})
				.catch(dbErr => {
					res.status(500).send("Error creating/updating group.");
				});
		}
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
