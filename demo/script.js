(() => {
    let canConnect = false;
    if (Paho.MQTT !== undefined) {
        canConnect = true;
    } else {
        console.error("Be sure to include https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js");
    }

    //
    let mqttClient = null;
    let connMsgDiv = document.getElementById("connMsg");
    //

    const mqttConnect = () => {
        if (canConnect) {
            mqttClient = new Paho.MQTT.Client("mqtt.thesis.dougs.website/ws", 80, "DRUM_KIT");

            mqttClient.onMessageArrived = handleMessage;

            mqttClient.connect({
                password: "AUTH_KEY",

                onSuccess: () => {
                    console.log("CONNECTED");
                    connMsgDiv.innerText = "Connected";
                    mqttClient.subscribe("drumkit");
                }
            });
        }
    };
    window.mqttConnect = mqttConnect;

    const handleMessage = msg => {
        console.log(`${msg.destinationName} : ${msg.payloadString}`);
        playDrum(msg.payloadString);
    };
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
