const dotenv = require('dotenv').config();
const five = require('johnny-five');
const mqtt = require('mqtt');

let led, led_state;

let board = new five.Board({repl: false,});

let client  = mqtt.connect(process.env.MQTT_SERVER)
const sub_topic = process.env.UNIQ_TOPIC + "/light/ic";
const pub_topic = process.env.UNIQ_TOPIC + "/light/oc";

client.on('connect', () => {
    console.log("MQTT Server connected");
    client.subscribe(sub_topic);
});

board.on("ready", () => {
    led = new five.Led(process.env.LED_PIN);
});

client.on('message', (topic, message) => {

    // message is Buffer
    console.log(topic, message.toString());
    let state = message.toString();

    if (state == "on") {
        led.on()
    } else if (state == "off") {
        led.off();
    }

    // publish current state to the output content topic
    client.publish(pub_topic, state);
});

