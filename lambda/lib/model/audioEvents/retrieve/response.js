var thing = require('./../../entity/thing');
var audioEvent = require('./../../entity/audioEvent');

module.exports = {
  "entities": {
    "thing": thing,
    "audioEvent": audioEvent
  },
  "schema": {
    "id": "audioEvent-retrieve-response",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      events: {
        "$ref": "/entity/audioEvent#/definitions/events"
      }
    },
    "required": [
      "thingId", "events"
    ],
    "additionalProperties": false
  }
};