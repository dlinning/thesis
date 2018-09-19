// The "view" controller, returns what the user can see
//
const express = require("express"),
    router = express.Router();
 
router.get('/', function (req, res) {
    res.render('home');
});


module.exports = router;
