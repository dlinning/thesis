const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/new_dbhelper");

router.get("/list", (req, res) => {
    res.status(200).send(DBHelper.listAllViews().views);
});

router.get("/get/:name?", (req, res) => {
    var name = req.params.name || "default";

    res.status(200).send(DBHelper.getTilesForViewByName(name));
});

router.get("/create/:name", (req, res) => {
    res.status(200).send(DBHelper.createView(req.params.name));
});

router.delete("/:id", (req, res) => {
    //TODO: Check for tiles assigned to this view
    res.status(200).send(DBHelper.deleteViewById(req.params.id));
});

module.exports = router;
