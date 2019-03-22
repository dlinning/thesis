const debug = process.env.NODE_ENV != "production";

const DBHelper = require("../common/helpers/dbhelper");

let flowIntervalTimer = null,
    flowsByType = null;

let settings = DBHelper.getSettingsByGroup("flows");

// Returns a 24-hour formatted (ex. "17:04");
const getCurrentTime = () => {
    let d = new Date();
    return `${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
};

const start = () => {
    settings = DBHelper.getSettingsByGroup("flows").settings;

    flowsByType = organizeFlowsByType(DBHelper.getAllFlows());

    if (settings["flowsEnabled"] == "on") {
        // Begin running the interval "flow checker"

        // Run every minute
        flowIntervalTimer = setInterval(checkFlows, 60 * 1000);

        // Immediately do first check
        checkFlows();
    }
};

const stop = () => {
    console.log("stopping");
    // Not null so that something like `settings["abc"]`
    // will return undefined instead of erroring
    settings = {};
    flowsByType = {};

    // Clear the interval
    clearInterval(flowIntervalTimer);
};

const restart = () => {
    stop();
    start();
};

//////////

// Will run the provided flow proper.
const runFlow = (flow, newValue, atTime) => { 
    console.log('Time/sensor flow', flow);
};

const runGroupFlow = (flow, aggregateData, atTime) =>{
    console.log('Group flow', flow);
};

//////////

// Returns an object keyed by the different types of Flow triggers
// (Group, Sensor, Time). Used throughout the file in order to not
// have to iterate over all flows constantly. (For example, only checking)
// Sensor flows when a sensor updates.
const organizeFlowsByType = flows => {
    let res = { Group: [], Sensor: [], Time: [] };

    for (let i = 0, l = flows.length; i < l; i++) {
        res[flows[i].triggerType].push(flows[i]);
    }

    return res;
};

// Checks all "Group" and "Time" flows at an interval
// (as started in `start()`).
const checkFlows = () => {
    let currentTime = getCurrentTime();
    let groupAggregate = DBHelper.getLatestGroupSumAndAvg().groups;

    let flowsToCheck = flowsByType["Time"].concat(flowsByType["Group"]);

    for (let i = 0, l = flowsToCheck.length; i < l; i++) {
        let flow = flowsToCheck[i];

        if (flow.triggerType === "Time" && flow.triggerId == currentTime) {
            runFlow(flow, currentTime, currentTime);
        } else{
            // Group flows
            runGroupFlow(flow, groupAggregate[flow.triggerId], currentTime);
        }
    }
};

// Not exported since this should only be
// called directly from `startTaskRunner()` or `stopTaskRunner()`
const handleSensorUpdate = (sensorId, newValue) => {
    let currentTime = getCurrentTime();
    let flowsToCheck = flowsByType["Sensor"];

    for (let i = 0, l = flowsToCheck.length; i < l; i++) {
        if (flowsToCheck[i].triggerId == sensorId) {
            runFlow(flowsToCheck[i], newValue, currentTime);
        }
    }
};
module.exports.handleSensorUpdate = handleSensorUpdate;

////////////////
start();
