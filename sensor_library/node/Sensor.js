const mqtt = require("mqtt");

const debug = process.env.NODE_ENV != "production";

var givenOpts = null,
    globalClient = null,
    clientReady = false;

const connectClient = () => {
    if (givenOpts === null) {
        console.error("`givenOpts` not set. Exiting.");
        process.exit(1);
    }

    console.log("Connecting", givenOpts);
    globalClient = mqtt.connect(`mqtt://${givenOpts.serverIp}:${givenOpts.serverPort}`, {
        clientId: givenOpts.clientId,
        password: givenOpts.password
    });

    globalClient.on("connect", resp => {
        debug && console.log(resp);

        clientReady = true;

        // Used generally by the Broker for Flows.
        globalClient.subscribe("flowPub");
    });

    // "Handles" connection failures
    globalClient.on("error", err => {
        console.error(err);
        process.exit(1);
    });

    globalClient.on("message", (topic, message) => {
        content = message.toString();

        debug && console.log(`"${topic}" :: "${content}"`);
    });
};

// `dataType` is to be passed every time, since an individual
// Sensor may submit any data type it wants, or multiple
// data types.
const logData = (value, dataType) => {
    // The client must publish to `log/CLIENT_ID`,
    // as this is how the Broker will get info
    // on which Sensor sent the data.
    if (clientReady) {
        globalClient.publish(
            "log/" + givenOpts.clientId,
            JSON.stringify({
                value: value,
                dataType: dataType,
                timestamp: new Date().getTime()
            })
        );
    }
};

module.exports = {
    init(opts) {
        if (opts.clientId === undefined || opts.password === undefined || opts.serverIp === undefined || opts.serverPort === undefined) {
            console.error("Must provide `clientId`, `password`, `serverIp`, and `serverPort` options. Exiting.");
            process.exit(1);
        }

        // Good opts provided
        givenOpts = opts;

        connectClient();
    },
    logData: logData
};
