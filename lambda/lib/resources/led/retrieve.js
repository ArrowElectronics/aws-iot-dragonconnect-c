'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    ResourceNotFoundError = errors.ResourceNotFoundError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var requestSchema = require('./../../model/led/retrieve/request');

var single = require('./../things/single');

function transformRequest(message, context) {
  var methodName = 'led-retrieve#transformRequest()';

  var returnValue = {
    thingName: message.thingId
  };
  context.logger.info( { message: message, serviceRequest: returnValue }, methodName);

  return returnValue;
}

function transformResponse(thingId, result, context) {
  var methodName = 'led-retrieve#transformResponse()';

  var returnValue;

  if (result && result.hasOwnProperty('payload')) {
    try {
      var document = JSON.parse(result.payload);

      var state = document.state;
      if (state && state.hasOwnProperty('reported')) {
        returnValue = deepcopy(state.reported);
        returnValue.thingId = thingId;
      }
    } catch (err) {
      context.logger.error({ payloadParseError:  err }, methodName);
    }
  }
  context.logger.info({ result: result, response: returnValue }, methodName);

  if (!returnValue) {
    throw new ResourceNotFoundError("The thing '" + thingId + "' has not provided a status.");
  }

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'led-retrieve#handleError()';

  context.logger.info( { error: err }, methodName);

  var condition;
  if (err && err.hasOwnProperty('statusCode')) {
    switch (err.statusCode) {
      case 403:
        condition = new AccessDeniedError(err.message);
        break;
      case 404:
        condition = new ResourceNotFoundError(err.message);
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

var retrieveStatus = function(message, context, iot, iotData) {
  var getThingShadow = Bluebird.promisify(iotData.getThingShadow, { context: iotData });

  var validationManager = new ValidationManager(context);
  return validationManager.validate(message, requestSchema)
    .then(function() {
        // Ensure that the thing exists and is associated with a principal

        var params = {
          thingId: message.thingId
        };

        return single(params, context, iot);
      })
    .then(function() {
        return transformRequest(message, context);
      })
    .then(getThingShadow)
    .then(function(result) {
        return transformResponse(message.thingId, result, context);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = retrieveStatus;