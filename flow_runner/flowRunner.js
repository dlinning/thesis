const debug = process.env.NODE_ENV != "production";

const DBHelper = require("../common/helpers/dbhelper");

var taskRunnerTimer = null,
    allFlows = null,
    flowsForSensorById = {},
    sensorIdsByGroupId = null;

// Used internally to start the TaskRunner,
// and also able to be triggered externally via module.exports.
const startTaskRunner = () => {
    let settingsReq = DBHelper.getSettingsByGroup("flows");

    allFlows = DBHelper.getAllFlows();

    sensorIdsByGroupId = buildSensorsByGroup();

    buildFlowsAsPerSensor();

    if (settingsReq.status === 200) {
        let SETTINGS = settingsReq.settings;
        SETTINGS["flowInterval"] = Number(SETTINGS["flowInterval"]) * 1000; // Convert `flowInterval` to seconds

        debug && console.log("TASK RUNNER STARTED");

        //runFlows(); // Initial Call to run tasks
        //taskRunnerTimer = setInterval(runFlows, SETTINGS["flowInterval"]);
    } else {
        console.error("Unable to start task runner. Check DB for `flowInterval` setting.");
    }
};
module.exports.startTaskRunner = startTaskRunner;










const stopTaskRunner = () => {
    clearInterval(taskRunnerTimer);
    allFlows = null;
    flowIndexesBySensorId = {};
};
module.exports.stopTaskRunner = stopTaskRunner;








const restartTaskRunner = () => {
    stopTaskRunner();
    startTaskRunner();
};
module.exports.restartTaskRunner = restartTaskRunner;







// Not exported since this should only be
// called directly from `startTaskRunner()` or `stopTaskRunner()`
const handleSensorUpdate = (sensorId, newValue) => {
    console.log(`Processing new value [${newValue}] for sensor ${sensorId}`);
    let flowsToRun = flowsForSensorById[sensorId];

    if (flowsToRun.length > 0) {
        console.log("\n\nNeed to run " + flowsToRun.length + " Flows\n\n");
    }
};
module.exports.handleSensorUpdate = handleSensorUpdate;






const buildSensorsByGroup = () => {
    res = {};

    let all = DBHelper.getSensorIdsForAllGroups();

    all.forEach(row => {
        if (res[row.GroupId] === undefined) {
            res[row.GroupId] = [];
        }
        res[row.GroupId].push(row.SensorId);
    });

    return res;
};

const buildFlowsAsPerSensor = () => {
    if (allFlows !== null && sensorIdsByGroupId !== null) {
        allFlows.forEach(flow => {
            if (flow.triggerType === "Sensor") {
                // As `flow.triggerId` holds a SensorId,
                // add the flow to this specific sensor.
                addFlowToSensor(flow.triggerId, flow);

            } else if (flow.triggerType === "Group") {
                // Get all sensors that are in the group
                let allSensors = sensorIdsByGroupId[flow.triggerId];

                // Add the flow to each sensor
                if (allSensors !== undefined) {
                    allSensors.forEach(sensorId => {
                        addFlowToSensor(sensorId, flow);
                    });
                }
            }
        });
    }
};
const addFlowToSensor = (sensorId, flow) => {
    if (!flowsForSensorById[sensorId]) {
        flowsForSensorById[sensorId] = [];
    }
    flowsForSensorById[sensorId].push(flow);
};

///////////////
startTaskRunner();
