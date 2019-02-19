// Import the config file
const config = require("../../web_server/config.json");
const path = require("path");
const dataTypes = require("./dataTypeHelper");

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
const createSensorsStmt = db.prepare(
    `CREATE TABLE IF NOT EXISTS "Sensors" ( "id" UUID PRIMARY KEY, "name" TEXT NOT NULL, "dataType" TEXT NOT NULL, "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL )`
);
const createGroupsStmt = db.prepare(
    `CREATE TABLE IF NOT EXISTS "Groups" ("id" UUID PRIMARY KEY, "name" TEXT NOT NULL, "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL)`
);
const createLogEntriesStmt = db.prepare(
    `CREATE TABLE IF NOT EXISTS "LogEntries" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "timestamp" DATETIME NOT NULL, "value" VARCHAR(255) NOT NULL, "createdAt" DATETIME NOT NULL, "SensorId" UUID REFERENCES "Sensors" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`
);
const createSensorsGroupsStmt = db.prepare(
    `CREATE TABLE IF NOT EXISTS "SensorGroups" ("createdAt" DATETIME NOT NULL, "SensorId" UUID NOT NULL REFERENCES "Sensors" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "GroupId" UUID NOT NULL REFERENCES "Groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("SensorId", "GroupId"))`
);
const createSettingsStmt = db.prepare(
    `CREATE TABLE IF NOT EXISTS "Settings" ( "key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "type" TEXT NOT NULL, "description" TEXT )`
);

//TODO: Add create statement for Flows table

const setupTransaction = db.transaction(() => {
    createSensorsStmt.run();
    createGroupsStmt.run();

    createSensorsGroupsStmt.run();
    createLogEntriesStmt.run();

    createSettingsStmt.run();

    //TODO: Run create statement for Flows table
});
setupTransaction();

///////

// Checks to see if all entries in `toCheck` exist in the DB.
//
// `toCheck` is an array with the format of [{table: TABLE_NAME,id: PRIMARY_KEY_VALUE},...]
//
function checkExists(toCheck) {
    for (var i = 0, l = toCheck.length; i < l; i++) {
        var t = toCheck[i];
        if (db.prepare(`SELECT id from ${t.table} WHERE id = '${t.id}'`).get() === undefined) {
            return false;
        }
    }
    return true;
}
module.exports.checkExists = checkExists;

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

// Pull `columns` (array) from `table`, with a limit of `limit` per page,
// starting from page `page` (0-indexed).
//
// TODO: Be able to "WHERE" this.
//
module.exports.findAndCountPaginated = (table, columns, where = [], page = 0, limit = 10) => {
    var toPrepare = `SELECT ${columns.join(",")} FROM ${table} `;
    if (where.length !== 0) {
        toPrepare += "WHERE ";
        for (var i = 0, l = where.length; i < l; i++) {
            toPrepare += `${i > 0 ? " AND" : ""} ${where[i]}`;
        }
    }
    toPrepare += ` LIMIT ${limit} OFFSET ${page * limit}`;
    console.log(toPrepare);
    var stmt = db.prepare(toPrepare);
    var count = db.prepare(`SELECT COUNT(${columns[0]}) AS total FROM ${table}`);

    var rows = stmt.all();

    var totalRows = count.get().total;
    return {
        rows: rows,
        total: totalRows,
        totalPages: Math.ceil(totalRows / limit) - 1,
        page: page,
        limit: limit
    };
};

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
        console.log(data);
        if (data.GroupId) {
            sensors[sensorIdx[data.SensorId]].groups.push(data);
        }
    }

    console.log("-------------");

    console.log(sensors);

    return sensors;
};
const getAllSensorsMetadataStmt = db.prepare(`SELECT id, name, dataType, updatedAt FROM Sensors ORDER BY Sensors.createdAt`);
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
const getMetadataForSensorStmt = db.prepare(`SELECT name, dataType, updatedAt FROM Sensors WHERE id = ?`);
const getLogsForSensorStmt = db.prepare(
    `SELECT id,timestamp,value,createdAt,SensorId FROM LogEntries
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
// with ID `sensorId`
//
module.exports.getLogsForSensor = sensorId => {
    return getLogsForSensorStmt.all(sensorId);
};

// Creates a new Sensor with the given `name` (or "New Sensor")
// and `dataType` ("float","int","string","blob","uuid","datetime").
//
// Will return the new sensor's ID if successful or already exists.
//
module.exports.addSensor = (name = "New Sensor", dataType, id = undefined) => {
    var d1 = dateAsUnixTimestamp();

    dataType = dataType.toLowerCase();

    // Check to see if it already exists,
    // return early.
    var current = getSensorByIdStmt.get(id);
    if (current && current.id !== undefined) {
        return id;
    }

    // Validate data types
    if (!dataTypes.possibleDataTypes.includes(dataType)) {
        return `ERROR:: Invalid dataType field, must be one of: ${dataTypes.possibleDataTypes.join(",")}.`;
    }

    const newSensor = {
        id: id || newUUID(),
        name: name,
        dataType: dataType,
        createdAt: d1,
        updatedAt: d1
    };

    if (insertSensorStmt.run(newSensor).changes === 1) {
        return newSensor.id;
    }
};
const insertSensorStmt = db.prepare(
    `INSERT INTO Sensors(id,name,dataType,createdAt,updatedAt)
    VALUES (@id,@name,@dataType,@createdAt,@updatedAt)`
);
const getSensorByIdStmt = db.prepare("SELECT * FROM Sensors WHERE id = ?");

// Allows updating of a sensor's `name` and `dataType` columns.
//
// Will return an error (as a string) if the `sensorId` does
// not exist, or a 1 if the changes were a success.
//
module.exports.updateSensor = (sensorId, name, dataType) => {
    var d1 = dateAsUnixTimestamp();

    var currentSensor = getSensorByIdStmt.get(sensorId);
    if (currentSensor !== undefined) {
        currentSensor.name = name || currentSensor.name;
        currentSensor.dataType = dataType || currentSensor.dataType;

        // Change `updatedAt` always.
        currentSensor.updatedAt = d1;

        // Will return a high-level `sensor` entry if the change was a success.
        if (updateSensorStmt.run(currentSensor).changes === 1) {
            return { status: 200, meta: currentSensor };
        } else {
            return { status: 500, error: "Error updating sensor in DB" };
        }
    } else {
        return "ERROR::SENSORID_DOES_NOT_EXIST";
    }
};
const updateSensorStmt = db.prepare(
    `UPDATE Sensors
    SET dataType = @dataType,
        name = @name,
        updatedAt = @updatedAt
    WHERE id = @id`
);

// For adding a sensor to a given group.
//
// If successful, will return all groups for the given sensor.
//
module.exports.addSensorToGroup = (sensorId, groupId) => {
    var now = dateAsUnixTimestamp();

    if (checkExists([{ table: "Sensors", id: sensorId }, { table: "Groups", id: groupId }])) {
        var newLink = {
            SensorId: sensorId,
            GroupId: groupId,
            createdAt: now
        };
        if (addSensorToGroupStmt.run(newLink).changes === 1) {
            // Link was created
            return { status: 200, groups: getGroupsforSensorStmt.all(sensorId) };
        } else {
            return { status: 500, error: "Error adding sensor to group in DB" };
        }
    } else {
        return { status: 500, error: "SENSOR_OR_GROUP_DOES_NOT_EXIST" };
    }
};
const addSensorToGroupStmt = db.prepare(`INSERT INTO SensorGroups(SensorId,GroupId,createdAt) VALUES (@SensorId,@GroupId,@createdAt)`);

// For removing a sensor from a given group.
//
// If successful, will return all groups for the given sensor.
//
module.exports.removeSensorFromGroup = (sensorId, groupId) => {
    if (checkExists([{ table: "Sensors", id: sensorId }, { table: "Groups", id: groupId }])) {
        var link = {
            SensorId: sensorId,
            GroupId: groupId
        };
        if (removeSensorFromGroupStmt.run(link).changes === 1) {
            // Link was removed
            return { status: 200, groups: getGroupsforSensorStmt.all(sensorId) };
        } else {
            return { status: 500, error: "Error removing sensor from group in DB" };
        }
    } else {
        return { status: 500, error: "SENSOR_OR_GROUP_DOES_NOT_EXIST" };
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

// Creates a new Group with the given `name` (or "New Group").
//
//
module.exports.listAllGroups = () => {
    return listAllGroupsStmt.all();
};
const listAllGroupsStmt = db.prepare(`SELECT  g.id, g.name, g.updatedAt, count(sg.SensorId) as sensorCount
FROM Groups as g
LEFT JOIN SensorGroups as sg
ON g.id = sg.GroupId
GROUP BY g.id
ORDER BY g.createdAt`);

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
const getGroupByIdStmt = db.prepare("SELECT * FROM Groups WHERE id = ?");

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
createGroupFunc = (id, name) => {
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
    return getAllFlowsStmt.all();
};
const getAllFlowsStmt = db.prepare(`SELECT id, name, description FROM Flows`);
module.exports.getFlowByName = name => {
    let res = getFlowByNameStmt.get(name);
    if (res) {
        return { status: 200, flow: res };
    }
    return { status: 400, error: `Flow with name "${name}" does not exist` };
};
const getFlowByNameStmt = db.prepare(`SELECT * FROM Flows WHERE name = ?`);
module.exports.getFlowById = id => {
    let res = getFlowByIdStmt.get(id);
    if (res) {
        return { status: 200, flow: res };
    }
    return { status: 400, error: `Flow with ID "${name}" does not exist` };
};
const getFlowByIdStmt = db.prepare(`SELECT * FROM Flows WHERE id = ?`);
module.exports.createFlow = name => {
    var d1 = dateAsUnixTimestamp();

    const newFlow = {
        id: newUUID(),
        name: name,
        createdAt: d1,
        updatedAt: d1
    };

    if (makeNewFlowWithNameStmt.run(newFlow).changes === 1) {
        return { status: 200, group: newFlow };
    }
    // else
    return { status: 500, error: `The server was unable to create a new flow` };
};
const makeNewFlowWithNameStmt = db.prepare(
    `INSERT INTO Flows(id,name,createdAt,updatedAt)
    VALUES (@id,@name,@createdAt,@updatedAt)`
);
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
module.exports.logData = (value, sensorUUID, timestamp) => {
    if (timestamp === undefined && config.allowEmptyTimestamp === false) {
        console.error(
            `Timestamp was not provided for LogEntry when required by the server.\n\nNot logging: {value: ${value}, sensorUUID: ${sensorUUID}}`
        );
        return;
    }
    const currentTime = dateAsUnixTimestamp();
    const logEntry = {
        value: value,
        timestamp: timestamp || currentTime,
        SensorId: sensorUUID,
        createdAt: currentTime
    };
    // Will return 1 if the change was a success.
    return insertLogEntryStmt.run(logEntry).changes;
};
const insertLogEntryStmt = db.prepare(
    `INSERT INTO LogEntries(value,timestamp,SensorId,createdAt)
    VALUES (@value,@timestamp,@SensorId,@createdAt)`
);
