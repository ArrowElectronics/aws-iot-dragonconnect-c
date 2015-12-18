'use strict';

var config = require('dragonconnect-config');

var defaultThroughput = {
  ReadCapacityUnits: 5,
  WriteCapacityUnits: 5
};

module.exports = [
  {
    name: config.dynamodb.audioEvents.name,
    hashKey: {
      name: 'thingId',
      type: 'S'
    },
    rangeKey: {
      name: 'timestamp',
      type: 'N'
    },
    throughput: defaultThroughput
  }
];