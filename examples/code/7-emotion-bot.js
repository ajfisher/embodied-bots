'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const moment = require('moment');
const mqtt = require('mqtt');

const EmotionalModel = require('./lib/emotion');

// create bot's emotions and give it a pretty high positivity
// score so it tends towards positive sides of the PAD cube
let bot_emotions = new EmotionalModel({ positivity: 0.9 });

// we only care about hours.
let bot_time = (new Date()).getHours();

// set our preferred temperature range
const preferred_temp = { min: 18.0, max: 22.0 };

let current_temp = { };

let client  = mqtt.connect(process.env.MQTT_SERVER)
const sub_topic = process.env.UNIQ_TOPIC + "/temperature/ic";

client.on('connect', function () {
    console.log("Listening for temp on: " + sub_topic);
    client.subscribe(sub_topic);
});

client.on('message', function (topic, message) {

    // message is Buffer
    let msg = JSON.parse(message.toString());

    current_temp.c = parseFloat(msg.c);
    current_temp.ts = msg.ts;
});

var botcontroller = Botkit.slackbot({
	debug: process.env.APP_DEBUG || false,
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

    // set up the replies based on model responses
    let replies = {
        "excited": `Hi ${user}! :smile: I am so happy to see you today!`,
        "curious": `Hello ${user}, how are you today?`,
        "relaxed": `Hi ${user}`,
        "sleepy": `_yawn_ Hi ${user} :zzz:`,
        "angry": `What do you want, ${user}? :angry:`,
        "frustrated": `:weary: Can I help you?`,
        "indifferent": `Hey...`,
        "bored": `Hey there`,
    };

    let response = replies[bot_emotions.emotion()];

    bot.reply(message, response);
});

botcontroller.hears(['settime'], ['direct_message'], (bot, message) => {

    // message is "settime XX" where XX is a 24 hour time for the bot/
    let [settime, time ] = message.text.split(" ");

    // we set the bot's internal time so we can use it later.
    bot_time = parseInt(time);

    bot.reply(message, "Time now set to " + bot_time);
});

botcontroller.hears(['current state'], ['direct_message'], (bot, message) => {
    bot.reply(message, "My current state is: `" + bot_emotions.state() + "`");
});

botcontroller.hears(['current emotion'], ['direct_message'], (bot, message) => {
    bot.reply(message, "My current emotion is: " + bot_emotions.emotion());
});

function update_emotions() {
    // go through emotion updating process.
    //
    let tmp_emotions = bot_emotions.state();

    if (bot_time < 7) {
        bot_emotions.negative("arousal");
    } else if( bot_time >= 7 && bot_time <= 10) {
        bot_emotions.neutral("arousal");
    } else if ( bot_time >= 11 && bot_time <= 15 ) {
        bot_emotions.positive("arousal");
    } else if (bot_time >= 16 && bot_time <= 21 ) {
        bot_emotions.neutral("arousal");
    } else {
        bot_emotions.negative("arousal");
    }

    // now test the temperature
    if (isNaN(current_temp.c)) {
        bot_emotions.positive("pleasure");
        bot_emotions.negative("dominance");
    } else if (current_temp.c < preferred_temp.min) {
        bot_emotions.neutral("pleasure");
        bot_emotions.negative("dominance");
    } else if (current_temp.c > preferred_temp.max) {
        bot_emotions.negative("pleasure");
        bot_emotions.positive("dominance");
    } else {
        bot_emotions.positive("pleasure");
        bot_emotions.neutral("dominance");
    }

    if (tmp_emotions !== bot_emotions.state()) {
        console.log("Updating emotions", bot_emotions.state());
    }
}

// set up a loop that runs periodically to update the internal state of the
// bot based on current time and temperature
let interval = setInterval(() => {
    update_emotions();

}, process.env.BOT_EMOTION_UPDATE * 1000);

console.log("Initialising emotional state");
update_emotions();

