
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
