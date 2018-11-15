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
const createSensors = db.prepare(
	`CREATE TABLE IF NOT EXISTS "Sensors" ( "id" UUID, "name" TEXT NOT NULL, "dataType" TEXT NOT NULL, "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL, PRIMARY KEY("id") )`
);
const createGroups = db.prepare(
	`CREATE TABLE IF NOT EXISTS "Groups" ("id" UUID PRIMARY KEY, "name" VARCHAR(255) NOT NULL, "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL)`
);
const createLogEntries = db.prepare(
	`CREATE TABLE IF NOT EXISTS "LogEntries" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "timestamp" DATETIME NOT NULL, "value" VARCHAR(255) NOT NULL, "createdAt" DATETIME NOT NULL, "SensorId" UUID REFERENCES "Sensors" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`
);
const createSensorsGroups = db.prepare(
	`CREATE TABLE IF NOT EXISTS "SensorGroups" ("createdAt" DATETIME NOT NULL, "SensorId" UUID NOT NULL REFERENCES "Sensors" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "GroupId" UUID NOT NULL REFERENCES "Groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("SensorId", "GroupId"))`
);
const createSettings = db.prepare(
	`CREATE TABLE IF NOT EXISTS "Settings" ( "key" TEXT, "value" TEXT, PRIMARY KEY("key") )`
);

const setupTransaction = db.transaction(() => {
	createSensors.run();
	createGroups.run();
	createLogEntries.run();
	createSensorsGroups.run();
	createSettings.run();
});
setupTransaction();

///////

// Checks to see if all entries in `toCheck` exist in the DB.
//
// `toCheck` is an array with the format of [{table: TABLE_NAME,id: PRIMARY_KEY_VALUE},...]
//
function checkExists(toCheck) {
	console.log(toCheck);
	for (var i = 0, l = toCheck.length; i < l; i++) {
		var t = toCheck[i];
		if (
			db.prepare(`SELECT id from ${t.table} WHERE id = '${t.id}'`).get() ===
			undefined
		) {
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
function groupBy(
	rows,
	fieldName,
	asKey,
	appendTo = {},
	skipNull = true,
	dropKey = true,
	breakOutSingleArray = false
) {
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
module.exports.findAndCountPaginated = (
	table,
	columns,
	where = [],
	page = 0,
	limit = 10
) => {
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
module.exports.logsAndGroupsForAllSensors = () => {
	var res = groupBy(getLogsForSensors.all(), "SensorId", "logs", {}, true);

	groupBy(getAllSensorsMetadata.all(), "id", "meta", res, true, false, true);

	groupBy(listAllSensorsGroups.all(), "SensorId", "groups", res);

	return res;
};
const getAllSensorsMetadata = db.prepare(
	`SELECT id, name, dataType, updatedAt FROM Sensors`
);
const getLogsForSensors = db.prepare(
	`SELECT id,timestamp,value,createdAt,SensorId FROM LogEntries`
);
const listAllSensorsGroups = db.prepare(
	`SELECT Sensors.id as SensorId, Groups.id as GroupId, Groups.name as GroupName
    FROM Sensors
    LEFT JOIN SensorGroups ON SensorGroups.SensorId = Sensors.id
    LEFT JOIN Groups ON Groups.id = SensorGroups.GroupId`
);

// Simple wrapper around `listAllSensorsGroups` query above.
// Split off as `getLogsForSensors` may result in a large
// payload, when all data is not needed.
//
module.exports.groupsForAllSensors = () => {
	return listAllSensorsGroups.all();
};

// Given `sensorId`, will return all logs and groups
// for the specific sensor.
//
module.exports.logsAndGroupsForSensorId = sensorId => {
	var data = groupBy(
		getGroupsforSensor.all(sensorId),
		"SensorId",
		"groups",
		true
	);
	groupBy(getLogsForSensor.all(sensorId), "SensorId", "logs", true, data);
	return data;
};
const getGroupsforSensor = db.prepare(
	`SELECT Groups.id as GroupId, Groups.name as GroupName, Sensors.id as SensorId
    FROM Sensors
    LEFT JOIN SensorGroups ON SensorGroups.SensorId = Sensors.id
    LEFT JOIN Groups ON Groups.id = SensorGroups.GroupId
    WHERE Sensors.id = ?`
);
const getLogsForSensor = db.prepare(
	`SELECT id,timestamp,value,createdAt,SensorId FROM LogEntries
    WHERE SensorId = ?`
);

// Simple wrapper around `getGroupsforSensor` query above.
// Returns groupId and groupName for all groups the specific
// sensor with ID `sensorID` belongs to.
//
module.exports.getGroupsForSensor = sensorId => {
	return getGroupsforSensor.all(sensorId);
};

// Simple wrapper around `getLogsForSensor` query above.
// Returns data for all logs for the specific sensor
// with ID `sensorId`
//
module.exports.getLogsForSensor = sensorId => {
	return getLogsForSensor.all(sensorId);
};

// Creates a new Sensor with the given `name` (or "New Sensor")
// and `dataType` ("float","int","string","blob","uuid","datetime").
//
// Will return the new sensor's ID if successful or already exists.
//
module.exports.addSensor = (name = "New Sensor", dataType, id = undefined) => {
	var d1 = dateAsUnixTimestamp();

	// Check to see if it already exists,
	// return early.
	var current = getSensorById.get(id);
	if (current && current.id !== undefined) {
		return id;
	}

	const newSensor = {
		id: id || newUUID(),
		name: name,
		dataType: dataType.toLowerCase(),
		createdAt: d1,
		updatedAt: d1
	};

	if (insertSensor.run(newSensor).changes === 1) {
		return newSensor.id;
	}
};
const insertSensor = db.prepare(
	`INSERT INTO Sensors(id,name,dataType,createdAt,updatedAt)
    VALUES (@id,@name,@dataType,@createdAt,@updatedAt)`
);
const getSensorById = db.prepare("SELECT * FROM Sensors WHERE id = ?");

// Allows updating of a sensor's `name` and `dataType` columns.
//
// Will return an error (as a string) if the `sensorId` does
// not exist, or a 1 if the changes were a success.
//
module.exports.updateSensor = (sensorId, name, dataType) => {
	var d1 = dateAsUnixTimestamp();

	var currentSensor = getSensorById(sensorId).get();
	if (currentSensor !== undefined) {
		currentSensor.name = name || currentSensor.name;
		currentSensor.dataType = dataType || currentSensor.dataType;

		// Change `updatedAt` always.
		currentSensor.updatedAt = d1;

		// Will return 1 if the change was a success.
		return updateSensor.run(currentSensor).changes;
	} else {
		return "ERROR::SENSORID_DOES_NOT_EXIST";
	}
};
const updateSensor = db.prepare(
	`UPDATE Sensors
    SET dataType = @dataType,
        name = @name,
        updatedAt = @updatedAt
    WHERE id = @id`
);

// Allows updating of a sensor's `name` and `dataType` columns.
//
// Will return an error (as a string) if the `sensorId` does
// not exist, or a 1 if the changes were a success.
//
module.exports.addSensorToGroup = (sensorId, groupId) => {
	var now = dateAsUnixTimestamp();

	if (
		checkExists([
			{ table: "Sensors", id: sensorId },
			{ table: "Groups", id: groupId }
		])
	) {
		var newLink = {
			SensorId: sensorId,
			GroupId: groupId,
			createdAt: now
		};
		return addSensorToGroup.run(newLink).changes;
	} else {
		return "ERROR:SENSOR_OR_GROUP_DOES_NOT_EXIST";
	}
};
const addSensorToGroup = db.prepare(
	`INSERT INTO SensorGroups(SensorId,GroupId,createdAt) VALUES (@SensorId,@GroupId,@createdAt)`
);

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
// Will return 1 if the insert was a success.
//
module.exports.addGroup = (name = "New Group") => {
	var d1 = dateAsUnixTimestamp();
	const newGroup = {
		id: newUUID(),
		name: name,
		createdAt: d1,
		updatedAt: d1
	};
	// Will return 1 if the change was a success.
	return insertGroup.run(newGroup).changes;
};
const insertGroup = db.prepare(
	`INSERT INTO Groups(id,name,createdAt,updatedAt)
    VALUES (@id,@name,@createdAt,@updatedAt)`
);
const getGroupById = db.prepare("SELECT * FROM Groups WHERE id = ?");

// Creates a new Group with the given `name` (or "New Group").
//
//
module.exports.listAllGroups = () => {
	return listAllGroups.all();
};
const listAllGroups = db.prepare(`SELECT * FROM Groups`);

// Allows updating of a groups's `name`.
//
// Will return an error (as a string) if the `groupId` does
// not exist, or a 1 if the changes were a success.
//
module.exports.updateGroup = (groupId, name) => {
	var d1 = dateAsUnixTimestamp();

	var currentGroup = getGroupById(groupId).get();
	if (currentSensor !== undefined) {
		currentGroup.name = name || currentGroup.name;

		// Change `updatedAt` always.
		currentGroup.updatedAt = d1;

		// Will return 1 if the change was a success.
		return updateGroup.run(currentGroup).changes;
	} else {
		return "ERROR::GROUPID_DOES_NOT_EXIST";
	}
};
const updateGroup = db.prepare(
	`UPDATE Groups
    SET name = @name,
        updatedAt = @updatedAt
    WHERE id = @id`
);

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
	return insertLogEntry.run(logEntry).changes;
};
const insertLogEntry = db.prepare(
	`INSERT INTO LogEntries(value,timestamp,SensorId,createdAt)
    VALUES (@value,@timestamp,@SensorId,@createdAt)`
);
