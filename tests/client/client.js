//
//A Sensor written in Node.
//Useful for testing the server.
//

const config = require("./config.json");

const Sensor = require("./Sensor");

/////
/////
/////

var testSensor = new Sensor("Counting Sensor", "int", config);

var idx = 0;
setInterval(() => {
    var val = ++idx;
	console.log(`Logging ${val}.`);
	testSensor.logData(val* 100);
}, 2000);
