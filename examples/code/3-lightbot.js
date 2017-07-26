'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const five = require('johnny-five');

let led;

let board = new five.Board({
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

botcontroller.hears(['hello'], channels, (bot,message) => {
    let user = `<@${message.user}>`;
    bot.reply(message, `Hi there, ${user}. What can I do for you?`);

});

botcontroller.hears(['lights on',], channels, (bot, message) => {
    led.on();
    bot.reply(message, `<@${message.user}> - there you go`);
});

botcontroller.hears(['lights off',], channels, (bot, message) => {
    led.off();
    bot.reply(message, `<@${message.user}> - there you go`);
});
