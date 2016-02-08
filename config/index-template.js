'use strict';

var audioEventsName = 'DragonConnect-audioEvents';
var ledName = 'DragonConnect-led';
var thingsName = 'DragonConnect-things';

module.exports = {
  region: '__aws_region__',
  accountNumber: '__aws_accountNumber__',
  admin: {
    registry: '__aws_registryDir__'
  },
  iam: {
    lambda: {
      roleName: 'DragonConnect-Lambda'
    },
    api: {
      roleName: 'DragonConnect-ApiGateway'
    },
    iot: {
      roleName: 'DragonConnect-IoT'
    }
  },
  lambda: {
    audioEvents: {
      name: audioEventsName,
      handler: 'audioEvents.handler'
    },
    led: {
      name: ledName,
      handler: 'led.handler'
    },
    things: {
      name: thingsName,
      handler: 'things.handler'
    }
  },
  dynamodb: {
    audioEvents: {
      name: audioEventsName
    }
  },
  iot: {
    policies: {
      DragonConnectThing: 'DragonConnect'
    },
    topics: {
      audioEvents: 'DragonConnectAudioEvents'
    }
  }
};
