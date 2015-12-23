'use strict';

var config = require('dragonconnect-config');

function createLambdaArn(resource) {
  return [ 'arn:aws:lambda', config.region, config.accountNumber, 'function', resource ].join(':');
}

module.exports = {
  audioEvents: {
    sql: "SELECT 'create' as action, topic(2) as message.thingId, * as message.event " +
         "FROM 'things/+/audio/events'",
    ruleDisabled: false,
    actions: [
      {
        lambda: {
          functionArn: createLambdaArn(config.lambda.audioEvents.name)
        }
      }
    ]
  }
};
