//
//A simple test client, to see if a JSON-object-as-string can be read by the server.
//
//This is waaaay easier than it will be in C/C++.
//

const config = require("../../configs/server.json");

const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const payload = {
    message: "MESAGE_TO_SERVER",
    message_id: 1,
    message_bool: false,
    another_string: "this is another string"
};

const message_buffer = new Buffer(JSON.stringify(payload));

client.send(message_buffer, 0, message_buffer.length, config.port, config.server_ip, (err, bytes) => {
    if (err) {
        throw err;
    }

    console.log(`UDP message sent to ${config.server_ip}:${config.port} of length ${bytes} bytes.`);

    client.close();
});
