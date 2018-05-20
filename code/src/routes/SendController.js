var express = require("express"),
    router = express.Router();

const AuthHelper = require('../helpers/AuthHelper');

router.post("/", function (req, res) {
    if (AuthHelper.verify(req.get('X-AUTH'))) {
        console.log(`SEND: ${JSON.stringify(req.body)}`);
        
    } else {
        console.warn(`AUTH INVALID: X-AUTH: ${req.get('X-AUTH')}`);
    }

    res.send("You have SENT to the server.");
});

module.exports = router;
