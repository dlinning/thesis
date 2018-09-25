const dgram = require("dgram");

const udp_client = dgram.createSocket("udp4");

module.exports = class Sensor {
    //Creating a new Sensor will automatically `connect()` it
    //to the server supplied in `server_opts`.
    //
    constructor(name, dataType, server_opts) {
        this.server_opts = server_opts;

        //Will set `this.uuid`, which
        //must be set before `logData()`
        //will send data.
        this._connect(name, dataType);
    }

    logData(value) {
        var timestamp = new Date().toLocaleString();
        if (this.uuid === undefined || this.uuid === null) {
            console.error(`${timestamp}:: Unable to log ${value} as CONNECT failed.`);
        } else {
            //Send the data to the server
            var payload = {
                type: "log",
                sensorUUID: this.uuid,
                value: value,
                timestamp: timestamp
            };

            this._sendMessage(payload);
        }
    }

    //Connects to the server with info supplied in the constructor.
    //Will wait for a response of this Sensor's assigned UUID.
    //
    _connect(name, dataType) {
        var payload = {
            //id: "28f13c64-77fa-41ec-8534-7740d5f87dcf",
            type: "connect",
            name: name,
            dataType: dataType
        };

        console.log(`Sending connect message to ${this.server_opts.server_ip}:${this.server_opts.server_port}`);

        var self = this;
        udp_client.on("message", function connectHandler(rawMessage, rinfo) {
            var msg = JSON.parse(rawMessage);

            //Clear the listener
            udp_client.removeListener("message", connectHandler);

            if (msg.status === 200) {
                console.log(`Sensor registered/already exists with UUID ${msg.uuid}`);
                self.uuid = msg.uuid;
            } else {
                console.log("Error registering/finding Sensor.");
                udp_client.close();
                self.uuid = null;
            }
        });
        this._sendMessage(payload);
    }

    //Will send an arbitrary message to the server.
    //Will not expect a response, that must be handled elsewhere.
    //
    _sendMessage(payload) {
        const message_buffer = new Buffer(JSON.stringify(payload));

        udp_client.send(
            message_buffer,
            0,
            message_buffer.length,
            this.server_opts.server_port,
            this.server_opts.server_ip,
            (err, bytes) => {
                if (err) {
                    throw err;
                }
            }
        );
    }
};
