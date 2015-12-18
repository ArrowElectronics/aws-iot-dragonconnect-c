'use strict';

var fs = require('fs'),
    AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var config = require('dragonconnect-config');

var configureAws = require('./../../util/helper').configureAws,
    DynamicRoleHelper = require('./../iam/dynamicrolehelper');

var policies = require('./policies'),
    topicRules = require('./topicrules');


function createPolicy(iot, policyRef) {
  var policyName = config['iot']['policies'][policyRef];
  if (!policyName) {
    throw new TypeError('Invalid configuration for iot.policies as ' + policyName + ' is not defined.');
  }

  var awsGetPolicy = Bluebird.promisify(iot.getPolicy, { context: iot });
  var awsCreatePolicy = Bluebird.promisify(iot.createPolicy, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsGetPolicy({ policyName: policyName });
      })
    .then(function(policy) {
        console.info('IoT Policy of ' + policyName + ' already exists');
      })
    .catch(function(err) {
        switch (err.statusCode) {
          case 404: {
            console.info('Creating IoT Policy of ' + policyName);

            return Bluebird.resolve()
              .then(function() {
                  var params = {
                    policyName: policyName,
                    policyDocument: JSON.stringify(policies[policyRef], null, 2)
                  };

                  return awsCreatePolicy(params);
                });
          }
        }

        throw err;
      });
}

function createTopic(iot, topicRuleRef) {
  var ruleName = config['iot']['topics'][topicRuleRef];
  if (!ruleName) {
    throw new TypeError('Invalid configuration for iot.topics as ' + topicRuleRef + ' is not defined.');
  }

  var awsGetTopicRule = Bluebird.promisify(iot.getTopicRule, { context: iot });
  var awsCreateTopicRule = Bluebird.promisify(iot.createTopicRule, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsGetTopicRule({ ruleName: ruleName });
      })
    .then(function(topicRule) {
        console.info('IoT Topic Rule of ' + ruleName + ' already exists');
      })
    .catch(function(err) {
      switch(err.statusCode) {
        case 401: {
          console.info('Creating IoT Topic Rule of ' + ruleName);

          return Bluebird.resolve()
            .then(function() {
              var params = {
                ruleName: ruleName,
                topicRulePayload: topicRules[topicRuleRef]
              };

              return awsCreateTopicRule(params);
            })
        }
      }

      throw err;
    });
}

function setLoggingOptions(iot) {
  console.info('Setting the IoT logging options');

  return Bluebird.resolve()
    .then(function() {
        var dynamicRoleHelper = new DynamicRoleHelper(new AWS.IAM());

        return dynamicRoleHelper.findRole(config.iam.iot.roleName);
      })
    .then(function(iotRole) {
      var awsSetLoggingOptions = Bluebird.promisify(iot.setLoggingOptions, { context: iot });

      var params = {
        loggingOptionsPayload: {
          roleArn: iotRole.Arn,
          logLevel: 'DEBUG'
        }
      };

      return awsSetLoggingOptions(params);
    });
}

function createResources() {
  configureAws(AWS);

  var iot = new AWS.Iot();

  return Bluebird.resolve()
    .then(function() {
        Bluebird.each(Object.keys(policies), function (policyRef) {
          return createPolicy(iot, policyRef);
        })
      })
    .then(function() {
        Bluebird.each(Object.keys(topicRules), function (topicRuleRef) {
          return createTopic(iot, topicRuleRef);
        })
      })
    .then(function() {
        return setLoggingOptions(iot);
      });
}

function deletePolicy(iot, policyRef) {
  var policyName = config['iot']['policies'][policyRef];
  if (!policyName) {
    throw new TypeError('Invalid configuration for iot.policies as ' + policyName + ' is not defined.');
  }

  console.info('Deleting IoT policy for ' + policyName);

  var awsDeletePolicy = Bluebird.promisify(iot.deletePolicy, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        awsDeletePolicy({
          policyName: policyName
        });
      });
}

function deleteTopic(iot, topicRuleRef) {
  var ruleName = config['iot']['topics'][topicRuleRef];
  if (!ruleName) {
    throw new TypeError('Invalid configuration for iot.topics as ' + topicRuleRef + ' is not defined.');
  }

  console.info ('Deleting IoT topic rule for ' + ruleName);

  var awsDeleteTopicRule = Bluebird.promisify(iot.deleteTopicRule, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        awsDeleteTopicRule({
          ruleName: ruleName
        });
      });
}

function deleteResources(context) {
  configureAws(AWS);

  var iot = new AWS.Iot();

  return Bluebird.resolve()
    .then(function() {
      Bluebird.each(Object.keys(policies), function (policyRef) {
        return deletePolicy(iot, policyRef);
      })
    })
    .then(function() {
      Bluebird.each(Object.keys(topicRules), function(topicRuleRef) {
        return deleteTopic(iot, topicRuleRef);
      })
    });
}

var manage = function(cmd) {
  switch(cmd) {
    case 'create':
      return createResources();
      break;
    case 'delete':
      return deleteResources();
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;