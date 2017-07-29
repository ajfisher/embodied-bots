# Distributed Lighting Bot

## Objective

This exercise builds on the previous one by starting to break up the parts of
the bot into microservices that can operate in different places. This means
if something happens to one part (eg your arduino connection dies), the whole
application doesn't come crashing down. This is a common way of desiging this
type of system to separate concerns and allows your virtual bot to be embodied
through a raft of physical connections.

## Preparation

Keep the circuit from before as it was.

## Introduction to MQTT

MQTT is a publish-subscribe messaging protocol that allows you to create distributed
messaging systems easily. For more on MQTT have a look at this
[intro video by Matteo Collina](https://www.youtube.com/watch?v=WE7GVIFRV7Q).

In our solution, we have a centralised topic called `light` that each part
subscribes or publishes to in order to control the lighting system. For the
purposes of our example we're going to use the public test MQTT infrastructure
at `test.mosquitto.org`. This will get us going quickly without having to run
a server but does mean all our messages are publicly available.

[Mosquitto](http://mosquitto.org) (Java) and
[Mosca](https://www.npmjs.com/package/mosca) (NodeJS) are two MQTT servers you
can use for your own implementations.

## New ENV variables

You'll need to add some additional environment variables to your `.env` file
as noted below:

```
# MQTT server FQDN - leave this unless you're using MOSCA locally
MQTT_SERVER=mqtt://test.mosquitto.org

# Uniq topic to you that you want to post to.
UNIQ_TOPIC=my_test_topic
```

Note that the `UNIQ_TOPIC` variable is there to try and create some namespacing
to avoid message conflicts. MQTT topics can have hierarchy to create structure
kind of like URIs do. As such `ajfisher/light` is different than `lightbot/light`.

The easiest option is to simply use a random string or your usual username.

## Use the example files

The code is now broken up over 3 files:

* `examples/code/5-light-server.js` provides the core engine that subscribes to
the `light` topic and processes whether to turn on or off as a result
* `examples/code/5-light-cmd.js` (and alias `npm run light <state>`) will publish
a message to the `light` topic so you can test sending messages and make sure
it all works.
* `examples/code/5-light-bot.js` will run the bot service that will be able to publish
messages to control the light.

### Code notes

Key highlights are given below:

1. We use message reflection on the server to stop echo effects.

    `5-light-server.js`

    ```
    let client = mqtt.connect(process.env.MQTT_SERVER)
    const sub_topic = process.env.UNIQ_TOPIC + "light/ic";
    const pub_topic = process.env.UNIQ_TOPIC + "light/oc";
    ```

    This means that the server listens for messages on an `ic` topic (input channel)
    to control whether it should take actions, but once an action is complete it
    publishes a message to an `oc` topic (output channel). This is a common pattern
    that allows concentration of topics (eg `light/`) but disambiguation on
    messages (`ic` being for input but `oc` being for output).

    As you can see in `5-light-cmd.js`, control messages are published to `light/ic`
    and then in `5-light-bot.js`, subscription is made to `light/oc` to listen
    for changes so the bot knows the current state of the light, but it publishes
    to `light/ic` in order to control it.

2. `5-light-cmd.js` simply takes an argument from the command line and sends that
on to the server to interpret before shutting down.

3. `5-light-bot.js:154` introduces a new listener for hearing `notify me`. In this
case, the human can ask the bot to notify them if an external service has changed
the light. A global array of `notify_users` is kept so the bot knows who to
contact on an unexpected change.

4. `5-light-bot.js:19` introduces the MQTT subscription handler for light changes
from the server. This way it can compare the server state to the Bot's internal
state of where it believed the Light should be. If it's different it then notifies
all of the users who are on the notification list immediately via DM to the
specific person.

## Run the example

You may need multiple terminals to do this.

Start by running the light server

```
node examples/code/5-light-server.js
```

Test the server by sending light commands.

```
npm run light on
```

and

```
npm run light off
```

If that works then connect the bot.

```
node examples/code/5-light-bot.js
```

You should now be able to talk to the bot as usual and have it configure the
light. In addition if you ask the bot to `notify me` then you'll be added to
the notification list. Once you've done that, change the light state by using
the command line prompt instead and the bot should message you.

## Going further

* Join up multiple people's light servers using the same topics. This would
allow you to coordinate several lights at once.
