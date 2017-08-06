const dotenv = require('dotenv').config(); // 1
const five = require('johnny-five');

let board = new five.Board({port: process.argv[2]});

board.on('ready', () => {

    let led = new five.Led(process.env.LED_PIN);

    led.blink(1000);

});

board.on('error', (err) => {

    console.log(err);
    process.exit();
});
