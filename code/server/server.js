const config = require("../configs/server.json");

const DBHelperBuilder = require("./helpers/dbhelper"),
    DBHelper = new DBHelperBuilder(config.db);

const dgram = require("dgram");
const server = dgram.createSocket("udp4");

server.on("error", err => {
    //Shuts down the server is some error occurs
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg, rinfo) => {
    //Run whenever a message is received
    var parsedMessage = JSON.parse(msg);

    console.log(`message from ${rinfo.address}:${rinfo.port}`);
    console.log(parsedMessage);
    console.log("");
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
