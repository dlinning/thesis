var express = require("express"),
    router = express.Router();

router.get("/", function(req, res) {
    res.send("You have connected to the server.");
});

module.exports = router;
