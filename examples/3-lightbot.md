# Lighting Bot

## Objective

In this exercise, you'll evolve your bot to be able to take simple instructions
and have it influence the physical world. In this first case, that will mean
being able to turn a light on and off when it detects certain patterns addressed
to it.

## Preparation

Take your arduino and build the circuit below. This is the same as the
circuit you made in the first hello, world example but you can configure it
to run on any pin.

![](circuits/led_circuit.png)

Once you have the circuit built, update your `.env` file to include a value for

```
LED_PIN=XX
```

Where XX is the pin number you are using, for example `LED_PIN=10`

## Write or open the example file.

The example code is located in `examples/code/3-lightbot.js` or you can use the
code below:

```
'use strict';

const Botkit = require('Botkit');
const dotenv = require('dotenv').config();
const five = require('johnny-five');

let led; // 1

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

botcontroller.hears(['hello', 'hi',], channels, (bot,message) => {
    let user = `<@${message.user}>`;
    bot.reply(message, `Hi there, ${user}. What can I do for you?`);

});

botcontroller.hears(['lights on',], channels, (bot, message) => { // 2
    led.on();
    bot.reply(message, `<@${message.user}> - there you go`);
});

botcontroller.hears(['lights off',], channels, (bot, message) => { // 3
    led.off();
    bot.reply(message, `<@${message.user}> - there you go`);
});
```

Code notes:

1. We define the LED object as effectively a global so we can reference it
in the bot message event handlers.

2. This is a very direct handler for the specific phrase "lights on". It will
even capture "turn the lights on" or even "can you turn the lights on". Once
captured, it simply turns the LED to the on state, replies and hands off.

3. As above, the handler looks for a specific message and then turns the LED
off.

## Run the example

You can run the example by executing the following:

```
node examples/code/3-lightbot.js
```

Again, once the code initialises, you should see your bot become available in
slack at which point you can talk to it. If you say, "turn the lights on" or
"please turn the lights off" it should follow your instructions and it should
turn the LED on your arduino on and off.

## Extensions

Go further with some of these ideas:

* See if you can make your bot respond to more instructions such as `blink fast`
or `blink slow`
* The next quick example will get your bot to loosen up its language criteria

