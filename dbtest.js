const uuidv4 = require("uuid/v4");
function newUUID() {
	return uuidv4().toString();
}
function dateAsUnixTimestamp(d = new Date()) {
	return Math.round(d.getTime() / 1000);
}

const Database = require("better-sqlite3");
const db = new Database("./database.sqlite", { readonly: false });

//
// Helper Functions
//

function propertiesAllNull(obj) {
	for (var key in obj) {
		if (obj[key] !== null && obj[key] != "") return false;
	}
	return true;
}

function groupBy(rows, fieldName, asKey, skipNull = true, prebuilt = {}) {
	var res = prebuilt;

	for (var n = 0, l = rows.length; n < l; n++) {
		let group = rows[n][fieldName];
		var clone = Object.assign({}, rows[n]);
		delete clone[fieldName];

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
	}
	return res;
}

//
// End Helper Functions
//

////
//// Inserting new sensors
////

// const insertSensor = db.prepare(
// 	`INSERT INTO Sensors(id,name,dataType,createdAt,updatedAt)
//     VALUES (@id,@name,@dataType,@createdAt,@updatedAt)`
// );

// var d1 = dateAsUnixTimestamp();
// const newSensor = {
//     id: newUUID(),
//     name: "Sqlite3_Test",
//     dataType: "string",
//     createdAt: d1,
//     updatedAt: d1
// };
// insertSensor.run(newSensor);

////
//// Updating existing sensors
////

// // e19b0cd8-1940-44d3-8f37-8c580cc58a26
// var d2 = dateAsUnixTimestamp();
// const sameSensor = {
//     id: "e19b0cd8-1940-44d3-8f37-8c580cc58a26",
//     name: "Now a float 2",
//     dataType: "float",
//     updatedAt: d2
// };
// const updateSensor = db.prepare(
//     `UPDATE Sensors
//     SET dataType = @dataType,
//         name = @name,
//         updatedAt = @updatedAt
//     WHERE id = @id`
// );
// updateSensor.run(sameSensor);

////
//// List all sensors with their groups
////

const listAllSensorsGroups = db.prepare(
	`SELECT Sensors.id as SensorId, Groups.id as GroupId, Groups.name as GroupName
    FROM Sensors
    LEFT JOIN SensorGroup ON SensorGroup.SensorId = Sensors.id
    LEFT JOIN Groups ON Groups.id = SensorGroup.GroupId`
);
//var rows = groupBy(listAllSensorsGroups.all(), "SensorId");
//console.log(rows);

////
//// Get groups for a specific sensor
////

// const getGroupsforSensor = db.prepare(
//     `SELECT Groups.id as GroupId, Groups.name as GroupName
//     FROM Sensors
//     LEFT JOIN SensorGroup ON SensorGroup.SensorId = Sensors.id
//     LEFT JOIN Groups ON Groups.id = SensorGroup.GroupId
//     WHERE Sensors.id = ?`
// );
// var groups = getGroupsforSensor.all("874831ac-0187-49de-995a-65b45d2b3705");
// console.log(groups);

////
//// Get sensors for all groups
////

// const getSensorsInGroups = db.prepare(
//     `SELECT Groups.id as GroupId, Sensors.id as SensorId, Sensors.name as SensorName
//     FROM Groups
//     LEFT JOIN SensorGroup ON SensorGroup.GroupId = Groups.id
//     LEFT JOIN Sensors ON Sensors.id = SensorGroup.SensorId`
// );
// var sensorsInGroups = groupBy(getSensorsInGroups.all(), "GroupId");
// console.log(sensorsInGroups);

////
//// Get sensors for specific group
////

// const getSensorsForGroup = db.prepare(
// 	`SELECT Groups.id as GroupId, Sensors.id as SensorId, Sensors.name as SensorName
//     FROM Groups
//     LEFT JOIN SensorGroup ON SensorGroup.GroupId = Groups.id
//     LEFT JOIN Sensors ON Sensors.id = SensorGroup.SensorId
//     WHERE Groups.id = ?`
// );
// var sensorsInSpecificGroup = groupBy(
// 	getSensorsForGroup.all("8623b7bf-7ba6-43db-ac07-de395ce226e5"),
// 	"GroupId"
// );
// console.log(sensorsInSpecificGroup);

////
//// Get sensor specific logs
////

// const getLogsForSensor = db.prepare(
//     `SELECT id,timestamp,value,createdAt FROM LogEntries
//     WHERE SensorId = ?`
// );
// var logsForSensor = getLogsForSensor.all("874831ac-0187-49de-995a-65b45d2b3705");
// console.log(logsForSensor);

////
//// Get logs for all sensors
////

const getLogsForSensors = db.prepare(
	`SELECT id,timestamp,value,createdAt,SensorId FROM LogEntries`
);
// var logsForAllSensors = groupBy(getLogsForSensors.all(),"SensorId");
// console.log(logsForAllSensors);

////
//// List all sensors
////

// const getLogCountForAllSensors = db.prepare(
// 	`SELECT Sensors.id as SensorId, count(LogEntries.id) as LogCount
//     FROM Sensors
//     LEFT JOIN LogEntries ON LogEntries.SensorId = Sensors.id
//     GROUP BY Sensors.id`
// );
//var logCountForAllSensors = getLogCountForAllSensors.all();
//console.log(logCountForAllSensors);

////
//// Combine groups and log counts
////

// var logs = groupBy(getLogsForSensors.all(), "SensorId", "logs");

// var logsAndGroups = groupBy(
// 	listAllSensorsGroups.all(),
// 	"SensorId",
// 	"groups",
// 	true,
// 	logs
// );
// console.log(logsAndGroups);

// Pull `columns` (array) from `table`, with a limit of `limit` per page,
// starting from page `page` (0-indexed).
//
// TODO: Be able to "WHERE" this.
//
const findAndCountPaginated = (table, columns, page = 0, limit = 10) => {
	var stmt = db.prepare(
		`SELECT ${columns.join(",")} FROM ${table} LIMIT @limit OFFSET @offset`
	);
	var count = db.prepare(`SELECT COUNT(${columns[0]}) AS total FROM ${table}`);

	var rows = stmt.all({
		limit: limit,
		offset: page * limit
	});

	var totalRows = count.get().total;
	return {
		rows: rows,
		total: totalRows,
		totalPages: Math.ceil(totalRows / limit) - 1,
		page: page,
		limit: limit
	};
};

var paginatedLogs = findAndCountPaginated("LogEntries", ["id", "value"]);

console.log(paginatedLogs);
