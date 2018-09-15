var express = require("express"),
    router = express.Router();

router.get("/:groupid", (req, res) => {
    res.send(`Reading from GROUP: ${req.params.groupid}`);
});

module.exports = router;
