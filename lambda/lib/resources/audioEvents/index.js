'use strict';

var AWS = require('aws-sdk'),
    dynamoDoc = require('dynamodb-doc');

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var requestSchema = require('./../../model/audioEvents/command');

function configure(context) {
  var methodName = 'audioEvent#configureAws()';

  if (context.hasOwnProperty('config')) {
    var config = context.config;
    if (config.hasOwnProperty('aws')) {
    var awsConfig = config.aws;

      context.logger.info({ awsConfig: awsConfig }, methodName);

      AWS.config.update(awsConfig);
    }
  }
}

function invoke(event, context) {
  var action;
  switch (event.action) {
    case 'retrieve':
    {
      action = require('./retrieve');
      break;
    }
    case 'create':
    {
      action = require('./create');
      break;
    }
    default:
      throw new TypeError('Unable to handle action type of ' + event.action);
  }

  var iot = new AWS.Iot();
  var dynamoDb = new dynamoDoc.DynamoDB();

  return action(event.message, context, iot, dynamoDb);
}

var manage = function(event, context, callback) {
  var methodName = 'audioEvent#manage()';

  new ValidationManager(context).validate(event, requestSchema)
    .then(function() {
        return configure(context);
      })
    .then(function() {
        return invoke(event, context);
      })
    .then(function(result) {
        context.logger.info({ result: result }, methodName);

        return callback(null, result);
      })
    .catch(function(err) {
        return callback(err, null);
      });
};

// Export For Lambda Handler
module.exports = manage;
