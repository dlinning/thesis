const debug = process.env.NODE_ENV != "production";

const DBHelper = require("../common/helpers/dbhelper");

// Setup default global values
let FLOW_TIMER = null,
    IS_READY = false,
    SETTINGS = null,
    ALL_FLOWS = null;

// Will get the latest SETTINGS and ALL_FLOWS data
update();

// A helper function that returns a
// 24 - hour formatted(ex. "17:04");
//
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

// Should be called whenever there are changes to either
// Flow settings, or an individual flow.
//
function update() {
    IS_READY = false;

    SETTINGS = DBHelper.getSettingsByGroup("flows").settings;
    ALL_FLOWS = organizeFlows(DBHelper.getAllFlows());

    IS_READY = true;
}

// Called by `update()`, makes (possibly) finding the
// correct flow much faster by only iterating
// over related flows.
//
function organizeFlows(flows) {
    let result = { Sensor: [], Group: [], Time: [] };

    flows.forEach(flow => {
        let tt = flow.triggerType;

        // Remove unnecessary properties
        delete flow.id;
        delete flow.name;
        delete flow.description;
        delete flow.triggerType;

        // Add the flow to the correct group
        result[tt].push(flow);
    });

    return result;
}

function findSensorsToSendTo(flow, newValue, currentTime, triggerGroupId) {
    let formattedPayload = {};

    Object.keys(flow.config.payload).forEach(k => {
        // Swap out values that are "keywords"
        if (flow.config.payload[k] === "%VALUE%") {
            formattedPayload[k] = newValue;
        } else if (flow.config.payload[k] === "%SENSORID%") {
            formattedPayload[k] = flow.triggerId;
        } else if (flow.config.payload[k] === "%GROUPID%") {
            formattedPayload[k] = triggerGroupId || "NOT_FROM_GROUP";
        } else if (flow.config.payload[k] === "%TIME%") {
            formattedPayload[k] = new Date();
        } else {
            formattedPayload[k] = flow.config.payload[k];
        }
    });

    let toSensors = [];

    if (flow.config.to.type === "Sensor") {
        toSensors.push(flow.config.to.id);
    } else {
        // To a group, have to lookup from DB.
        //
        // Not the most performant, but doing it
        // here so we don't have to keep track of each Sensor's
        // Group membership all the time.
        toSensors = DBHelper.getSensorIdsByGroupIdStmt(flow.config.to.id);
    }

    return { payload: formattedPayload, to: toSensors };
}

module.exports.handleSensorUpdate = (sensorId, newValue) => {
    let resp = [];

    // Make sure that the system is ready before checking
    // any Flows.
    if (IS_READY) {
        let currentTime = getCurrentTime();
        let flowsToCheck = ALL_FLOWS["Sensor"];

        for (let i = 0, l = flowsToCheck.length; i < l; i++) {
            // Check for ID match
            if (flowsToCheck[i].triggerId == sensorId) {
                // Check for "logic" validation
                let f = flowsToCheck[i];

                // Yuck. But otherwise how?
                const isGood = eval(`${newValue} ${f.config.trigger.comparison} ${f.config.trigger.value}`);

                if (isGood) {
                    resp = findSensorsToSendTo(flowsToCheck[i], newValue, currentTime);
                }
            }
        }
    }

    return resp;
};
