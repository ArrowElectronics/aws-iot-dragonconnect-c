'use strict';

var config = require('dragonconnect-config');

function createIotArn(resource) {
  return ['arn:aws:iot', config.region, config.accountNumber, 'rule/' + resource].join(':');
}

module.exports = {
  audioEvents: {
    FunctionName: config.lambda.audioEvents.name,
    Action: 'lambda:InvokeFunction',
    Principal: 'iot.amazonaws.com',
    StatementId: 'audioEventsStatement',
    SourceArn: createIotArn(config.iot.topics.audioEvents)
  }
};