// Actual code
let MQTT_CLIENT_ID = null;
var IS_INPUT = false;
(() => {
    let canConnect = false;
    if (Paho.MQTT !== undefined) {
        canConnect = true;
    } else {
        console.error("Be sure to include https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js");
    }

    //
    let mqttClient = null;
    let isConnected = false;
    let connMsgDiv = document.getElementById("connMsg");
    //

    const mqttConnect = () => {
        if (canConnect) {
            MQTT_CLIENT_ID = IS_INPUT == true ? "BULB_" + Math.floor(Math.random() * new Date().getTime()).toString(16) : MQTT_CLIENT_ID;
            mqttClient = new Paho.MQTT.Client(
                //"wss://mqtt.thesis.dougs.website/ws",
                "ws://localhost:2883/",
                MQTT_CLIENT_ID
            );

            mqttClient.onMessageArrived = handleMessage;

            mqttClient.connect({
                password: "AUTH_KEY",

                onSuccess: () => {
                    console.log("CONNECTED");

                    mqttClient.subscribe(`flowPub/${MQTT_CLIENT_ID}`);

                    isConnected = true;

                    // Hide the button, show connected message
                    document.getElementById("connect-button").hidden = true;
                    connMsgDiv.innerText = IS_INPUT ? MQTT_CLIENT_ID.replace("BULB_", "") : "Connected";
                }
            });
        }
    };
    window.mqttConnect = mqttConnect;

    const handleMessage = msg => {
        let payload = JSON.parse(msg.payloadString);
        updateLight(payload["data"]);
    };

    const logData = (value, dataType) => {
        if (isConnected) {
            const payload = {
                value: value,
                dataType: dataType,
                timestamp: new Date().getTime(),
                sensorId: IS_INPUT ? "DEMO_IN" : MQTT_CLIENT_ID
            };
            mqttClient.send("log", JSON.stringify(payload), 1);
        }
    };
    window.logSensorData = logData;
})();

const setupHostView = () => {
    document.getElementById("host").style.display = "flex";

    const lightDump = document.getElementById("lightdump");

    const handleLightUpdate = data => {
        data = data.split("|");
        if (data.length === 3) {
            let light = document.getElementById(`b_${data[0]}`);
            if (light == undefined) {
                light = document.createElement("div");
                light.id = `b_${data[0]}`;
                light.classList.add("light");

                light.dataset.name = data[0];

                lightDump.appendChild(light);
            }
            light.style.setProperty("--color", data[1]);
            if (data[2] == "false") {
                light.classList.remove("on");
            } else {
                light.classList.add("on");
            }
        }
    };
    window.updateLight = handleLightUpdate;
};

const setupClientView = () => {
    document.getElementById("client").style.display = "flex";

    IS_INPUT = true;

    // Auto connect
    mqttConnect();

    // Put everyone on a random drum to start off
    const bulb = document.getElementById("cli-bulb");

    let on = false;
    let currentColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

    bulb.addEventListener("click", evt => {
        evt.preventDefault();
        on = !on;
        if (on) {
            bulb.classList.add("on");
        } else {
            bulb.classList.remove("on");
        }
        logSensorData(`${MQTT_CLIENT_ID.replace("BULB_", "")}|${currentColor}|${on}`, "bulb|color|state");
    });

    // Setup click listeners
    const colorSelector = document.getElementById("color-selector");
    colorSelector.value = currentColor;
    bulb.style.setProperty("--color", currentColor);

    colorSelector.addEventListener("change", evt => {
        evt.preventDefault();
        currentColor = colorSelector.value;
        bulb.style.setProperty("--color", currentColor);

        // Update the color right away
        logSensorData(`${MQTT_CLIENT_ID.replace("BULB_", "")}|${currentColor}|${on}`, "bulb|color|state");
    });
};

// Make the current view the "host" of the demo
function setHost() {
    window.localStorage.setItem("type", "host");
}

(() => {
    if (window.localStorage.getItem("type") === "host") {
        console.log("SETTING UP HOST");
        MQTT_CLIENT_ID = "DEMO_OUT";
        setupHostView();
    } else {
        setupClientView();
    }
})();
