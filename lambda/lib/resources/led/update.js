'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/led/update/request');

var single = require('./../things/single');

function transformRequest(message, context) {
  var methodName = 'led-update#transformRequest()';

  var returnValue = {
    thingName: message.thingId,
    payload: JSON.stringify({
      state: {
        desired: {
          active: message.active
        }
      }
    })
  };
  context.logger.info( { message: message, serviceRequest: returnValue }, methodName);

  return returnValue;
}

function transformResponse(thingId, result, context) {
  var methodName = 'led-update#transformResponse()';

  var returnValue;

  if (result && result.hasOwnProperty('payload')) {
    try {
      var document = JSON.parse(result.payload);

      var state = document.state;
      if (state && state.hasOwnProperty('desired')) {
        returnValue = deepcopy(state.desired);
        returnValue.thingId = thingId;
      }
    } catch (err) {
      context.logger.error({ payloadParseError:  err }, methodName);
    }
  }

  if (!returnValue) {
    returnValue = {};
  }
  context.logger.info({ thingId: thingId, result: result, response: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'led-update#handleError()';

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

var update = function(message, context, iot, iotData) {
  var updateThingShadow = Bluebird.promisify(iotData.updateThingShadow, { context: iotData });

  var validationManager = new ValidationManager(context);
  return validationManager.validate(message, requestSchema)
    .then(function() {
        // Ensure that the thing exists and is associated with a principal

        var params = {
          thingId: message.thingId
        };

        return single(params, context, iot);
      })
    .then(function(thing) {
        return transformRequest(message, context);
      })
    .then(updateThingShadow)
    .then(function(result) {
        return transformResponse(message.thingId, result, context);
      })
    .catch(function(ex) {
        handleError(ex, context);
      });
};

module.exports = update;