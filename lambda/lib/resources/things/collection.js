'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

function thingPrincipalFilter(thing, context, iot) {
  var methodName = 'collection#thingPrincipalFilter()';

  var params = {
    thingName: thing.thingName
  };

  var iotListThingPrincipals = Bluebird.promisify(iot.listThingPrincipals, { context: iot });
  return Bluebird.resolve()
    .then(function() {
        return iotListThingPrincipals(params)
      })
    .then(function(result) {
      var returnValue = false;

      if (result && result.hasOwnProperty('principals')) {
        var principals = result.principals;
        if (Array.isArray(principals) && principals.length > 0) {
          returnValue = true;
        }
      }

      context.logger.info({ thing: thing, principals: result, returnValue: returnValue }, methodName);

      return returnValue;
    });
}

function transformResponse(things, context) {
  var returnValue = [];

  if (things && Array.isArray(things)) {
    for (var i = 0; i < things.length; i++) {
      var thing = things[i];

      var entity = {
        thingId: thing.thingName
      };

      if (thing.hasOwnProperty('attributes')) {
        var attributes = thing.attributes;
        if (Object.keys(attributes).length > 0) {
          entity.attributes = deepcopy(thing.attributes);
        }
      }

      returnValue.push(entity);
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
        context.logger.info( { thingList: thingList }, methodName);

        return thingList.things;
      })
    .filter(function(thing) {
        return thingPrincipalFilter(thing, context, iot);
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
