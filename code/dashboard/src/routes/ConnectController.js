var express = require("express"),
    router = express.Router();

const AuthHelper = require("../helpers/AuthHelper");
const DBHelper = require("../helpers/DatabaseHelper");

router.post("/", (req, res) => {
    if (AuthHelper.verify(req.get("X-AUTH"))) {
        let body = req.body;
        console.log(`CONNECT: ${JSON.stringify(body)}`);
        let isRegister = false;

        DBHelper.RegisterSensor(
            resp => {
                res.send(resp);
            },
            body.fromSensor.toLowerCase(),
            parseInt(body.sends),
            body.dataType.toLowerCase(),
            parseFloat(body.rangeMin),
            parseFloat(body.rangeMax),
            req.get("x-forwarded-for") || req.connection.remoteAddress
        );
    } else {
        console.warn(`AUTH INVALID: X-AUTH: ${req.get("X-AUTH")}`);
        res.send(`Error: X-AUTH Header Invalid`);
    }
});

module.exports = router;
