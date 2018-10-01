//
//A Sensor written in Node.
//Useful for testing the server.
//

const config = require("./config.json");

const Sensor = require("./Sensor");

/////
/////
/////

var testSensor = new Sensor("TEST_SENSOR", "string", config);

setInterval(() => {
    var val = Math.random();
    console.log(`Logging ${val}.`);
    testSensor.logData(val);
}, 2000);
