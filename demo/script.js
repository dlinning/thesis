// Ugh
navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
        registration.unregister();
    }
});
// Actual code
(() => {
    let canConnect = false;
    if (Paho.MQTT !== undefined) {
        canConnect = true;
    } else {
        console.error("Be sure to include https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js");
    }

    const MQTT_CLIENT_ID = "DEMO_OUT";
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
                    connMsgDiv.innerText = "Connected";

                    mqttClient.subscribe(`flowPub/${MQTT_CLIENT_ID}`);

                    isConnected = true;
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
(() => {
    const drums = document.querySelectorAll(".drum");

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
})();
