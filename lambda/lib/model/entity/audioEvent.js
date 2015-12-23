module.exports = {
  "id": "/entity/audioEvent",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "definitions": {
    "event": {
      "type": "object",
      "properties": {
        "volume": {
          "enum": [
            "increase", "decrease"
          ]
        },
        "timestamp": {
          "type": "integer"
        },
        "required": [
          "volume", "timestamp"
        ]
      },
      "additionalProperties": false
    },
    "events": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/event"
      }
    },
    "limit": {
      "type": "integer"
    }
  }
};