'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const five = require('johnny-five');

let led, ledstate;

const board = new five.Board({
    repl: false,
});

board.on("ready", function() {
    led = new five.Led(process.env.LED_PIN);
});

var botcontroller = Botkit.slackbot({
	debug: process.env.APP_DEBUG || false,
});

const config = {
	token: process.env.SLACK_TOKEN
};

botcontroller.spawn(config).startRTM((err, bot, payload) => {
    if (err) {
        throw new Error(err);
    }
    console.log("Now online");
});

const channels = ['direct_message', 'direct_mention', 'mention'];

botcontroller.hears(['hello', 'hi'], channels,(bot,message) => {
    let user = `<@${message.user}>`;
    bot.reply(message, `Hi there, ${user}. What can I do for you?`);
});

botcontroller.hears(['light(.?) on', 'on(.?) the light(.?)'], channels, (bot, message) => {
    led.on();
    ledstate = true;
    let user = `<@${message.user}>`;
    let replies = [
        `Sure thing.`,
        `I am here just to switch your lights on and off, ${user}`,
        `If I'm passing, ${user}, I'll flip them on.`,
    ];

    let response = replies[Math.floor(Math.random() * replies.length)];

    bot.reply(message, response);
});

botcontroller.hears(['light(.?) off', 'off(.?) the light(.?)'], channels, (bot, message) => {
    led.off();
    ledstate = false;
    let user = `<@${message.user}>`;
    let replies = [
        `No worries ${user}`,
        `There you go ${user}`,
        `Lights out ${user}`,
    ];

    let response = replies[Math.floor(Math.random() * replies.length)];

    bot.reply(message, response);
});

botcontroller.hears(['light(.?)$'], channels, (bot, message) => {
    bot.startConversation(message, function(err, convo) {

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
            callback: function(response, convo) {
                if (ledstate) {
                    led.off();
                } else {
                    led.on();
                }
                ledstate = !ledstate;
                convo.say(`Okay, the light is now ${question_state}.`);
                convo.next();
            }
        },{
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('Cool. I\'ll leave it as it is');
                convo.next();
            }
        }] );
    });
});
