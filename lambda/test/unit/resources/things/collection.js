'use strict';

var AWS = require('aws-sdk'),
    uuid = require('uuid'),
    randomString = require('randomr'),
    deepcopy = require('deepcopy'),
    sinon = require('sinon'),
    chai = require('chai'),
    sinonChai = require('sinon-chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/things/collection');

var config = require('./../../config');

function transformListThingsResponse(result) {
  var returnValue = [];

  var things = result.things;
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

  return returnValue;
}

describe('retrieve a collection of things', function () {
  var context = config.getContext();

  describe('should deny access without proper permissions', function() {
    it('for listThings', function(done) {
      var self = this;
      var testName = self.test.fullTitle();

      context.logger.info(testName);

      var thingId = 'listThingsPermission';

      var detail = {
        cause: {
          message: 'User: arn:aws:sts::012345678901:assumed-role/lambdaFunction is not authorized to perform: iot:ListThings on resource: arn:aws:iot:us-east-1:012345678901:thing/' + thingId,
          code: 'AccessDeniedException',
          statusCode: 403,
          retryable: false,
          retryDelay: 30
        },
        code: 'AccessDeniedException',
        statusCode: 403,
        retryable: false,
        retryDelay: 30
      };

      var iot = new AWS.Iot();

      var listThingsStub = sinon.stub(iot, 'listThings');
      listThingsStub.throws(AWS.util.error(new Error(), detail));

      var message = {
      };

      subject(message, context, iot)
        .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
        .finally(function() {
          listThingsStub.restore();
        })
        .should.be.rejectedWith(/^AccessDeniedError/)
        .and.notify(done);
    });
  });

 it('where all things have no associated principals', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr": "val"
          },
          "thingName": "test"
        },
        {
          "attributes": {},
          "thingName": "led"
        }
      ]
    };

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var message = {};

    subject(message, context, iot)
      .finally(function() {
        listThingsStub.restore();
      })
      .should.eventually.be.fulfilled
      .and.to.deep.equal([])
      .and.notify(done);
  });

  it('where all things have associated principals', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr": "val",
            "certificateArn": "arn:aws:iot:us-east-1:012345678901:" +
              "cert/3fae83d5e7447929b198a10d1d2e75cb4b9f99407e41b85748de1d91c340753d"
          },
          "thingName": "test"
        },
        {
          "attributes": {
            "certificateArn": "arn:aws:iot:us-east-1:012345678901:" +
              "cert/d327dab8a3f4e386854a5eb338ce550b284a7b3e3c90ac7cd7e75961e0a1bda8"
          },
          "thingName": "led"
        }
      ]
    };

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var message = {};

    subject(message, context, iot)
      .finally(function() {
          listThingsStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(transformListThingsResponse(listThingsResponse))
      .and.notify(done);
  });

  it('where some things have no associated principals', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr": "val"
          },
          "thingName": "test"
        },
        {
          "attributes": {
            "certificateArn": "arn:aws:iot:us-east-1:012345678901:" +
              "cert/eef774faec1911323e1f666be3c8feeac775492d3cdb2c070da618e7f266c6da"
          },
          "thingName": "led"
        }
      ]
    };

    var expectedThing = deepcopy(listThingsResponse.things[1]);

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var message = {};

    subject(message, context, iot)
      .then(function(result) {
        context.logger.info({ result: result }, testName);

        return result;
      })
      .finally(function() {
        listThingsStub.restore();
      })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(transformListThingsResponse({
          "things": [
            expectedThing
          ]
        }))
      .and.notify(done);
  });
});
