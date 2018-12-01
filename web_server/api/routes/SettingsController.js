const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/new_dbhelper");

router.get("/get/:name?", (req, res) => {
    var name = req.params.name;

    if (name === undefined) {
        res.status(200).send(DBHelper.getAllSettings());
    } else {
        var dbResp = DBHelper.getSpecificSetting(name);
        res.status(dbResp.status).send(dbResp.value);
    }
});

router.post("set/:name", (req, res) => {
    var groupName = req.body.groupName;

    if (groupName && groupName.length > 0) {
            var resp = DBHelper.createOrUpdateGroup(req.body.uuid, groupName);
            res.status(resp.status).send(resp)
    } else {
        res.status(400).send("Must send `groupName` on body");
    }
});

module.exports = router;
