var thing = require('./../../entity/thing');
var audioEvent = require('./../../entity/audioEvent');

module.exports = {
  "entities": {
    "thing": thing,
    "audioEvent": audioEvent
  },
  "schema": {
    "id": "audioEvent-retrieve-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "limit": {
        "$ref": "/entity/audioEvent#/definitions/limit"
      }
    },
    "required": [
      "thingId"
    ],
    "additionalProperties": false
  }
};