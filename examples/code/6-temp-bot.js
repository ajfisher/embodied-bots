'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const moment = require('moment');
const mqtt = require('mqtt');
const Quiche = require('quiche');

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


const get_temp_message = (data, opts) => {
    // get the data, iterate over it and apply any constraints
    // then return something formatted as a message to use

    let options = opts || {};

    const w = 400;
    const h = 250;
    const max_pts = 40;

    // make up an image chart from text strings
    let lc = new Quiche('line');
    lc.setHostname('image-charts.com');
    lc.setWidth(w);
    lc.setHeight(h);
    lc.setAutoScaling();
    lc.setLegendHidden(true);
    lc.setTitle(options.title || "Historical Temperature C");

    let data_pts = [];
    let times = [];

    data.forEach((dp, i) => {

        // check to see if this point is inside a moving window of points
        // this is so the chart only shows `max_pts` worth of data.
        let add_pt = false;
        if (data.length > max_pts) {
            if (i > data.length - max_pts) {
                add_pt = true;
            }
        } else {
            add_pt = true;
        }

        if (add_pt) {
            data_pts.push(dp.c);
            if (i % 6 == 0) { // todo choose appropriate number here
                let t = new moment(dp.ts);
                times.push(t.format("HH:mm:ss"));
            } else {
                times.push(""); // add blanks when not needed.
            }
        }
    });

    lc.addData(data_pts, "temp(c)", "ede63e");
    lc.addAxisLabels('x', times);

    const temp_url = lc.getUrl(true);

    const min = current_temp.min || "-";
    const max = current_temp.max || "-";

    // data commented out below simply to highlight possible options for
    // attachment - see https://api.slack.com/docs/message-attachments for more
    let msg_data = {
        token: process.env.SLACK_TOKEN,
        //channel: '#channelname',
        text: "Here is the recent temperature data I could find:",
        as_user: true,
        "attachments": [
            {
                "fallback": "Recent temperature data ",
                "color": "#ede63e",
                //"pretext": "Optional text that appears above the attachment block",
                //"author_name": "Bobby Tables",
                //"author_link": "http://flickr.com/bobby/",
                //"author_icon": "http://flickr.com/icons/bobby.jpg",
                //"title": "Here is the recent temperature data",
                //"title_link": "https://api.slack.com/",
                //"text": "Optional text that appears within the attachment",
                "fields": [
                    {
                        "title": "Current",
                        "value": current_temp.c + "˚C",
                        "short": true
                    },
                    {
                        "title": "Min / Max",
                        "value": min + "˚C / " + max + "˚C",
                        "short" : true,
                    },
                ],
                "image_url": temp_url,
                //"thumb_url": temp_url,
                //"footer": "Slack API",
                //"footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                "ts": Math.floor(current_temp.ts / 1000),
            }
        ]
    };

    return msg_data;

}


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

botcontroller.hears(['the temperature', ], channels, (bot, message) => {
    // listens for things like "what is the temperature"

    let r = get_temp_message(temp_data);

    bot.replyWithTyping(message, r);

});
