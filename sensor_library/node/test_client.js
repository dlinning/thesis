const Sensor = require("./Sensor");

const config = require("./SensorConfig.json");

Sensor.init(config);

const fakeSubmit = () => {
    Sensor.logData(Math.random() * 100, "float");
    setTimeout(fakeSubmit, Math.random() * 5000);
};

fakeSubmit();
