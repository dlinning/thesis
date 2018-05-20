const authHelper = {};
const CONFIG = require("../../config/server.json");

authHelper.verify = (key) => {
    return key == CONFIG.authKey;
}

module.exports = authHelper;
