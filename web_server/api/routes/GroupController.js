const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/dbhelper");

// Expects {groupName:STRING, [uuid:UUID]}
// Only provide `uuid` if updating `groupName`
//
router.post("/createorupdate", (req, res) => {
    var groupName = req.body.groupName;

    if (groupName && groupName.length > 0) {
            var resp = DBHelper.createOrUpdateGroup(req.body.uuid, groupName);
            res.status(resp.status).send(resp)
    } else {
        res.status(400).send("Must send `groupName` on body");
    }
});

// Allows deletion of a group
//
router.delete("/delete/:id/:deleteWithSensors?", (req, res) => {
    let p = req.params;

    var dbResp = DBHelper.deleteGroup(p.id, p.deleteWithSensors);
    if (dbResp) {
        res.status(dbResp.status).send(dbResp);
        return;
    } else {
        res.status(500).send("ERROR DELETING GROUP");
    }
});

// Will return a paginated list of Groups
// (UUID, Name).
// By default, will get the first page.
//
router.get("/list", (req, res) => {
    res.status(200).send(DBHelper.listAllGroups());
});

// Returns logEntries for all sensors within
// a given group.
router.get("/logs/:groupID/:startTime?/:endTime?", (req, res) => {
    let p = req.params;

    res.status(200).send(DBHelper.getLogsForGroup(p.groupID, p.startTime, p.endTime));
});

// Returns latest aggregate data for all groups.
router.get("/aggregate/:groupId?", (req, res) => {
    res.status(200).send(DBHelper.getLatestGroupSumAndAvg(req.params.groupId));
});

module.exports = router;
