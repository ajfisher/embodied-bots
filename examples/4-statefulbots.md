# Stateful Lighting Bot

## Objective

This exercise builds on the previous one and starts introducing ambiguity in the
things your bot can understand (making it more flexible) and gives the bot an
understanding of the current state of your lighting system. This will allow it
to have longer conversations and seek clarity in ambiguous situations.

## Preparation

Keep the circuit from before as it was.

## Use the example file

As the code is starting to get quite long, only snippets will now appear. Follow
along in `examples/code/4-statefulbot.js`.

### Code notes

1. `ledstate` is introduced as a global variable so the bot can query it.

2. `.hears()` is now using regexes in place of literal phrases in order to make
it more flexible. This helps deal with slight imprecision such as "turn the light on"
as well as "turn the lights on" (note pluralisation). Other regexes deal with
reversal of syntax which is a common English thing "turn on the light" vs
"turn the light on".

    ```
    botcontroller.hears(['light(.?) on', 'on(.?) the light(.?)'], channels, (bot, message) => {
    ```

3. When an action is taken, the state of the light is updated so it's understood

4. In order to create some variation, a set of responses is generated and then
simply randomly chosen. Better choice algorithms can be applied however this
creates some language variance which is nice to read.

    ```
    let replies = [
        `Sure thing.`,
        `I am here just to switch your lights on and off, ${user}`,
        `If I'm passing, ${user}, I'll flip them on.`,
    ];

    let response = replies[Math.floor(Math.random() * replies.length)];
    ```

5. Ambiguous instructions can prompt the bot to take action to clarify. This
is shown below with extra code notes underneath.

    ```
    botcontroller.hears(['light(.?)$'], channels, (bot, message) => {
        bot.startConversation(message, function(err, convo) { // 6

            // first we look at what state the LED is in.
            let state = ledstate ? "on" : "off"; // what is LED currently
            let question_state = ledstate ? "off" : "on"; // what do we ask about

            // add a timeout option
            convo.setTimeout(15000); // 7
            convo.onTimeout((convo) => {
                convo.say(`I'll leave the light ${state}. Just let me know if you want to change it`);
                convo.next();
            });

            // now ask what to do
            // 8
            convo.ask(`The light is currently *${state}*. Do you want me to turn it ${question_state}?`,
            [{
                pattern: bot.utterances.yes, // 9
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
    ```

6. A conversation is triggered between the bot and the human which allows a
multi-step action to occur. A bot can say things and ask questions.

7. A timeout and handler is set so that if the question remains unanswered by
the human then the bot will simply not touch anything and will hand off back
to the start.

8. Here the bot specifically asks the human for imput. The responses it can
handle are defined in the array of objects passed to the function.

9. Botkit can look for `utterances` that mean `yes` or `no`, things like
"yeah", "nah", "yep", "nope", "ya" etc.

## Run the example

You can run the example by executing the following:

```
node examples/code/4-statefulbot.js
```

Again, once the code initialises, you should see your bot become available in
slack at which point you can talk to it. You should now be able to have some
more robust light-related discussion with your bot.

## Going further

Here are some ideas for extending your bot:

* What are other examples of ambiguity where your bot can ask questions to get
clarity?
* Change your bot's replies to make it more or less friendly, sassy or otherwise
define it's persona.
* Give the your bot the ability to refuse to change the lights. Maybe you require
"the magic word" to be said.
* Can you get your bot to answer a question about the current state of the light,
eg: "@botname Is the light on or off?"

