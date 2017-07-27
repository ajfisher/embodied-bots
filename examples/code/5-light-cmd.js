const dotenv = require('dotenv').config();
const  mqtt = require('mqtt');

let client = mqtt.connect(process.env.MQTT_SERVER);

const topic = process.env.UNIQ_TOPIC;

client.on('connect', () => {
    client.subscribe(topic + '/#');

    if (process.argv[2] == "on") {
        client.publish(topic + "/ic/light", "on");
    } else if (process.argv[2] == "off") {
        client.publish(topic + "/ic/light", "off");
    }
});

client.on('message', (topic, message) => {
  // message is Buffer
  console.log(topic, message.toString());
  client.end();
})
