(() => {
    let canConnect = false;
    if (typeof mqtt === "function") {
        canConnect = true;
    } else {
        console.error("`mqtt` is not defined on the window, be sure to include https://github.com/mqttjs/MQTT.js#via-cdn or similar.");
    }

    //
    let mqttClient = null;
    //

    const mqttConnect = (host = "", port = "", clientId = "", clientPass = "") => {
        if (canConnect && host != "" && port != "" && clientId != "" && clientPass != "") {
            console.log("Connect Request Sent");

            mqttClient = mqtt.connect(`ws://${host}:${Number(port)}`, {
                clientId: clientId,
                password: clientPass
            });

            mqttClient.subscribe('log');

            mqttClient.on("connect", () => {
                console.log("CONNECTED!!!!!!!!");
            });

            mqttClient.on("message", (topic, message) => {
                console.log([topic, message].join(": "));
            });
        }
    };
    window.mqttConnect = mqttConnect;

    const mqttDisconnect = () => {
        if (canConnect) {
            mqttClient.disconnect();
        }
    };
    window.mqttDisconnect = mqttDisconnect;
})();

///////////////////////////////////////
// Below is only to wire up the demo //
///////////////////////////////////////
(() => {
    const connBtn = document.getElementById("connBtn"),
        disconnBtn = document.getElementById("disconnBtn"),
        //
        hostInput = document.getElementById("host"),
        portInput = document.getElementById("port"),
        clientIdInput = document.getElementById("clientId"),
        passwordInput = document.getElementById("pw"),
        //
        messagesTarget = document.getElementById("messages"),
        clearMessagesBtn = document.getElementById("clearMessages");

    clearMessagesBtn.addEventListener("click", e => {
        e.preventDefault();
        messagesTarget.innerHTML = "";
    });

    connBtn.addEventListener("click", e => {
        e.preventDefault();

        window.mqttConnect(hostInput.value, portInput.value, clientIdInput.value, passwordInput.value);
    });
})();
