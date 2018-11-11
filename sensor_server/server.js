const config = require("./config.json");
const debug = process.env.NODE_ENV != "production";

var DBHelper = require("../common/helpers/new_dbhelper");

const MessageSenderBuilder = require("../common/helpers/messagehandler"),
    MessageSender = new MessageSenderBuilder();

const dgram = require("dgram");
const server = dgram.createSocket("udp4");

server.on("error", err => {
    //Shuts down the server is some error occurs
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (rawMessage, rinfo) => {
    //Run whenever a message is received
    var msg = JSON.parse(rawMessage);

    debug && console.log(msg);

    // Auth check, `authKey` must be provided for all messages.
    if (msg.authKey !== config.sensorAuthKey) {
        MessageSender.sendMessage(server, rinfo.address, rinfo.port, {
            status: 403,
            error: `Bad auth key: ${msg.authKey}`
        });
        return;
    }

    if (msg.type === "connect") {
        var res = DBHelper.addSensor(msg.name, msg.dataType, msg.id);
        if (res === null) {
            //Error adding to DB. See console.
            MessageSender.sendMessage(server, rinfo.address, rinfo.port, {
                status: 500
            });
        } else {
            MessageSender.sendMessage(server, rinfo.address, rinfo.port, {
                status: 200,
                uuid: res
            });
        }
    } else if (msg.type === "log") {
        // If the server does not require a timestamp && a timestamp was not
        // provided, set it server-side.
        if (!config.requireRemoteTimestamp && msg.timestamp === undefined) {
            msg.timestamp = Date.now();
        }
        DBHelper.logData(msg.value, msg.sensorUUID, msg.timestamp);
    }
});

/////

server.on("listening", () => {
    //Will run when the server initially starts up
    const address = server.address();
    console.log(`UDP server listening at ${address.address}:${address.port}`);
});

server.bind(config.port);
