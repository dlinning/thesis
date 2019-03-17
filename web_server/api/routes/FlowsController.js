const express = require("express"),
    router = express.Router();

var DBHelper = require("../../../common/helpers/new_dbhelper");

router.get("/list", (req, res) => {
    res.status(200).send(DBHelper.getAllFlows());
});

router.get("/get/:name?", (req, res) => {
    let data = DBHelper.getFlowByName(req.params.name);
    res.status(data.status).send(data);
});
router.get("/getbyid/:id?", (req, res) => {
    let data = DBHelper.getFlowById(req.params.id);
    res.status(data.status).send(data);
});

router.post("/addOrEdit", (req, res) => {
    let data = { status: 400 };

    if (req.body.id !== undefined) {
        data = DBHelper.updateFlow(req.body);
    } else {
        data = DBHelper.createFlow(req.body);
    }
    
    res.status(data.status).send(data);
});

router.delete("/:id", (req, res) => {
    let data = DBHelper.deleteFlowById(req.params.id);
    res.status(data.status).send(data);
});

// Helper for loading only necessary data for
// setting up Flows for Groups/Sensors
router.get("/simpleGroupSensorData", (req, res) => {
    res.status(200).send(DBHelper.getGroupAndSensorDataForFlows());
});

module.exports = router;
