const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/dbhelper");

router.get("/get/group/:name", (req, res) => {
    var dbResp = DBHelper.getSettingsByGroup(req.params.name);
    res.status(dbResp.status).send(dbResp.settings);
});

router.get("/get/:name?", (req, res) => {
    var name = req.params.name;

    if (name === undefined) {
        res.status(200).send(DBHelper.getAllSettings());
    } else {
        var dbResp = DBHelper.getSpecificSetting(name);
        res.status(dbResp.status).send(dbResp.value);
    }
});

router.post("/set/:name", (req, res) => {
    var resp = DBHelper.modifySetting(req.params.name, req.body.value);
    res.status(resp.status).send(resp);
});

module.exports = router;
