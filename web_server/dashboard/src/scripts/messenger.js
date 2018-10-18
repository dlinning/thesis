(() => {
    var messenger = {};
    messenger.messages = {};

    messenger.subscribe = (msg, cb) => {
        if (messenger.messages[msg] === undefined) {
            messenger.messages[msg] = [cb];
        } else {
            messenger.messages[msg].push(cb);
        }
    };

    messenger.notify = (msg, payload = null) => {
        let m = messenger.messages[msg];
        if (m !== undefined) {
            m.forEach(callback => {
                callback(payload);
            });
        } else {
            console.error(`Messenger does not have any subscribers to "${msg}"`);
        }
    };

    window.messenger = messenger;
})();
