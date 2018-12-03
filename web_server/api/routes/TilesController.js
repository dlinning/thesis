const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/new_dbhelper");

const requiredFields = ["apiCall", "chartType", "row", "col", "width", "height", "viewId"];
router.post("/create", (req, res) => {
    var p = req.body;

    // TODO: Validate fields
    var missing = [];
    for (var i = 0, l = requiredFields.length; i < l; i++) {
        if (p[requiredFields[i]] === undefined) {
            missing.push(requiredFields[i]);
        }
    }
    if (missing.length === 0) {
        var dbResp = DBHelper.createTile(p);
        res.status(dbResp.status).send(dbResp);
    } else {
        res.status(400).send("MISSING REQUIRED FIELDS: " + missing.join(", "));
    }
});

//TODO: Implement update/delete
router.delete("/delete/:id", (req, res) => {
    //TODO: Check for tiles assigned to this view
    var dbResp = DBHelper.deleteTileById(req.params.id);
    res.status(dbResp.status).send(dbResp);
});

router.post("/update", (req, res) => {
    res.status(200).send("OK");
});

module.exports = router;
