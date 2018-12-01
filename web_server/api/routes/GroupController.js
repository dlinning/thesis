const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/new_dbhelper");

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

// Will return a paginated list of Groups
// (UUID, Name).
// By default, will get the first page.
//
router.get("/list/:page?/:limit?", (req, res) => {
    //TODO: Add proper pagination
    res.status(200).send(DBHelper.listAllGroups());
});

// Returns logEntries for all sensors within
// a given group.
router.get("/logs/:groupID/:page?/:limit?/:startTime?/:endTime?", (req, res) => {
    let p = req.params;

    DBHelper.FindAndCountPaginated(
        DBHelper.dbObjects["LogEntry"],
        {
            attributes: ["timestamp", "value"],
            where: {
                timestamp: {
                    [Op.and]: {
                        [Op.lte]: p.endTime || Date.now(),
                        [Op.gte]: p.startTime || Date.UTC(1970, 0, 1)
                    }
                }
            },
            include: [
                {
                    model: DBHelper.dbObjects["Sensor"],
                    attributes: ["name", "id", "dataType"],
                    include: [
                        {
                            model: DBHelper.dbObjects["Group"],
                            attributes: [],
                            where: {
                                id: { [Op.eq]: p.groupID }
                            }
                        }
                    ]
                }
            ]
        },
        p.page || 0,
        p.limit || 100
    )
        .then(dbResp => {
            res.status(200).send(dbResp);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: `Error getting logs for group ${p.groupID}.` });
        });
});
module.exports = router;
