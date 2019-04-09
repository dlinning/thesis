const Sensor = require("./Sensor");

const config = require("./SensorConfig.recv.json");

Sensor.init(config, messageHandler);

function messageHandler(topic, payload) {
    console.log("Message on topic:", topic);
    console.log("Data:", payload);
}
