const dbHelper = {};
const CONFIG = require("../../config/server.json");

const sqlite3 = require("sqlite3").verbose();

dbHelper.RegisterSensor = (_callback, SensorName, SendsData, DataType, RangeMin, RangeMax, LastKnownIP) => {
    //TODO: Handle errors
    var db = new sqlite3.Database(CONFIG.dbPath);
    db.serialize(() => {
        db.run(
            "INSERT INTO Sensors (SensorName,SendsData,DataType,RangeMin,RangeMax,LastKnownIP) VALUES (?,?,?,?,?,?)",
            [SensorName, SendsData, DataType, RangeMin, RangeMax, LastKnownIP],
            (err, row) => {
                if (!err) {
                    //Successfully added
                    _callback(`SUCCESS: CONNECTED and REGISTERED to server.`);
                } else {
                    //TODO: Handle all errors properly
                    if (err.code == "SQLITE_CONSTRAINT") {
                        _callback("ERROR: SensorName already registered.");
                    } else {
                        _callback("ERROR:");
                    }
                }
            }
        );
    });
};

dbHelper.LogData = (_callback, SensorName, Timestamp, Value) => {
    //Will log data for the given sensor @ the given Timestamp.
    //TODO: Should update LastKnownIP for the given sensor, if different.
    var db = new sqlite3.Database(CONFIG.dbPath);
    db.serialize(() => {
        //
    });
};

module.exports = dbHelper;
