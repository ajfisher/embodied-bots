'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const moment = require('moment');
const mqtt = require('mqtt');

const request = require('request');

let temp_data = [];
let current_temp = { min: null, max: null};

let notify_users = [];

let client  = mqtt.connect(process.env.MQTT_SERVER)
const sub_topic = process.env.UNIQ_TOPIC + "/temperature/ic";

client.on('connect', function () {
    client.subscribe(sub_topic);
});

client.on('message', function (topic, message) {

    // message is Buffer
    let msg = JSON.parse(message.toString());

    // handle new data
    temp_data.push(msg);

    if (msg.c < current_temp.min || current_temp.min === null) {
        current_temp.min = msg.c;
    }
    if (msg.c > current_temp.max || current_temp.max === null) {
        current_temp.max = msg.c;
    }

    current_temp.c = msg.c;
    current_temp.ts = msg.ts;
});

var botcontroller = Botkit.slackbot({
	debug: process.env.APP_DEBUG || false,
    //json_file_store: __dirname + '/.data/db/',
});

const config = {
	token: process.env.SLACK_TOKEN,
};

let bot = botcontroller.spawn(config).startRTM((err, bot, payload) => {
    if (err) {
        throw new Error(err);
    }
    console.log("Now online");
});

const channels = ['direct_message', 'direct_mention', 'mention'];

botcontroller.hears(['hello', 'hi',], channels, (bot, message) => {

    let user = `<@${message.user}>`;

    let replies = [
        `Hello ${user}`,
        `Hi ${user}, what can I do for you?`,
        `What's up ${user}?`,
    ];

    let response = replies[Math.floor(Math.random() * replies.length)];

    bot.reply(message, response);
});

botcontroller.hears(['settime'], ['direct_message'], (bot, message) => {

    // message is "settime XX" where XX is a 24 hour time for the bot/

});




