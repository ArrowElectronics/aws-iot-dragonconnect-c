---
layout: topic
---
# Overview

The <font class="dragon_font">Dragon</font>Connect example uses several
Amazon services including the _API Gateway_, _Lambda_, _IoT_, and _CloudWatch_.
Amazon controls access to these services using _Identity and Access Management_
(IAM).  This step will configure _IAM_ to allow the proper access and
will also configure elements of _IoT_.  The steps below will get you started
and if you are curious about what the administration utility does then
consider reading the [Details](#details).

# Create Foundational Elements

The <font class="dragon_font">Dragon</font>Connect example includes several
utility functions to help manage resources.  The following steps will
configure the foundational elements

```sh
$ cd admin
$ npm install ../config
$ npm install
$ node lib/foundation.js create
Role DragonConnect-ApiGateway-59f4 created.
Role DragonConnect-IoT-59f4 created.
Role DragonConnect-Lambda-59f4 created.
Setting the IoT logging options
IoT Policy of DragonConnect created
IoT Topic Rule of DragonConnectAudioEvents created
Table DragonConnect-audioEvents created
```

# Remove Foundational Elements

The <font class="dragon_font">Dragon</font>Connect configuration may be
removed by issuing the following commands

```sh
$ cd admin
$ node lib/foundation.js delete
```

# Details
The foundation.js script performs the following functions by Amazon service

* _IAM_
    * Create roles that permit the required actions for the _API Gateway_,
      _Lambda_, and _IoT_ services
* _IoT_
    * Configures the logging options used for debugging purposes
    * Creates policies that allow clients to perform the required operations
      on MQTT topics
    * Creates a topic rule

The configuration performed for each of the steps shown in the output of the
foundation.js script will be examined.  While the foundation.js script
configures several Amazon services, further configuration is required and
will be performed by additional
<font class="dragon_font">Dragon</font>Connect utilities.

The _IAM_ service provides a fine-grain permission model to control access
to all of the Amazon services.  For more information about _IAM_, please
consult the
<a href="http://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html"
target="_blank">AWS Identity and Access Management User Guide</a>.

### API Gateway IAM Role

The DragonConnect-ApiGateway role includes a trust relationship for
apigateway.amazonaws.com.  This permits the _API Gateway_ to perform the
actions defined by the managed and inline policies.

* Managed Policies

    The **AWSLambdaRole** policy allow's _Lambda_ functions to be invoked.

* Inline Policies

    The **IAMPassRolePolicy** passes the IAM role to the Lambda function.
    For more information, see the section entitled **Granting Permissions
    using the Execution Role** describing the <a href="http://docs.aws.amazon.com/lambda/latest/dg/intro-permission-model.html"
    target="_blank">Lambda Permission Model</a>.

### IoT IAM Role

The DragonConnect-IoT role includes a trust relationship for iot.amazonaws.com.
This permits the _IoT_ service to perform actions defined in the associated
managed policies of

* Managed Policies

    The **AWSIoTLogging** policy allows the management of _CloudWatch_ logs
    and streams.

### Lambda IAM Role

The DragonConnect-Lambda role includes a trust relationship for
lambda.amazonaws.com.  This permits the _Lambda_ service to perform the
actions defined in the associated policies of

* Managed Policies

    The **AWSLambdaBasicExecutionRole** policy allows _CloudWatch_ logs and
    streams to be created.

* Inline Policies

    The **DynamodbPolicy** permits a Lambda function to put an item (create
    a record) and query a table.

    The **IotPolicy** permits a Lambda function to describe the
    Amazon-configured MQTT endpoint, retrieve a list of things, and
    retrieve and update a thing shadow.

### IoT Logging

In addition to allowing the role to manage CloudWatch logs and streams as a
part of the DragonConnect-IoT role, _IoT_ logging must be enabled.  This
performs the equivalent of

```sh
$ aws iot set-logging-options --logging-options-payload \
roleArn="arn:aws:iam::012345678901:role/DragonConnect-IoT-59f4",logLevel="DEBUG"
```

### IoT Policy

The DragonConnect IoT policy defines the actions that are allowed on the IoT
MQTT topics

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:012345678901:topic/things/*/audio/events"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:012345678901:topic/$aws/things/*/shadow/update"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Subscribe"
      ],
      "Resource": [
        "arn:aws:iot:us-east-1:012345678901:topicfilter/$aws/things/*/shadow/update/delta"
      ]
    }
  ]
}
```

This policy allows connections to be established, events to be published to
a custom MQTT topic in things/+/audio/events and to the Device Shadow topic
of $aws/things/+/shadow/update, and clients to subscribe to the
$aws/things/+/shadow/update/delta topic.

### IoT Topic Rules

A single topic rule is required for the
<font class="dragon_font">Dragon</font>Connect example.  The topic rule
configures the DragonConnect-audioEvents Lambda function to be invoked when
a message is received on the things/+/audio/events MQTT topic

```json
{
    "rule": {
        "sql": "SELECT 'create' as action, topic(2) as message.thingId, * as message.event FROM 'things/+/audio/events'",
        "ruleDisabled": false,
        "actions": [
            {
                "lambda": {
                    "functionArn": "arn:aws:lambda:us-east-1:012345678901:function:DragonConnect-audioEvents"
                }
            }
        ],
        "ruleName": "DragonConnectAudioEvents"
    }
}
```

### DynamoDB Tables

The DragonConnect-audioEvents DynamoDB table stores audio events collected
by the client application and published to the things/+/audio/events MQTT
topic.  This step creates the table using _thingId_ (string) as the
partition key and _timestamp_ (number) as the sort key.
