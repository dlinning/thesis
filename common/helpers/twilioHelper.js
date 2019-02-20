const DBHelper = require("../common/helpers/new_dbhelper");
let twilioSidData = DBHelper.getSpecificSetting("twilioSid");
let twilioAuthData = DBHelper.getSpecificSetting("twilioAuthToken");
let twilioNumberData = DBHelper.getSpecificSetting("twilioFromNumber");

var client = null;
canRun(() => {
    client = require("twilio")(twilioSidData.value, twilioAuthData.value);
});

const canRun = f => {
    if (twilioSidData.status == 200 && twilioAuthData.status == 200) {
        f();
    } else {
        console.error("Error: Must setup `twilioSid` and `twilioAuthToken` settings first.");
    }
};

// Used internally to start the TaskRunner,
// and also able to be triggered externally via module.exports.
const sendMessage = (to, content) => {
    canRun(() => {
        let toNum = `+${to.replace(/[^0-9\.]+/g, "")}`;
        client.messages
            .create({
                body: content,
                from: twilioNumberData.value,
                to: toNum
            })
            .then(message => console.log(message.sid))
            .catch(err => {
                console.error(err);
            });
    });
};
module.exports.sendMessage = sendMessage;
