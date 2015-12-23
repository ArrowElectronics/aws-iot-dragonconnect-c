'use strict';

var Bluebird = require('bluebird');

var config = require('dragonconnect-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/audioEvents/create/request');

var single = require('./../things/single');

function createItemParams(message, context) {
  var methodName = 'audioEvent-create#transformRequest()';

  var returnValue = {
    TableName:  config.dynamodb.audioEvents.name,
    Item: {
      thingId: message.thingId,
      timestamp: message.event.timestamp,
      observation: message.event
    }
  };
  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'audioEvent-create#handleError()';

  context.logger.info( { error: err }, methodName);

  var condition;
  if (err && err.hasOwnProperty('statusCode')) {
    switch (err.statusCode) {
      case 403:
        condition = new AccessDeniedError(err.message);
        break;
      default:
        var statusCode = -1 || err.statusCode;
        condition = new UnknownError(statusCode, err.message);
        break;
    }
  } else {
    condition = err;
  }

  throw condition;
}

var storeItem = function(message, context, iot, dynamoDb) {
  var methodName = 'audioEvent-create#storeItem()';

  var putItem = Bluebird.promisify(dynamoDb.putItem, { context: dynamoDb });

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        // Ensure that the thing exists and is associated with a principal

        var params = {
          thingId: message.thingId
        };

        return single(params, context, iot);
      })
    .then(function() {
        return createItemParams(message, context);
      })
    .then(putItem)
    .then(function(result) {
        context.logger.info({ result: result, expected: {} }, methodName);

        return message;
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = storeItem;