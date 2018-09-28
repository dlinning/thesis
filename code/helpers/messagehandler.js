//
// Can send out UDP messages
//

const debug = process.env.NODE_ENV != 'production';

module.exports = class MessageSender {
    constructor() {}

    sendMessage(socket, to_ip, to_port, payload) {
        const message_buffer = new Buffer(JSON.stringify(payload));

        socket.send(message_buffer, 0, message_buffer.length, to_port, to_ip, (err, bytes) => {
            if (err) {
                throw err;
            }

            debug && console.log(`UDP message sent to ${to_ip}:${to_port} of length ${bytes} bytes.`);
        });
    }
};
