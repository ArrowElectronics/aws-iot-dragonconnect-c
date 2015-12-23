/**
 * AWS Module: Action: Modularized Code
 */

'use strict';

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var requestSchema = require('./../../model/led/command');

function configureAws(context) {
  var methodName = 'led#configureAws()';

  if (context.hasOwnProperty('config')) {
    var config = context.config;
    if (config.hasOwnProperty('aws')) {
      var awsConfig = config.aws;

      context.logger.info({ awsConfig: awsConfig }, methodName);

      AWS.config.update(awsConfig);
    }
  }
}

function invokeAction(event, context) {
  var action;
  switch (event.action) {
    case 'retrieve':
    {
      action = require('./retrieve');
      break;
    }
    case 'update':
    {
      action = require('./update');
      break;
    }
    default:
      throw new TypeError('Unable to handle action type of ' + event.action);
  }

  var iot = new AWS.Iot();
  var describeEndpoint = Bluebird.promisify(iot.describeEndpoint, { context: iot });

  return Bluebird.resolve()
    .then(describeEndpoint)
    .then(function(endpointResult) {
        return action(event.message, context, iot, new AWS.IotData({ endpoint: endpointResult.endpointAddress }));
      })
    .catch(function(err) {
        throw err;
      });
}

var manage = function(event, context, callback) {
  var methodName = 'led#manage()';

  new ValidationManager(context).validate(event, requestSchema)
    .then(function() {
        return configureAws(context)
      })
    .then(function() {
        return invokeAction(event, context)
      })
    .then(function(result) {
        context.logger.info({ result: result }, methodName);

        return callback(null, result);
      })
    .catch(function(ex) {
        return callback(ex, null);
      })
};

// Export For Lambda Handler
module.exports = manage;
