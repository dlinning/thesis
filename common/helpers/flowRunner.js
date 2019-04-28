const debug = process.env.NODE_ENV != "production";

const DBHelper = require("./dbhelper"),
    mqttBroker = require("../../mqtt-broker/broker");

// Setup default global values
let FLOW_TIMER = null,
    IS_READY = false,
    SETTINGS = null,
    ALL_FLOWS = null,
    SEND_TO_SENSOR_FUNC = null;

// Will get the latest SETTINGS and ALL_FLOWS data
// when the FlowRunner first starts.
update();

// A helper function that returns a
// 24 - hour formatted(ex. "17:04");
//
function getCurrentTime() {
    let d = new Date();
    return `${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
}

// A helper function used by Time Flows
// to see if the current day of week is
// allowed to run the Flow.
//
function dayIsGood(days) {
    if (days[new Date().getDay()] === true) {
        return true;
    }
}

// Should be called whenever there are changes to either
// Flow settings, or an individual flow.
//
function update() {
    IS_READY = false;

    clearInterval(FLOW_TIMER);

    SETTINGS = DBHelper.getSettingsByGroup("flows").settings;

    // Make sure Flows are enabled
    if (SETTINGS.flowsEnabled === "on") {
        // Get and organize all Flows.
        ALL_FLOWS = organizeFlows(DBHelper.getAllFlows());

        // Start `FLOW_TIMER` running at an interval.
        FLOW_TIMER = setInterval(() => {
            checkGroupAndTimeFlows();
        }, SETTINGS.flowsInterval * 1000);

        // Call this once so it is run right away.
        checkGroupAndTimeFlows();

        IS_READY = true;
    }
}
// Expose the update function globally
module.exports.update = update;

// Called by `update()`, makes finding the correct flow
// much faster by only iterating over related flows.
//
function organizeFlows(flows) {
    let result = { Sensor: [], Group: [], Time: [] };

    flows.forEach(flow => {
        let tt = flow.triggerType;

        // Remove unnecessary properties
        delete flow.name;
        delete flow.description;

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
            // Should be `undefined` unless actually from a Sensor.
            formattedPayload[k] = flow.triggerType == "Sensor" ? flow.triggerId : undefined;
        } else if (flow.config.payload[k] === "%GROUPID%") {
            // Is `undefined` unless actually from a Group.
            formattedPayload[k] = triggerGroupId;
        } else if (flow.config.payload[k] === "%TIME%") {
            formattedPayload[k] = currentTime;
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
        toSensors = DBHelper.getSensorIdsByGroupId(flow.config.to.id).map(s => s.SensorId);
    }

    return { payload: formattedPayload, to: toSensors };
}

function checkGroupAndTimeFlows() {
    const flowsToCheck = ALL_FLOWS["Group"].concat(ALL_FLOWS["Time"]);

    let sends = [];

    if (flowsToCheck.length > 0) {
        const currentTime = getCurrentTime();
        const groupAggregateData = DBHelper.getLatestGroupSumAndAvg().groups;

        for (let i = 0, l = flowsToCheck.length; i < l; i++) {
            const f = flowsToCheck[i];

            if (f.triggerType === "Group") {
                const comparisonValue = groupAggregateData[f.triggerId][f.config.trigger.aggregateType];

                // Yuck. But otherwise how?
                const isGood =
                    f.config.trigger.comparison == "any" ||
                    eval(`${comparisonValue} ${f.config.trigger.comparison} ${f.config.trigger.value}`);

                if (isGood) {
                    sends.push(runFlow(f, comparisonValue, currentTime, f.triggerId));
                }
            } else {
                // Is a Time trigger
                if (currentTime == f.config.trigger.value.time && dayIsGood(f.config.trigger.value.days)) {
                    sends.push(runFlow(f, currentTime, currentTime));
                }
            }
        }
    }

    // Send out the message to the necessary sensors
    if (SEND_TO_SENSOR_FUNC !== null && sends.length > 0) {
        for (let sendIdx = 0; sendIdx < sends.length; sendIdx++) {
            if (sends[sendIdx].to && sends[sendIdx].to.length > 0) {
                for (let i = 0, l = sends[sendIdx].to.length; i < l; i++) {
                    SEND_TO_SENSOR_FUNC(sends[sendIdx].to[i], sends[sendIdx].payload);
                }
            }
        }
    }
}

function runFlow(flow, value, atTime, groupId) {
    const resp = findSensorsToSendTo(flow, value, atTime, groupId);

    // Update the flow ActivationCount in the DB
    DBHelper.increaseFlowRunCount(flow.id);

    return resp;
}

module.exports.handleSensorUpdate = (sensorId, newValue) => {
    let resp = [];

    // Make sure that the system is ready before checking
    // any Flows.
    if (IS_READY && SETTINGS.flowsEnabled === "on") {
        const currentTime = getCurrentTime();
        const flowsToCheck = ALL_FLOWS["Sensor"];

        for (let i = 0, l = flowsToCheck.length; i < l; i++) {
            // Check for ID match
            if (flowsToCheck[i].triggerId == sensorId) {
                // Check for "logic" validation
                const f = flowsToCheck[i];

                // Yuck. But otherwise how?
                const isGood =
                    f.config.trigger.comparison == "any" || eval(`${newValue} ${f.config.trigger.comparison} ${f.config.trigger.value}`);

                if (isGood) {
                    resp = runFlow(flowsToCheck[i], newValue, currentTime);
                }
            }
        }
    }

    return resp;
};

module.exports.setSendMessageFunction = callback => {
    SEND_TO_SENSOR_FUNC = callback;
};
