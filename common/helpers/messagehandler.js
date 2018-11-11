//
// Can send out UDP messages
//

const debug = process.env.NODE_ENV != "production";

module.exports = class MessageSender {
    constructor() {}

    sendMessage(socket, to_ip, to_port, payload) {
        const payloadString = JSON.stringify(payload);
        const message_buffer = new Buffer.alloc(payloadString.length, payloadString);

        socket.send(message_buffer, 0, message_buffer.length, to_port, to_ip, (err, bytes) => {
            if (err) {
                throw err;
            }

            debug && console.log(`UDP message sent to ${to_ip}:${to_port} of length ${bytes} bytes.`);
        });
    }
};
