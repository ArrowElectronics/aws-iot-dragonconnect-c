'use strict';

var config = require('dragonconnect-config');

var POLICY_VERSION = "2012-10-17";
var ALLOW = "Allow";

function createIotArn(resource) {
  return ['arn:aws:iot', config.region, config.accountNumber, resource].join(':');
}

module.exports = {
  DragonConnectThing: {
    "Version": POLICY_VERSION,
    "Statement": [
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Connect"
        ],
        "Resource": [
          "*"
        ]
      },
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Publish"
        ],
        "Resource": [
          createIotArn('topic/things/*/audio/events')
        ]
      },
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Publish"
        ],
        "Resource": [
          createIotArn('topic/$aws/things/*/shadow/update')
        ]
      },
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Subscribe"
        ],
        "Resource": [
          createIotArn('topicfilter/$aws/things/*/shadow/update/delta')
        ]
      },
      {
        "Effect": ALLOW,
        "Action": [
          "iot:Receive"
        ],
        "Resource": [
          createIotArn('topic/$aws/things/*/shadow/update/delta')
        ]
      }
    ]
  }
};