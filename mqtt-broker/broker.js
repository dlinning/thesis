const mosca = require("mosca");

const debug = process.env.NODE_ENV != "production";

const DBHelper = require("../common/helpers/dbhelper"),
    FlowRunner = require("../common/helpers/flowRunner");

const config = require("./BrokerConfig.json"),
    serverOpts = {
        port: config.serverPort,
        bundle: true,
        static: "./"
    };

////
// Local client used to recieve process messages
//
// This acts as a way to listen to incoming messages, since
// the broker does not intercept, only pass through.
////
const mqtt = require("mqtt");

// Do this weird random `MQTT_WORKER_ID` so that (in theory) there are no clientId
// conflicts because of the system.
const MQTT_WORKER_ID = "MQTT_WORKER_" + Math.random().toString();
const MQTT_WORKER = mqtt.connect("mqtt://localhost", { clientId: MQTT_WORKER_ID, password: config.password });

MQTT_WORKER.on("message", (topic, message) => {
    if (topic === "log") {
        const data = JSON.parse(message.toString());

        DBHelper.logData(data.value, data.sensorId, data.dataType, data.timeStamp);

        let sendData = FlowRunner.handleSensorUpdate(data.sensorId, data.value);

        if (sendData.to && sendData.to.length > 0) {
            for (let i = 0, l = sendData.to.length; i < l; i++) {
                sendMessageToSensor(sendData.to[i], sendData.payload);
            }
        }
    }
});

////
// Actual Broker code
//
// The MQTT-broker server used to handle all messages sent
// into or out of the system.
////
const broker = new mosca.Server(serverOpts);

let sensorIdToClientMap = {},
    clientIdToSensorIdMap = {};

broker.on("ready", () => {
    console.log("\nMQTT Broker running on port " + serverOpts.port + "\n");

    // Tell the MQTT_WORKER to listen for any
    // messages on the `log` topic. This is
    // where all incoming data gets sent
    // by Sensors.
    MQTT_WORKER.subscribe("log");
});

broker.on("clientConnected", newClient => {
    console.log(`${newClient.id} CONNECTED`);
});

broker.on("clientDisconnected", removedClient => {
    // Handle cleaning up old client connections
    let sensorId = clientIdToSensorIdMap[removedClient.id];

    if (sensorId !== undefined) {
        delete sensorIdToClientMap[sensorId];
        delete clientIdToSensorIdMap[removedClient.id];
    }
});

broker.authenticate = (client, user, pass, callback) => {
    var accept = false;

    // Exit if no username (sensorId) provided,
    // or if password not provided/invalid.
    if (pass != undefined && pass != null && pass.toString() === config.password) {
        accept = true;

        // Used later on to send out appropriate packets
        // based on sensorId.
        sensorIdToClientMap[client.id] = client;

        // Skip registering the current MQTT_WORKER
        if (client.id !== MQTT_WORKER_ID) {
            DBHelper.addSensor(client.id);
        }
    }

    callback(null, accept);
};

const sendMessageToSensor = (sensorId, payload) => {
    let client = sensorIdToClientMap[sensorId];

    if (client !== undefined) {
        console.log("Sending a payload to", sensorId);
        MQTT_WORKER.publish("flowPub/" + sensorId, JSON.stringify(payload));
    }
};
module.exports.sendMessageToSensor = sendMessageToSensor;
