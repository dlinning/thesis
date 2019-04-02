const mosca = require("mosca");

const debug = process.env.NODE_ENV != "production";

const DBHelper = require("../common/helpers/dbhelper"),
    flowRunner = require("../flow_runner/flowRunner");

const config = require("./BrokerConfig.json"),
    serverOpts = {
        port: config.serverPort
    };

////
// Local clients used to recieve process messages
//
// These act as a way to listen to incoming messages, since
// the broker does not intercept, only pass through.
////
const mqtt = require("mqtt");

const logListener = mqtt.connect("mqtt://localhost", { clientId: "LogListener", username: "logListener", password: config.password });
const registerListener = mqtt.connect("mqtt://localhost", {
    clientId: "RegisterListener",
    username: "registerListener",
    password: config.password
});

// Should only accept `log/+` messages
logListener.on("message", (topic, message) => {
    content = message.toString();

    console.log(`Logged :: "${content} FROM ${topic.split("/")[1]}`);
});

// Should only accept `register/+` messages
registerListener.on("message", (topic, message) => {
    content = message.toString();

    let sensorId = topic.split("/")[1];

    console.log("register", content);

    // Try to add the sensor to the database, or update an exisiting one
    DBHelper.addSensor(sensorId, JSON.parse(message));
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
    console.log("MQTT Broker initialized on port " + serverOpts.port);

    // Tell the logListener to listen for any
    // messages on the `log/+` topic.
    // This subscribes to `log/SENSOR_ID` messages,
    // which is how the system knows which Sensor the
    // payload comes from
    logListener.subscribe("log/+");

    // Tell the registerListener to listen for any
    // messages on the `register/+` topic.
    registerListener.subscribe("register/+");
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

    console.log("CONREQ from", client.id);

    // Exit if no username (sensorId) provided,
    // or if password not provided/invalid.
    if (pass != undefined && pass != null && pass.toString() === config.password) {
        accept = true;

        // Used later on to send out appropriate packets
        // based on sensorId.
        sensorIdToClientMap[user] = client;
        clientIdToSensorIdMap[client.id] = user;
    }

    callback(null, accept);
};

const sendMessageToSensor = (sensorId, payload) => {
    let client = sensorIdToClientMap[sensorId];

    if (client !== undefined) {
        server.publish({ topic: "flowPub", payload: payload }, client);
    }
};
module.exports.sendMessageToSensor = sendMessageToSensor;
