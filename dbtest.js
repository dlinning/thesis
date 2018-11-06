const uuidv4 = require("uuid/v4");
function newUUID() {
    return uuidv4().toString();
}
function dateAsUnixTimestamp(d = new Date()) {
    return Math.round(d.getTime() / 1000);
}

const Database = require("better-sqlite3");
const db = new Database("./database.sqlite", { readonly: false });

const insertSensor = db.prepare(
    `INSERT INTO Sensors(id,name,dataType,createdAt,updatedAt) 
    VALUES (@id,@name,@dataType,@createdAt,@updatedAt)`
);

// var d1 = dateAsUnixTimestamp();
// const newSensor = {
//     id: newUUID(),
//     name: "Sqlite3_Test",
//     dataType: "string",
//     createdAt: d1,
//     updatedAt: d1
// };
// insertSensor.run(newSensor);


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