'use strict';

var fs = require('fs'),
    path = require('path');

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird'),
    rimraf = require('rimraf');

var config = require('dragonconnect-config'),
    configureAws = require('./../util/helper').configureAws;

var SimpleError = require('./../errors/simpleerror');

var REGISTRY_BASE = './../../registry';
var KEYS_AND_CERTIFICATES_FILE_NAME = 'certificatesAndKeys.json';

function getRegistry(thingId) {
  return path.join(path.relative(process.cwd(), path.dirname(module.filename)), REGISTRY_BASE, thingId);
}

function createThing(iot, context) {
  console.info('Creating thing ' + context.thingId);

  var awsCreateThing = Bluebird.promisify(iot.createThing, { context: iot });

  var params = {
    thingName: context.thingId,
    attributePayload: {
      attributes: {
        reference: 'dragonconnect'
      }
    }
  };

  return Bluebird.resolve()
    .then(function() {
        return awsCreateThing(params)
      })
    .catch(function(err) {
        switch(err.statusCode) {
          case 409: {
            throw new SimpleError('Resource Already Exists', err);
          }
          default: {
            throw new SimpleError('Unknown Condition', err)
          }
        }
      });
}

function createPrincipal(iot, context) {
  console.info('Creating principal');

  var mkdir = Bluebird.promisify(fs.mkdir);
  var awsCreateKeysAndCertificate = Bluebird.promisify(iot.createKeysAndCertificate, { context: iot });

  var thingRegistry = getRegistry(context.thingId);

  return Bluebird.resolve()
    .then(function() {
        mkdir(thingRegistry);
      })
    .then(function() {
        return awsCreateKeysAndCertificate({
            setAsActive: true
        })
      })
    .then(function(data) {
        fs.writeFileSync(path.join(thingRegistry, KEYS_AND_CERTIFICATES_FILE_NAME),
          JSON.stringify(data, null, 2));
        fs.writeFileSync(path.join(thingRegistry, 'aws.crt'), data.certificatePem);
        fs.writeFileSync(path.join(thingRegistry, 'aws.key'), data.keyPair.PrivateKey);

        return data;
      });
}

function attachPrincipalToThing(iot, certificateArn, context) {
  console.info('Attaching principal to thing ' + context.thingId);

  var awsAttachThingPrincipal = Bluebird.promisify(iot.attachThingPrincipal, { context: iot });

  return Bluebird.resolve()
    .then(function() {
      return awsAttachThingPrincipal({
        principal: certificateArn,
        thingName: context.thingId
      })
    })
}

function attachPolicyToPrincipal(iot, certificateArn, context) {
  var policyName = config.iot.policies.DragonConnectThing;

  console.info('Attaching policy ' + policyName + ' to principal for thing ' + context.thingId);

  var awsAttachPrincipalPolicy = Bluebird.promisify(iot.attachPrincipalPolicy, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsAttachPrincipalPolicy({
          policyName: policyName,
          principal: certificateArn
        })
      });
}

function createResources(context) {
  configureAws(AWS);

  var iot = new AWS.Iot();

  return Bluebird.resolve()
    .then(function () {
        return createThing(iot, context)
      })
    .then(function () {
        return createPrincipal(iot, context)
      })
    .then(function(data) {
        return attachPrincipalToThing(iot, data.certificateArn, context)
          .then(function() {
            return attachPolicyToPrincipal(iot, data.certificateArn, context);
          })
      })
    .catch(function(err) {
        console.error('ERROR');
        console.error('  Condition:  ' + err.condition + ', Message:  ' + err.message);
      });
}

function deletePrincipal(iot, certificateId, context) {
  console.info('Deleting principal');

  var awsUpdateCertificate = Bluebird.promisify(iot.updateCertificate, { context: iot });
  var awsDeleteCertificate = Bluebird.promisify(iot.deleteCertificate, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsUpdateCertificate({
          certificateId: certificateId,
          newStatus: 'INACTIVE'
        })
      })
    .then(function() {
        return awsDeleteCertificate({
          certificateId: certificateId
        })
      });
}

function deleteThing(iot, context) {
  console.info('Deleting thing ' + context.thingId);

  var awsDeleteThing = Bluebird.promisify(iot.deleteThing, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsDeleteThing({
          thingName: context.thingId
        })
      });
}

function detachPrincipalFromThing(iot, certificateArn, context) {
  console.info('Detaching principal from thing ' + context.thingId);

  var awsDetachThingPrincipal = Bluebird.promisify(iot.detachThingPrincipal, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsDetachThingPrincipal({
          principal: certificateArn,
          thingName: context.thingId
        })
      });
}

function detachPolicyFromPrincipal(iot, certificateArn, context) {
  var policyName = config.iot.policies.DragonConnectThing;

  console.info('Detaching policy ' + policyName + ' from principal for thing ' + context.thingId);

  var awsDetachPrincipalPolicy = Bluebird.promisify(iot.detachPrincipalPolicy, { context: iot });

  return Bluebird.resolve()
    .then(function() {
        return awsDetachPrincipalPolicy({
          policyName: policyName,
          principal: certificateArn
        })
      });
}

function deleteResources(context) {
  configureAws(AWS);

  var rmdir = Bluebird.promisify(rimraf);

  var iot = new AWS.Iot();

  var thingRegistry = getRegistry(context.thingId);
  var keysAndCertificates = require(path.join(REGISTRY_BASE, context.thingId, KEYS_AND_CERTIFICATES_FILE_NAME));

  return Bluebird.resolve()
    .then(function() {
        return detachPolicyFromPrincipal(iot, keysAndCertificates.certificateArn, context);
      })
    .then(function() {
        return detachPrincipalFromThing(iot, keysAndCertificates.certificateArn, context);
      })
    .then(function() {
        return deletePrincipal(iot, keysAndCertificates.certificateId, context);
      })
    .then(function() {
        return deleteThing(iot, context)
      })
    .then(function() {
        rmdir(thingRegistry);
      });
}

var manage = function(cmd, context) {
  switch(cmd) {
    case 'create':
      return createResources(context);
      break;
    case 'delete':
      return deleteResources(context);
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;