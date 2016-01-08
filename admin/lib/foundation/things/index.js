var AWS = require('aws-sdk'),
    Bluebird = require('Bluebird');

var config = require('dragonconnect-config'),
    configureAws = require('./../../util/helper').configureAws;

function isPolicyApplicable(iot, thing) {
  var iotListPrincipalPolicies = Bluebird.promisify(iot.listPrincipalPolicies, { context: iot });

  return iotListPrincipalPolicies({
        principal: thing.attributes.certificateArn
      })
    .then(function(result) {
        var returnValue = false;

        var policies = result.policies;
        for (var i = 0; i < policies.length; i++) {
          var policy = policies[i];
          if (policy.policyName === config.iot.policies.DragonConnectThing) {
            returnValue = true;
            break;
          }
        }

        return returnValue;
      })
    .catch(function(err) {
        throw err;
      });
}

function detachPrincipal(iot, thing) {
  console.info('Detaching thing ' + thing.thingName + ' from policy ' + config.iot.policies.DragonConnectThing);

  var iotDetachPrincipalPolicy = Bluebird.promisify(iot.detachPrincipalPolicy, { context: iot });

  return iotDetachPrincipalPolicy({
        policyName: config.iot.policies.DragonConnectThing,
        principal: thing.attributes.certificateArn
      })
    .catch(function(err) {
        throw err;
      });
}

function cleanup() {
  configureAws(AWS);

  var iot = new AWS.Iot();

  var iotListThings = Bluebird.promisify(iot.listThings, { context: iot });

  return iotListThings({})
    .then(function(thingList) {
        return thingList.things;
      })
    .filter(function(thing) {
        return thing.attributes.hasOwnProperty('certificateArn');
      })
    .filter(function(thing) {
        return isPolicyApplicable(iot, thing);
      })
    .each(function(thing) {
        return detachPrincipal(iot, thing);
      })
    .catch(function(err) {
        throw err;
      });
}

var manage = function(cmd) {
  switch(cmd) {
    case 'create':
      break;
    case 'delete':
      return cleanup();
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;