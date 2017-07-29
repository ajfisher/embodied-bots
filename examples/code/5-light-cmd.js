const dotenv = require('dotenv').config();
const  mqtt = require('mqtt');

let client = mqtt.connect(process.env.MQTT_SERVER);

const topic = process.env.UNIQ_TOPIC;

client.on('connect', () => {
    if (process.argv[2] == "on") {
        client.publish(topic + "/light/ic", "on");
    } else if (process.argv[2] == "off") {
        client.publish(topic + "/light/ic", "off");
    }

    console.log("Message sent to server");
    client.end();
});

