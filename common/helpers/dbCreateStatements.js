// Exports an object of SQLite "create" statements,
// used to create the initial database tables.
//
// If adding columns to any table, or any new tables,
// update this file.
//
// The Key doesn't really matter, at least with the
// initial implementation. Object.keys() is used to
// simply iterate over all keys.
//
// NOTE: It is important to use the syntax
// "CREATE (TABLE|VIEW) IF NOT EXISTS ..."
// for all of these, as they are run every time the
// server is booted.

module.exports = {
    // Tables
    Sensors:
        'CREATE TABLE IF NOT EXISTS "Sensors" ( `id` UUID, `name` TEXT NOT NULL, `dataType` TEXT NOT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY(`id`) )',
    Groups:
        'CREATE TABLE IF NOT EXISTS "Groups" ("id" UUID PRIMARY KEY, "name" VARCHAR(255) NOT NULL, "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL)',
    SensorGroups:
        'CREATE TABLE IF NOT EXISTS "SensorGroups" ( `createdAt` DATETIME NOT NULL, `SensorId` UUID NOT NULL, `GroupId` UUID NOT NULL, PRIMARY KEY(`SensorId`,`GroupId`), FOREIGN KEY(`GroupId`) REFERENCES `Groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY(`SensorId`) REFERENCES `Sensors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE )',
    LogEntries:
        'CREATE TABLE IF NOT EXISTS "LogEntries" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `timestamp` DATETIME NOT NULL, `value` VARCHAR ( 255 ) NOT NULL, `createdAt` DATETIME NOT NULL, `SensorId` UUID, FOREIGN KEY(`SensorId`) REFERENCES `Sensors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE )',
    Flows:
        'CREATE TABLE IF NOT EXISTS "Flows" ( `id` UUID NOT NULL UNIQUE, `name` TEXT NOT NULL, `description` TEXT, `triggerType` TEXT NOT NULL, `triggerId` TEXT, `config` TEXT, `activationCount` INTEGER DEFAULT 0, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY(`id`) )',
    Settings:
        'CREATE TABLE IF NOT EXISTS "Settings" ( `key` TEXT NOT NULL, `value` TEXT NOT NULL, `type` TEXT NOT NULL, `description` TEXT, `inGroup` TEXT, PRIMARY KEY(`key`) )',

    // Views
    GroupView:
        "CREATE VIEW IF NOT EXISTS GroupListWithSensorAndLogCount AS SELECT g.id, g.name, g.updatedAt, count(sg.SensorId) as sensorCount, lc.logCount FROM Groups as g LEFT JOIN SensorGroups AS sg ON sg.GroupId = g.id LEFT JOIN (SELECT g.id, count(le.id) AS logCount FROM Groups AS g LEFT JOIN SensorGroups AS sg ON sg.GroupId = g.id LEFT JOIN LogEntries AS le ON sg.SensorId = le.SensorId GROUP BY g.id) AS lc ON lc.id = g.id GROUP BY g.id ORDER BY g.createdAt",
    GroupLatestSumAndAvg:
        "CREATE VIEW IF NOT EXISTS GroupLatestSumAndAvg AS SELECT g.id, g.name, sum(le.value) as sum, avg(le.value) as avg, count(le.value) as valueCount FROM Groups AS g LEFT JOIN SensorGroups AS sg ON g.id = sg.GroupId LEFT JOIN (SELECT id FROM Sensors WHERE dataType IN ('float', 'int') ) as s ON s.id = sg.SensorId LEFT JOIN (SELECT value, SensorId FROM LogEntries WHERE CAST(value AS INTEGER) > 0 GROUP BY SensorId ORDER BY id DESC) as le ON le.SensorId = s.id GROUP BY g.id"
};
