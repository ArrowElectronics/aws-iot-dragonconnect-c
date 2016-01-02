---
layout: topic
---
# Overview

The <font class="dragon_font">Dragon</font>Connect example utilizes the
following Lambda functions written in JavaScript

* DragonConnect-things
* DragonConnect-led
* DragonConnect-audioEvents

# Lambda Function Management

Tasks have been defined to create, update, and delete the
<font class="dragon_font">Dragon</font>Connect Lambda functions.

## Create

The Lambda functions rely upon the general
<font class="dragon_font">Dragon</font>Connect configuration and
<a href="http://gruntjs.com", target="_blank">Grunt</a>,
a JavaScript Task Runner.  The following steps will deploy the Lambda
functions

```sh
$ cd lambda
$ npm install ../config
$ npm install -g grunt-cli
$ npm install
$ grunt create
```

When these steps have been completed, the Lambda functions will be
available for use.  You can check their availability either through the
AWS console or by using the following command

```sh
$ aws lambda list-functions \
--query 'Functions[?FunctionName.contains(@, `DragonConnect`)]'
```

If you choose to use this command, be sure to use a backtick (`) around the
DragonConnect string.

## Update

If you decide to experiment and alter the functionality of a Lambda function,
a grunt task has been defined to perform an update.  The following command
will perform an update of all the Lambda functions

```sh
$ grunt update
```

## Delete

In order to delete the Lambda functions, use the following command

```sh
$ grunt delete
```

## Targets

The above commands will perform the task for all Lambda functions.  If you
would like to perform the task for a particular Lambda function use the
following command

```sh
$ grunt ${task}:${target}
```

where task may be create, update, or delete and target would have a value of

Target | Lambda Function
-------|----------------
things | DragonConnect-things
led  | DragonConnect-led
audioEvents | DragonConnect-audioEvents

# Detail

The management of the Lambda functions require each function to be packaged
and the AWS _Lambda_ service to be configured.  In addition, the functionality
of each Lambda function is discussed.

## Package

Each Lambda function is packaged using
<a href="http://browserify.org" target="_blank">Browserify</a> and
<a href="https://github.com/mishoo/UglifyJS2" target="_blank">Uglify</a>.
This reduces the size of the Lambda function and improves startup performance.

Amazon includes the JavaScript aws-sdk within the Lambda environment and
therefore it is excluded when performing the packaging of the function.

## Configuration

The <font class="dragon_font">Dragon</font>Connect Lambda functions use the
same configuration of utilizing 1024 MB of memory and a timeout of 5 seconds.
In addition, each Lambda function is configured to use the DragonConnect-Lambda
IAM role.

## Function Descriptions

Each Lambda function represents the operations that may be performed on a
resource (API Gateway).

* DragonConnect-things

    The DragonConnect-things function will retrieve information about
    all things or about a specific thing.  The function only returns
    a thing if it has an associated principal (certificate).  Thus,
    you may notice a difference between the output of the command

    ```sh
    $ aws iot list-things
    ```

    and the things returned by this function.

    Essentially, this Lambda function provides the capabilities of the API
    to perform

    * GET /things
    * GET /things/{thingId}

    As you will see in the step, [Manage Things](./things.html),
    a utility will create a thing, a certificate (principal), and will
    associate the thing to the principal as well as the DragonConnect IoT
    policy.

* DragonConnect-led

    The DragonConnect-led function will retrieve the current state of the
    device shadow as well as request an update of the state.  The state
    of the device shadow is simply defined as

    ```json
    {
      "active": false
    }
    ```

    where a value of false represents the LED being off and true represents
    the LED being on.

    This Lambda function enables the following API operations

    * GET /things/{thingId}/led
    * POST /things/{thingId}/led

* DragonConnect-audioEvents

    The DragonConnect-audioEvents function will create an audio event when
    the volume up or volume down button is pressed.  The volume up or down
    event includes a timestamp in seconds from the epoch (UTC)

    ```json
    {
      "volume": "increase",
      "timestamp": 1451685789
    }
    ```

    Volume may have a value of either increase or decrease.  A value of
    increase represents the volume up button being pressed and decrease
    represents the volume down button being pressed.

    The DragonConnect-audioEvents Lambda function enables audio events to
    be created when messages are published to the things/+/audio/events
    MQTT topic.  This function also enables the following API operation

    * GET /things/{thingId}/audio/events?limit=10
