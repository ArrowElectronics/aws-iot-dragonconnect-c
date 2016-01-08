'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

function transformResponse(things, context) {
  var returnValue = [];

  if (things && Array.isArray(things)) {
    for (var i = 0; i < things.length; i++) {
      var thing = things[i];

      var attributes = thing.attributes;
      returnValue.push({
        thingId: thing.thingName,
        attributes: deepcopy(thing.attributes)
      });
    }
  }
  context.logger.info({ things: things, response: returnValue }, 'collection#transformResponse()');

  return returnValue;
}

function handleError(err, context) {
  context.logger.info( { error: err }, 'collection#handleError()');

  var condition;
  if (err.hasOwnProperty('statusCode')) {
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

var retrieveThings = function(message, context, iot) {
  var methodName = 'collection#retrieveThings()';

  var iotListThings = Bluebird.promisify(iot.listThings, { context: iot });

  return iotListThings(message)
    .then(function(thingList) {
        return thingList.things;
      })
    .filter(function(thing) {
        return thing.attributes.hasOwnProperty('certificateArn');
      })
    .then(function(result) {
        return transformResponse(result, context);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

// Export For Lambda Handler
module.exports = retrieveThings;
