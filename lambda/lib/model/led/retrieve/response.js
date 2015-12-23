var thing = require('./../../entity/thing');
var led = require('./../../entity/led');

module.exports = {
  "entities": {
    "thing": thing,
    "led": led
  },
  "schema": {
    "id": "led-response",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "active": {
        "$ref": "/entity/led#/definitions/active"
      }
    },
    "required": [
      "thingId", "active"
    ],
    "additionalProperties": false
  }
};