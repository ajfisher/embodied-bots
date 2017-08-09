const dotenv = require('dotenv').config();
const five = require('johnny-five');
const mqtt = require('mqtt');

let temp_sensor;

let board = new five.Board({repl: false,});

let client  = mqtt.connect(process.env.MQTT_SERVER);
const pub_topic = process.env.UNIQ_TOPIC + "/temperature/ic";
const meta_topic = process.env.UNIQ_TOPIC + "/temperature/m";

client.on('connect', () => {
    console.log("MQTT Server connected");
});

board.on("ready", () => {
    temp_sensor = new five.Thermometer({
        controller: 'LM35',
        pin: process.env.TEMP_PIN || "A0",
        freq: process.env.TEMP_FREQUENCY * 1000 || 10000,
    });

    temp_sensor.on("data", (data) => {

        const msg = {
            c: data.celsius,
            ts: Date.now(),
        };

        // use the retain flag to ensure the last value stays behind. This
        // will ensure the bot can always get a value on start up
        client.publish(pub_topic, JSON.stringify(msg), {retain: true});
        //console.log(msg);
    });
});

