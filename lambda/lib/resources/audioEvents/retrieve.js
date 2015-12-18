'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var config = require('dragonconnect-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/audioEvents/retrieve/request');

var single = require('./../things/single');

function createRetrievalParams(message, context) {
  var methodName = 'audioEvent-retrieve#transformRequest()';

  var returnValue = {
    TableName:  config.dynamodb.audioEvents.name,
    ScanIndexForward: false,
    KeyConditionExpression: 'thingId = :thingId',
    ExpressionAttributeValues: {
      ':thingId': message.thingId
    },
    Limit: message.limit || 10
  };
  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function transformResponse(thingId, result, context) {
  var methodName = 'audioEvent-retrieve#transformResponse()';

  var returnValue = {
    thingId: thingId
  };

  var events = [];

  var items = result.Items;
  for (var i = 0; i < items.length; i++) {
    events.push(deepcopy(items[i].observation));
  }
  returnValue.events = events;

  context.logger.info({ thingId: thingId, result: result, response: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'audioEvent-retrieve#handleError()';

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

var retrieve = function(message, context, iot, dynamoDb) {
  var query = Bluebird.promisify(dynamoDb.query, { context: dynamoDb });

  var thingId = message.thingId;

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        // Ensure that the thing exists and is associated with a principal

        var params = {
          thingId: thingId
        };

        return single(params, context, iot);
      })
    .then(function() {
        return createRetrievalParams(message, context);
      })
    .then(query)
    .then(function(result) {
        return transformResponse(thingId, result, context);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = retrieve;