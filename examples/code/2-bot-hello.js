'use strict';

const dotenv = require('dotenv').config();
const Botkit = require('Botkit');

console.log("Attempting to get the bot online");

let botcontroller = Botkit.slackbot({
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

const keywords = ['hello','hi', 'howdy'];
const channels = ['direct_message', 'direct_mention', 'mention'];

botcontroller.hears(keywords, channels, (bot,message) => {

    let user = `<@${message.user}>`;

    bot.reply(message, `Hi ${user}. What can I do for you?`);
});
