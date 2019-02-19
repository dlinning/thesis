const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/new_dbhelper");

router.get("/list", (req, res) => {
    //res.status(200).send(DBHelper.listAllFlows());

    res.status(200).send("Summary list of all flows");
});

router.get("/get/:name?", (req, res) => {
    //res.status(200).send(DBHelper.getFlowByName(req.params.name));
    res.status(200).send(`DATA for flow with name ${req.params.name}`);
});
router.get("/getbyid/:id?", (req, res) => {
    //res.status(200).send(DBHelper.getFlowById(req.params.id));
    res.status(200).send(`DATA for flow with ID ${req.params.id}`);
});

router.get("/create/:name", (req, res) => {
    //res.status(200).send(DBHelper.createFlow(req.params.name));

    res.status(200).send(`CREATED a flow with name ${req.params.name}`);
});

router.delete("/:id", (req, res) => {
    //res.status(200).send(DBHelper.deleteFlowById(req.params.id));

    res.status(200).send(`DELETED a flow with ID ${req.params.id}`);
});

module.exports = router;
