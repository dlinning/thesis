// Import the config file
const config = require("../../web_server/config.json");
const path = require("path");

// Import and Setup helper functions
const uuidv4 = require("uuid/v4");
const newUUID = () => uuidv4().toString();
const dateAsUnixTimestamp = (d = new Date()) => Math.round(d.getTime() / 1000);
module.exports.dateAsUnixTimestamp = dateAsUnixTimestamp;

// Setup DB requires / exit handling
const Database = require("better-sqlite3");
const db = new Database(path.join(__dirname, "..", config.db.filepath), {
    readonly: false
});
process.on("exit", () => db.close());

// Will build the tables of the database
// if they do not exist.
//
const createStmts = require("./dbCreateStatements");
const setupDBTransaction = db.transaction(() => {
    Object.keys(createStmts).forEach(stmt => {
        db.prepare(createStmts[stmt]).run();
    });
});
setupDBTransaction();

///////

// Checks an object (or returned DB row) to
// see if all of its values are null.
// Returns false if at least one property != null
//
function propertiesAllNull(obj) {
    for (var key in obj) {
        if (obj[key] !== null && obj[key] != "") return false;
    }
    return true;
}

// Allows data to be aggregated into one object,
// based off of a key.
//
// If `alpha = { A: {C: true}, B: {C: false} }` then
// `bravo = groupBy( [  {ID: "A", data: [1,2,3,4,5]},
//                      { ID: "B", data: [7, 8, 9] }
//                   ], "ID", "PAYLOAD", true, alpha )`
// would result in `bravo = {
//                      A: { C: true, PAYLOAD: [1, 2, 3, 4, 5] },
//                      B: { C: false, PAYLOAD: [7, 8, 9] }
//                  }`
//
function groupBy(rows, fieldName, asKey, appendTo = {}, skipNull = true, dropKey = true, breakOutSingleArray = false) {
    var res = appendTo;

    for (var n = 0, l = rows.length; n < l; n++) {
        let group = rows[n][fieldName];
        var clone = Object.assign({}, rows[n]);
        dropKey && delete clone[fieldName];

        if (res[group] === undefined) {
            res[group] = {};
        }
        if (res[group][asKey] === undefined) {
            res[group][asKey] = [];
        }

        if (skipNull && propertiesAllNull(clone)) {
            // Skip
        } else {
            res[group][asKey].push(clone);
        }

        if (breakOutSingleArray && res[group][asKey].length === 1) {
            res[group][asKey] = res[group][asKey][0];
        }
    }
    return res;
}

// Returns all logs and groups for all sensors,
// in an object keyed by each sensor's ID.
//
module.exports.logCountAndGroupsForAllSensors = () => {
    let sensors = getAllSensorsMetadataStmt.all(),
        logCounts = getLogCountsForSensorsStmt.all(),
        groups = getSensorsForGroupsStmt.all();

    let sensorIdx = {};
    for (var i = 0, len = sensors.length; i < len; i++) {
        let sensor = sensors[i];
        sensorIdx[sensor.id] = i;
        sensor.groups = [];
        sensor.logCount = 0;
    }

    for (var i = 0, len = logCounts.length; i < len; i++) {
        let data = logCounts[i],
            sensor = sensors[sensorIdx[data.SensorId]];

        sensor.logCount = data.count;
    }
    for (var i = 0, len = groups.length; i < len; i++) {
        let data = groups[i];
        if (data.GroupId) {
            sensors[sensorIdx[data.SensorId]].groups.push(data);
            delete data.SensorId;
        }
    }

    return sensors;
};
const getAllSensorsMetadataStmt = db.prepare(`SELECT id, name, updatedAt FROM Sensors ORDER BY Sensors.createdAt`);
const getLogCountsForSensorsStmt = db.prepare(`SELECT count(id) as count,SensorId FROM LogEntries GROUP BY SensorId`);
const getSensorsForGroupsStmt = db.prepare(
    `SELECT Sensors.id as SensorId, Groups.id as GroupId, Groups.name as GroupName
    FROM Sensors
    LEFT JOIN SensorGroups ON SensorGroups.SensorId = Sensors.id
    LEFT JOIN Groups ON Groups.id = SensorGroups.GroupId`
);
const getSensorCountForGroupStmt = db.prepare(
    `SELECT count(SensorId) as count 
    FROM SensorGroups
    WHERE GroupId = ?`
);

// Simple wrapper around `getSensorsForGroups` query above.
// Split off as `getLogsForSensors` may result in a large
// payload, when all data is not needed.
//
module.exports.groupsForAllSensors = () => {
    var data = listAllSensorsGroupsStmt.all();
    groupBy(getSensorsForGroupsStmt.all(), "GroupId", "sensors", true, data);
    return data;
};

// Given `sensorId`, will return all logs and groups
// for the specific sensor.
//
module.exports.logsAndGroupsForSensorId = sensorId => {
    var data = groupBy(getGroupsforSensorStmt.all(sensorId), "SensorId", "groups", true);
    groupBy(getLogsForSensorStmt.all(sensorId), "SensorId", "logs", true, data);
    return data;
};
const getGroupsforSensorStmt = db.prepare(
    `SELECT g.id, g.name FROM Sensors as s INNER JOIN SensorGroups as sg ON s.id = sg.SensorId INNER JOIN Groups as g ON g.id = sg.GroupId WHERE s.id = ? ORDER BY g.createdAt`
);
const getMetadataForSensorStmt = db.prepare(`SELECT name, updatedAt FROM Sensors WHERE id = ?`);
const getLogsForSensorStmt = db.prepare(
    `SELECT * FROM LogEntries
    WHERE SensorId = ?`
);

// Simple wrapper around `getGroupsforSensor` query above.
// Returns groupId and groupName for all groups the specific
// sensor with ID `sensorID` belongs to.
//
module.exports.getGroupsForSensor = sensorId => {
    return getGroupsforSensorStmt.all(sensorId);
};

// Simple wrapper around `getLogsForSensor` query above.
// Returns data for all logs for the specific sensor
// with ID `sensorId`.
//
module.exports.getLogsForSensor = sensorId => {
    return getLogsForSensorStmt.all(sensorId);
};

// Simple wrapper around `getLogCountsForSensorsStmt` query above.
//
module.exports.getAllSensorLogCounts = () => {
    let logCounts = getLogCountsForSensorsStmt.all();

    return logCounts;
};

// Creates a new Sensor.
//
// Will return the new sensor's ID if successful or already exists.
//
module.exports.addSensor = (id = undefined) => {
    var d1 = dateAsUnixTimestamp();

    // Check to see if it already exists,
    // return early.
    var current = getSensorByIdStmt.get(id);
    if (current !== undefined) {
        return id;
    }

    const newSensor = {
        id: id || newUUID(),
        name: "Sensor_" + d1.toString().substring(4),
        createdAt: d1,
        updatedAt: d1
    };

    if (insertSensorStmt.run(newSensor).changes === 1) {
        return newSensor.id;
    }
};
const insertSensorStmt = db.prepare(
    `INSERT INTO Sensors(id,name,createdAt,updatedAt)
    VALUES (@id,@name,@createdAt,@updatedAt)`
);
const getSensorByIdStmt = db.prepare("SELECT * FROM Sensors WHERE id = ?");

// Allows updating of a sensor's `name` column.
//
// Will return an error (as a string) if the `sensorId` does
// not exist, or a 1 if the changes were a success.
//
module.exports.updateSensor = (sensorId, name) => {
    var d1 = dateAsUnixTimestamp();

    var currentSensor = getSensorByIdStmt.get(sensorId);
    if (currentSensor !== undefined) {
        currentSensor.name = name || currentSensor.name;

        // Change `updatedAt` always.
        currentSensor.updatedAt = d1;

        // Will return a high-level `sensor` entry if the change was a success.
        if (updateSensorStmt.run(currentSensor).changes === 1) {
            return { status: 200, updatedSensor: getSensorByIdStmt.get(sensorId) };
        } else {
            return { status: 500, error: "Error updating sensor in DB" };
        }
    } else {
        return "ERROR::SENSORID_DOES_NOT_EXIST";
    }
};
const updateSensorStmt = db.prepare(
    `UPDATE Sensors
    SET name = @name,
        updatedAt = @updatedAt
    WHERE id = @id`
);

// For adding a sensor to a given group.
//
// If successful, will return all groups for the given sensor.
//
module.exports.addSensorToGroup = (sensorId, groupId) => {
    if (
        addSensorToGroupStmt.run({
            SensorId: sensorId,
            GroupId: groupId,
            createdAt: dateAsUnixTimestamp()
        }).changes === 1
    ) {
        // Link was created
        return { status: 200, groups: getGroupsforSensorStmt.all(sensorId) };
    } else {
        return { status: 500, error: "Error adding sensor to group in DB" };
    }
};
const addSensorToGroupStmt = db.prepare(
    `INSERT OR REPLACE INTO SensorGroups(SensorId,GroupId,createdAt) VALUES (@SensorId,@GroupId,@createdAt)`
);

// For removing a sensor from a given group.
//
// If successful, will return all groups for the given sensor.
//
module.exports.removeSensorFromGroup = (sensorId, groupId) => {
    if (
        removeSensorFromGroupStmt.run({
            SensorId: sensorId,
            GroupId: groupId
        }).changes === 1
    ) {
        // Link was removed
        return { status: 200, groups: getGroupsforSensorStmt.all(sensorId) };
    } else {
        return { status: 500, error: "Error removing sensor from group in DB" };
    }
};
const removeSensorFromGroupStmt = db.prepare(`DELETE FROM SensorGroups WHERE SensorId = @SensorId AND GroupId = @GroupId`);

module.exports.getSensorMeta = sensorId => {
    var res = getMetadataForSensorStmt.get(sensorId);

    var groups = getGroupsforSensorStmt.all(sensorId);

    res.groups = groups;

    return res;
};

// For Deleting a sensor from the database
//
// If successful, will return all groups for the given sensor.
//
module.exports.deleteSensor = (sensorId, deleteWithLogs = false) => {
    var currentSensor = getSensorByIdStmt.get(sensorId);

    if (currentSensor !== undefined) {
        currentSensor.hasLogs = getLogsForSensorStmt.get(sensorId) !== undefined;

        if (currentSensor.hasLogs === true && deleteWithLogs === false) {
            // Will NOT delete the sensor if it has logs
            // and`deleteWithLogs` is false
            return { status: 200, sensor: currentSensor };
        } else {
            // Either it has no logs, or `deleteWithLogs` is true
            // so delete the sensor
            deleteSensorStmt.run(sensorId);
            // The sensor should now be `undefined`,
            // meaning the delte was a success
            currentSensor = getSensorByIdStmt.get(sensorId);
            return { status: 200, sensor: currentSensor };
        }
    } else {
        return { status: 400, error: `Sensor does not exist with ID ${id}` };
    }
};
const deleteSensorStmt = db.prepare(`DELETE FROM Sensors WHERE id = ?`);

//
//
//
//
//
//
//
//
//
//

module.exports.listAllGroups = () => {
    return listAllGroupsStmt.all();
};
const listAllGroupsStmt = db.prepare(`SELECT * FROM GroupListWithSensorAndLogCount`);

// Used mainly by the flowRunner, but also exposed via API.
// Used for analysis of aggregate group data.
module.exports.getLatestGroupSumAndAvg = (groupId = undefined) => {
    let groups = getLatestGroupSumAndAvgStmt.all();
    let res = { atTime: new Date() };

    // Looking for all group data, so add the necessary
    // property to the response object.
    if (!groupId) {
        res.groups = {};
    }

    for (let i = 0, l = groups.length; i < l; i++) {
        let g = groups[i];
        if (groupId && groupId == g.id) {
            res.group = g;
            break;
        } else if (!groupId) {
            // Trying to get all data
            res.groups[g.id] = {
                name: g.name,
                sum: g.valueSum,
                avg: g.valueAvg,
                count: g.valueCount
            };
        }
    }

    return res;
};
const getLatestGroupSumAndAvgStmt = db.prepare("SELECT * FROM GroupLatestSumAndAvg");

// "Helper" for both `createGroupFunc` and `updateGroupFunc`, so there
// is only one entry point necessary for both
module.exports.createOrUpdateGroup = (groupId = newUUID(), name) => {
    if (getGroupByIdStmt.get(groupId)) {
        // Group exists, update name;
        return updateGroupFunc(groupId, name);
    } else {
        return createGroupFunc(groupId, name);
    }
};
const getGroupByIdStmt = db.prepare("SELECT * FROM GroupListWithSensorAndLogCount WHERE id = ?");

// Allows updating of a groups's `name`.
//
// Will return an error, or the new group data if the change
// was successful
//
updateGroupFunc = (groupId, name) => {
    var d1 = dateAsUnixTimestamp();

    var currentGroup = getGroupByIdStmt.get(groupId);
    if (currentGroup !== undefined) {
        currentGroup.name = name || currentGroup.name;

        // Change `updatedAt` always.
        currentGroup.updatedAt = d1;

        if (updateGroupStmt.run(currentGroup).changes === 1) {
            return { status: 200, group: currentGroup };
        } else {
            return { status: 500, error: `The server was unable to rename the group in the database` };
        }
    } else {
        return { status: 500, error: `Group with id ${groupId} does not exist` };
    }
};
const updateGroupStmt = db.prepare(
    `UPDATE Groups
    SET name = @name,
        updatedAt = @updatedAt
    WHERE id = @id`
);

// Allows creating of a new group.
//
// Will return the new group's ID, or if one with the same
// `id` already exists, will just return the ID.
//
const createGroupFunc = (id, name) => {
    var d1 = dateAsUnixTimestamp();

    // Check to see if it already exists,
    // return early.
    var current = getGroupByIdStmt.get(id);
    if (current && current.id !== undefined) {
        return id;
    }

    const newGroup = {
        id: id,
        name: name,
        createdAt: d1,
        updatedAt: d1
    };

    if (insertGroupStmt.run(newGroup).changes === 1) {
        return { status: 200, group: newGroup };
    }
    // else
    return { status: 500, error: `The server was unable to create a new group` };
};
const insertGroupStmt = db.prepare(
    `INSERT INTO Groups(id,name,createdAt,updatedAt)
    VALUES (@id,@name,@createdAt,@updatedAt)`
);

// For Deleting a sensor from the database
//
// If successful, will return all groups for the given sensor.
//
module.exports.deleteGroup = (groupId, deleteWithSensors = false) => {
    var group = getGroupByIdStmt.get(groupId);

    if (group !== undefined) {
        group.hasSensors = getSensorCountForGroupStmt.get(groupId).count > 0;
        if (group.hasSensors === true && deleteWithSensors === false) {
            // Will NOT delete the group if it has sensors in it
            // and`deleteWithSensors` is false
            return { status: 200, group: group };
        } else {
            // Either it has no sensors, or `deleteWithSensors` is true
            // so delete the group
            deleteGroupStmt.run(groupId);
            // The sensor should now be `undefined`,
            // meaning the delte was a success
            group = getGroupByIdStmt.get(groupId);
            return { status: 200, group: group };
        }
    } else {
        return { status: 400, error: `Group does not exist with ID ${groupId}` };
    }
};
const deleteGroupStmt = db.prepare(`DELETE FROM Groups WHERE id = ?`);

module.exports.getLogsForGroup = groupId => {
    return getLogsForGroupStmt.all(groupId);
};
const getLogsForGroupStmt = db.prepare(
    `SELECT
    le.id as logId,
    le.SensorId as sensorId,
	le.value as value,
	le.timestamp as timestamp
FROM
	Sensors s,
	SensorGroups sg,
	(SELECT * FROM LogEntries) le
WHERE
	sg.GroupId = ? AND
	sg.SensorId = le.SensorId AND
	s.id = sg.SensorId`
);

// Used by flowRunner
module.exports.getSensorIdsByGroupId = groupId => {
    return getSensorIdsByGroupIdStmt(groupId).all();
};
const getSensorIdsByGroupIdStmt = db.prepare("SELECT SensorId FROM SensorGroups WHERE GroupId = ?");

//
//
//
//
//
//
//
//
//
//

module.exports.getAllSettings = () => {
    return getSettingsStmt.all();
};
const getSettingsStmt = db.prepare(`SELECT * FROM Settings`);

module.exports.getSpecificSetting = name => {
    var res = getSettingByNameStmt.get(name);
    if (res) {
        return { status: 200, value: res.value };
    }
    return { status: 400, error: `Setting with name "${name}" does not exist` };
};
const getSettingByNameStmt = db.prepare(`SELECT * FROM Settings WHERE key = ?`);

// This only returns the specific values for the settings
// in the given group.
module.exports.getSettingsByGroup = groupName => {
    var res = getSettingByGroupStmt.all(groupName);
    if (res) {
        let settings = {};
        res.forEach(s => {
            settings[s.key] = s.value;
        });

        return { status: 200, group: groupName, settings: settings };
    }
    return { status: 400, error: `There are no settings in group ${groupName}` };
};
const getSettingByGroupStmt = db.prepare(`SELECT * FROM Settings WHERE inGroup = ?`);

module.exports.modifySetting = (name, newValue) => {
    var res = modifySettingByNameStmt.run(newValue, name);
    if (res.changes === 1) {
        return { status: 200 };
    }
    return { status: 400, error: `Setting does not exist with name ${name}` };
};
const modifySettingByNameStmt = db.prepare(`UPDATE Settings SET value = ? WHERE key = ?`);

//
//
//
//
//
//
//
//
//
//

module.exports.getAllFlows = () => {
    let allFlows = getAllFlowsStmt.all();
    for (let i = 0, l = allFlows.length; i < l; i++) {
        if (allFlows[i].config) {
            allFlows[i].config = JSON.parse(allFlows[i].config);
        }
    }
    return allFlows;
};
const getAllFlowsStmt = db.prepare(`SELECT * FROM Flows`);
module.exports.getFlowByName = name => {
    let res = getFlowByNameStmt.get(name);
    if (res) {
        if (res.config) {
            res.config = JSON.parse(res.config);
        }
        return { status: 200, flow: res };
    }
    return { status: 400, error: `Flow with name "${name}" does not exist` };
};
const getFlowByNameStmt = db.prepare(`SELECT * FROM Flows WHERE name = ?`);
module.exports.getFlowById = id => {
    let res = getFlowByIdStmt.get(id);
    if (res) {
        if (res.config) {
            res.config = JSON.parse(res.config);
        }
        return { status: 200, flow: res };
    }
    return { status: 400, error: `Flow with ID "${name}" does not exist` };
};
const getFlowByIdStmt = db.prepare(`SELECT * FROM Flows WHERE id = ?`);
module.exports.createFlow = data => {
    var d1 = dateAsUnixTimestamp();

    const newFlow = {
        id: newUUID(),
        name: data.name,
        description: data.description,
        triggerType: data.trigger.type,
        // Have to account for Time type
        triggerId: data.trigger.type !== "Time" ? data.trigger.id : data.trigger.value.time,

        activationCount: 0,
        createdAt: d1,
        updatedAt: d1
    };

    delete data.name;
    delete data.description;
    delete data.id;

    newFlow.config = JSON.stringify(data);

    if (makeNewFlowStmt.run(newFlow).changes === 1) {
        return { status: 200, flow: newFlow };
    }
    // else
    return { status: 500, error: `The server was unable to create a new flow` };
};
const makeNewFlowStmt = db.prepare(
    `INSERT INTO Flows(id,name,description,triggerType,triggerId,activationCount,config,createdAt,updatedAt)
    VALUES (@id,@name,@description,@triggerType,@triggerId,@activationCount,@config,@createdAt,@updatedAt)`
);

module.exports.updateFlow = data => {
    let originalFlow = getFlowByIdStmt.get(data.id);

    if (originalFlow) {
        originalFlow.name = data.name;
        originalFlow.description = data.description;
        originalFlow.triggerType = data.trigger.type;

        // Have to account for Time type
        originalFlow.triggerId = data.trigger.type !== "Time" ? data.trigger.id : data.trigger.value.time;

        // No longer needed
        delete data.id;
        delete data.name;
        delete data.description;

        originalFlow.config = JSON.stringify(data);

        originalFlow.updatedAt = dateAsUnixTimestamp();
        // Don't update activationCount or createdAt fields

        if (updateFlowStmt.run(originalFlow).changes === 1) {
            return { status: 200, flow: originalFlow };
        }
        // else
        return { status: 500, error: `The server was unable to update Flow with ID ${id}` };
    } else {
        return { status: 400, error: `A Flow does not exist with ID ${id}` };
    }
};
const updateFlowStmt = db.prepare(
    `UPDATE Flows 
        SET name = @name,
            description = @description,
            config = @config,
            triggerType = @triggerType,
            triggerId = @triggerId,
            updatedAt = @updatedAt
        WHERE id = @id
    `
);

module.exports.increaseFlowRunCount = flowId => {
    // Make sure the flow exists
    let flow = getFlowByIdStmt.get(flowId);
    if (flow !== undefined) {
        // Update the count.
        let fields = {
            id: flowId,
            count: flow.activationCount + 1
        }
        increaseFlowRunCountStmt.run(fields);
    }
};
const increaseFlowRunCountStmt = db.prepare(
    `UPDATE Flows 
        SET activationCount = @count
        WHERE id = @id
    `
);

// Will increase the Flow's activation count by 1
module.exports.activateFlow = id => {
    let flow = getFlowByIdStmt.run(id);

    if (flow) {
        if (updateFlowActivationStmt({ newCount: flow.activationCount++, id: id }).changes === 1) {
            return { status: 200, flow: originalFlow };
        } else {
            return { status: 500, error: `The server was unable to update Flow with ID ${id}` };
        }
    } else {
        return { status: 400, error: `A Flow does not exist with ID ${id}` };
    }
};
const updateFlowActivationStmt = db.prepare("UPDATE Flows SET activationCount = @newCount WHERE id = @id");

module.exports.deleteFlowById = id => {
    var flow = getFlowByIdStmt.get(id);

    if (flow !== undefined) {
        deleteFlowByIdStmt.run(id);
        // The Flow should now be `undefined`,
        // meaning the delte was a success
        flow = getFlowByIdStmt.get(id);
        return { status: 200, flow: flow };
    } else {
        return { status: 400, error: `Flow does not exist with ID ${id}` };
    }
};
const deleteFlowByIdStmt = db.prepare(`DELETE FROM Flows WHERE id = ?`);

module.exports.getGroupAndSensorDataForFlows = () => {
    return {
        sensors: getSensorDataForFlowsStmt.all(),
        groups: getGroupDataForFlowsStmt.all()
    };
};
const getSensorDataForFlowsStmt = db.prepare(`SELECT id,name from Sensors`);
const getGroupDataForFlowsStmt = db.prepare(`SELECT id,name from Groups`);

//
//
//
//
//
//
//
//
//
//

// Logs data for a sensors with sensorId `id`
//
module.exports.logData = (value, sensorUUID, dataType, timestamp) => {
    const logEntry = {
        value: value,
        timestamp: timestamp || new Date().toString(),
        SensorId: sensorUUID,
        dataType: dataType
    };
    // Will return 1 if the change was a success.
    return insertLogEntryStmt.run(logEntry).changes;
};
const insertLogEntryStmt = db.prepare(
    `INSERT INTO LogEntries(value,timestamp,SensorId,dataType)
    VALUES (@value,@timestamp,@SensorId,@dataType)`
);
