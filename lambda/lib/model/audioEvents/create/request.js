var thing = require('./../../entity/thing');
var audioEvent = require('./../../entity/audioEvent');

module.exports = {
  "entities": {
    "thing": thing,
    "audioEvent": audioEvent
  },
  "schema": {
    "id": "audioEvent-create-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "event": {
        "$ref": "/entity/audioEvent#/definitions/event"
      }
    },
    "required": [
      "thingId", "event"
    ],
    "additionalProperties": false
  }
};