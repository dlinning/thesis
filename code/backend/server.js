const config = require("../configs/server.json");

const DBHelperBuilder = require("../helpers/dbhelper"),
    DBHelper = new DBHelperBuilder(config.db);

const MessageSenderBuilder = require("../helpers/messagehandler"),
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

    console.log(msg);

    if (msg.type === "connect") {
        //console.log("Connect message recvd with payload:");
        //console.log(msg);

        DBHelper.registerSensor(msg.name, msg.dataType, msg.id).then(res => {
            if (res === null) {
                //Error adding to DB. See console.
                MessageSender.sendMessage(server, rinfo.address, rinfo.port, { status: 500 });
            } else {
                MessageSender.sendMessage(server, rinfo.address, rinfo.port, { status: 200, uuid: res });
            }
        });
    } else if (msg.type === "log") {
        DBHelper.logData(msg.value, msg.sensorUUID, msg.timestamp);
    }
});

/////

server.on("listening", () => {
    //Will run when the server initially starts up
    const address = server.address();
    console.log(`UDP server listening ${address.address}:${address.port}`);
});

server.bind(config.port);

// Testing the DB
//DBHelper.addSensor('TEST_SENSOR', { dataType: 'INTEGER' });
