//
//A Sensor written in Node.
//Useful for testing the server.
//

const config = require("./config.json");

const Sensor = require("./Sensor");

/////
/////
/////

var testSensor = new Sensor("D Sensor", "int", config);

var idx = 0;
setInterval(() => {
	var val = ++idx;
	val++;
    console.log(`Logging ${val}.`);
    testSensor.logData(val);
}, 1000);
