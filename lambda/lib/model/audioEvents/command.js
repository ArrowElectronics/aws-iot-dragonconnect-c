module.exports = {
  "schema": {
    "id": "/command/audioEvent",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "action": {
        "enum": [ "create", "retrieve" ]
      },
      "message": {
        "type": "object"
      }
    },
    "required": [ "action", "message" ]
  }
};