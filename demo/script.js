// Actual code
let MQTT_CLIENT_ID = null;
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
            mqttClient = new Paho.MQTT.Client("wss://mqtt.thesis.dougs.website/ws", MQTT_CLIENT_ID);

            mqttClient.onMessageArrived = handleMessage;

            mqttClient.connect({
                password: "AUTH_KEY",

                onSuccess: () => {
                    console.log("CONNECTED");

                    mqttClient.subscribe(`flowPub/${MQTT_CLIENT_ID}`);

                    isConnected = true;

                    // Hide the button, show connected message
                    document.getElementById("connect-button").hidden = true;
                    connMsgDiv.innerText = "Connected";
                }
            });
        }
    };
    window.mqttConnect = mqttConnect;

    const handleMessage = msg => {
        console.log(`${msg.destinationName} : ${msg.payloadString}`);
        let payload = JSON.parse(msg.payloadString);
        playDrum(payload["play"]);
    };

    const logData = (value, dataType) => {
        if (isConnected) {
            const payload = {
                value: value,
                dataType: dataType,
                timestamp: new Date().getTime(),
                sensorId: MQTT_CLIENT_ID
            };
            mqttClient.send("log", JSON.stringify(payload), 1);
        }
    };
    window.logSensorData = logData;
})();

// Actually handles drum callbacks
const setupHostView = () => {
    const drums = document.querySelectorAll(".drum");

    document.getElementById("host").style.display = "block";

    const sounds = {
        snare: { audio: new Audio("./sounds/snare.opus"), timer: null, played: false },
        crash: { audio: new Audio("./sounds/crash.opus"), timer: null, played: false },
        hihatO: { audio: new Audio("./sounds/hihatO.opus"), timer: null, played: false },
        hihatC: { audio: new Audio("./sounds/hihatC.opus"), timer: null, played: false },
        kick: { audio: new Audio("./sounds/kick.opus"), timer: null, played: false },
        lowtom: { audio: new Audio("./sounds/lowtom.opus"), timer: null, played: false },
        medtom: { audio: new Audio("./sounds/medtom.opus"), timer: null, played: false },
        hitom: { audio: new Audio("./sounds/hitom.opus"), timer: null, played: false }
    };

    // Setup click listeners
    drums.forEach(drum => {
        drum.addEventListener("click", evt => {
            evt.preventDefault();
            playDrum(drum.id);
        });
    });

    // Checks that the drum exists,
    // then plays sound/adds class.
    function playDrum(drumName) {
        const drumEl = document.getElementById(drumName);

        if (drumEl) {
            let sound = sounds[drumName];

            if (!sound.played) {
                sound.played = true;
                drumEl.style.transitionDuration = sound.audio.duration / 3 + "s";
            }

            if (sound.audio.paused) {
                sound.audio.play();
            } else {
                sound.audio.currentTime = 0;
            }
            drumEl.classList.add("play");

            clearTimeout(sound.timer);
            sound.timer = setTimeout(() => {
                drumEl.classList.remove("play");
            }, sound.audio.duration * 1000);
        }
    }

    // Expose `playDrum()` globally.
    window.playDrum = playDrum;
};

const setupClientView = () => {
    document.getElementById("client").style.display = "flex";

    let canPlay = true;

    // Auto connect
    mqttConnect();

    // Put everyone on a random drum to start off
    const select = document.getElementById("client-select");
    var opts = select.getElementsByTagName("option");
    select.selectedIndex = Math.floor(Math.random() * opts.length);

    const countdownEl = document.getElementById('countdown');

    // Setup click listeners
    document.getElementById("client-play").addEventListener("click", evt => {
        evt.preventDefault();

        if (canPlay) {
            let value = select.value;
            logSensorData(value, "string");

            canPlay = false;
            countdownEl.classList.add('play');

            setTimeout(() => {
                canPlay = true;
            }, 750);
            setTimeout(() => {
                countdownEl.classList.remove('play');
            }, 250);
        }
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
        MQTT_CLIENT_ID = "DEMO_IN";
        setupClientView();
    }
})();
