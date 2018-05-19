var express = require("express"),
    router = express.Router();

router.use('/connect', require('./connect'));

router.use('/send', require('./send'));

module.exports = router;

