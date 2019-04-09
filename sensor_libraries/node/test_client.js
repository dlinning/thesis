const Sensor = require("./Sensor");

const config = require("./SensorConfig.send.json");

Sensor.init(config);

const fakeSubmit = () => {
    let val = Math.random() * 100;

    console.log('sending', val);
    Sensor.logData(val, "float");
    setTimeout(fakeSubmit, Math.random() * 5000);
};

fakeSubmit();
