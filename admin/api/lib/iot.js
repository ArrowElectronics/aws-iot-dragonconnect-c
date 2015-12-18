var fs = require('fs'),
    AWS = require('aws-sdk'),
    Promise = require('bluebird');

var helper = require('./helper'),
    configure = helper.configure,
    createArn = helper.createArn;

var policyVersion = '2012-10-17';
var policyName = 'dragonconnect';

var certificateDir = '../../DragonBoard/certs/';
var keysAndCertificatesFileName = certificateDir + 'certificatesAndKeys.json';

function createPolicy(iot, context) {
  console.info('Creating IoT policy');

  var createPolicy = Promise.promisify(iot.createPolicy, { context: iot });

  var allow = 'Allow';
  var policy = {
    Version: policyVersion,
    Statement: [
      {
        Effect: allow,
        Action: [ 'iot:Connect' ],
        Resource: [ '*' ]
      },
      {
        Effect: allow,
        Action: [ 'iot:Publish' ],
        Resource: [ createArn('topic/things/*/audio/events', context) ]
      },
      {
        Effect: allow,
        Action: [ 'iot:Publish' ],
        Resource: [ createArn('topic/$aws/things/*/shadow/update', context) ]
      },
      {
        Effect: allow,
        Action: [ 'iot:Subscribe' ],
        Resource: [ createArn('topicfilter/$aws/things/*/shadow/update/delta', context) ]
      }
    ]
  };

  var params = {
    policyName: policyName,
    policyDocument: JSON.stringify(policy, null, 2)
  };

  return Promise.resolve()
    .then(function() {
      return createPolicy(params);
    });
}

function createThing(iot, context) {
  console.info('Creating thing ' + context.thingId);

  var awsCreateThing = Promise.promisify(iot.createThing, { context: iot });

  var params = {
    thingName: context.thingId,
    attributePayload: {
      attributes: {
        reference: 'dragonconnect'
      }
    }
  };

  return Promise.resolve()
    .then(function() {
      return awsCreateThing(params)
    });
}

function createPrincipal(iot, context) {
  console.info('Creating principal');

  var awsCreateKeysAndCertificate = Promise.promisify(iot.createKeysAndCertificate, { context: iot });

  return Promise.resolve()
    .then(function() {
        return awsCreateKeysAndCertificate({
            setAsActive: true
        })
      })
    .then(function(data) {
        fs.writeFileSync(keysAndCertificatesFileName, JSON.stringify(data, null, 2));
        fs.writeFileSync(certificateDir + 'aws.crt', data.certificatePem);
        fs.writeFileSync(certificateDir + 'aws.key', data.keyPair.PrivateKey);

        return data;
      });
}

function attachPrincipalToThing(iot, certificateArn, context) {
  console.info('Attaching principal to thing ' + context.thingId);

  var awsAttachThingPrincipal = Promise.promisify(iot.attachThingPrincipal, { context: iot });

  return Promise.resolve()
    .then(function() {
      return awsAttachThingPrincipal({
        principal: certificateArn,
        thingName: context.thingId
      })
    })
}

function attachPolicyToPrincipal(iot, certificateArn, context) {
  console.info('Attaching policy ' + policyName + ' to principal for thing ' + context.thingId);

  var awsAttachPrincipalPolicy = Promise.promisify(iot.attachPrincipalPolicy, { context: iot });

  return Promise.resolve()
    .then(function() {
        return awsAttachPrincipalPolicy({
          policyName: policyName,
          principal: certificateArn
        })
      });
}

function createResources(context) {
  configure(AWS, context);

  var iot = new AWS.Iot();

  return Promise.resolve()
    .then(function () {
        return createThing(iot, context)
      })
    .then(function () {
        return createPolicy(iot, context)
      })
    .then(function () {
        return createPrincipal(iot, context)
      })
    .then(function(data) {
        return attachPrincipalToThing(iot, data.certificateArn, context)
          .then(function() {
            return attachPolicyToPrincipal(iot, data.certificateArn, context);
          })
      });
}

function deletePolicy(iot, context) {
  console.info('Deleting IoT policy');

  var awsDeletePolicy = Promise.promisify(iot.deletePolicy, { context: iot });

  return Promise.resolve()
    .then(function() {
        awsDeletePolicy({
          policyName: policyName
        });
      });
}

function deletePrincipal(iot, certificateId, context) {
  console.info('Deleting principal');

  var awsUpdateCertificate = Promise.promisify(iot.updateCertificate, { context: iot });
  var awsDeleteCertificate = Promise.promisify(iot.deleteCertificate, { context: iot });

  return Promise.resolve()
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

  var awsDeleteThing = Promise.promisify(iot.deleteThing, { context: iot });

  return Promise.resolve()
    .then(function() {
        return awsDeleteThing({
          thingName: context.thingId
        })
      });
}

function detachPrincipalFromThing(iot, certificateArn, context) {
  console.info('Detaching principal from thing ' + context.thingId);

  var awsDetachThingPrincipal = Promise.promisify(iot.detachThingPrincipal, { context: iot });

  return Promise.resolve()
    .then(function() {
        return awsDetachThingPrincipal({
          principal: certificateArn,
          thingName: context.thingId
        })
      });
}

function detachPolicyFromPrincipal(iot, certificateArn, context) {
  console.info('Detaching policy ' + policyName + ' from principal for thing ' + context.thingId);

  var awsDetachPrincipalPolicy = Promise.promisify(iot.detachPrincipalPolicy, { context: iot });

  return Promise.resolve()
    .then(function() {
        return awsDetachPrincipalPolicy({
          policyName: policyName,
          principal: certificateArn
        })
      });
}

function deleteResources(context) {
  configure(AWS, context);

  var iot = new AWS.Iot();

  var keysAndCertificates = require(keysAndCertificatesFileName);

  return Promise.resolve()
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
        return deletePolicy(iot, context)
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