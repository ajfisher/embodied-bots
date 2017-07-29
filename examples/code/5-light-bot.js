'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const mqtt = require('mqtt');

let ledstate;

let notify_users = [];

let client  = mqtt.connect(process.env.MQTT_SERVER)
const sub_topic = process.env.UNIQ_TOPIC + "/light/oc";
const pub_topic = process.env.UNIQ_TOPIC + "/light/ic";

client.on('connect', function () {
    client.subscribe(sub_topic);
});

client.on('message', function (topic, message) {

    // message is Buffer
    let state = message.toString();
    let newstate = null;

    if (state == "on") {
        newstate = true;
    } else if (state == "off") {
        newstate = false;
    }
    console.log("LED state", state);

    if (newstate != ledstate) {
        console.log("It changed remotely!! Bastards!");

        notify_users.forEach((user) => {
            bot.startPrivateConversation({user: user}, (err, convo) => {

                convo.say(`Just to let you know, the light was switched *${state}*`);
                convo.next();
            });
        });
    }

    ledstate = newstate;
})

var botcontroller = Botkit.slackbot({
	debug: process.env.APP_DEBUG || false,
});

const config = {
	token: process.env.SLACK_TOKEN
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

botcontroller.hears(['light(.?) on', 'on(.?) the light(.?)'], channels, (bot, message) => {

    ledstate = true;
    client.publish(pub_topic, "on");

    let user = `<@${message.user}>`;
    let replies = [
        `There you go ${user}`,
        `If that's what you'd like me to do`,
        `I am here just to switch your lights on and off, ${user}`,
        `If I'm passing, ${user}, I'll give them a flick.`,
    ];

    let response = replies[Math.floor(Math.random() * replies.length)];

    bot.reply(message, response);
});

botcontroller.hears(['light(.?) off', 'off(.?) the light(.?)'], channels, (bot, message) => {

    ledstate = false;
    client.publish(pub_topic, "off");

    let user = `<@${message.user}>`;
    let replies = [
        `Sure thing.`,
        `No worries ${user}`,
        `If that's what you'd like me to do`,
        `I am here just to switch your lights on and off, ${user}`,
    ];

    let response = replies[Math.floor(Math.random() * replies.length)];

    bot.reply(message, response);
});

botcontroller.hears(['light(.?)$'], channels, (bot, message) => {
    bot.startConversation(message, (err, convo) => {

        // first we look at what state the LED is in.
        let state = ledstate ? "on" : "off"; // what is LED currently
        let question_state = ledstate ? "off" : "on"; // what do we ask about

        // add a timeout option
        convo.setTimeout(15000);
        convo.onTimeout((convo) => {
            convo.say(`I'll leave the light ${state}. Just let me know if you want to change it`);
            convo.next();
        });

        // now ask what to do
        convo.ask(`The light is currently *${state}*. Do you want me to turn it ${question_state}?`,
        [{
            pattern: bot.utterances.yes,
            callback: (response, convo) => {
                if (ledstate) {
                    client.publish(pub_topic, "off");
                } else {
                    client.publish(pub_topic, "on");
                }
                ledstate = !ledstate;
                convo.say(`Okay, the light is now ${question_state}.`);
                convo.next();
            }
        },{
            pattern: bot.utterances.no,
            default: true,
            callback: (response, convo) => {
                convo.say('Cool. I\'ll leave it as it is');
                convo.next();
            }
        }] );
    });
});

botcontroller.hears(['notify me'], channels, (bot, message) => {

    let user = message.user;

    bot.startConversation(message, (err, convo) => {

        convo.say("I can notify you if someone changes the lights remotely.");

        convo.ask("Would you like me to activate that now?",
        [{
            pattern: bot.utterances.yes,
            callback: (response, convo) => {

                if (notify_users.includes(user)) {
                    convo.say("You were already on the list.");
                } else {
                    notify_users.push(user);
                    convo.say("Great. I've added you to the notification list.");
                }

                console.log(notify_users);

                convo.say("If someone changes the status I'll DM you");
                convo.next();
            },
        },{
            pattern: bot.utterances.no,
            callback: (response, convo) => {
                if (notify_users.includes(user)) {
                    let index = notify_users.indexOf(user);
                    notify_users.splice(index, 1);
                    convo.say("I've removed you from the list");
                } else {
                    convo.say("No problems, just let me know if you want to at any time");
                }

                convo.next();
            },
        }] );
    });
});
