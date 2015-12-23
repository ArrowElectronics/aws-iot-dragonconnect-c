var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/audioEvents/create/request');

var config = require('./../../../config');

describe('the audioEvent create request model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(
    function () {
      validationManager = new ValidationManager(context);
    }
  );

  it('must validate a valid request', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var audioEvent = {
      thingId: 'validThingsRetrieveRequest',
      event: {
        volume: 'increase',
        timestamp: 1
      }
    };

    validationManager.validate(audioEvent, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate with an array of events', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      thingId: 'invalidAudioEventWithEventsArray',
      events: [
        {
          volume: 'increase',
          timestamp: 1
        }
      ]
    };

    validationManager.validate(event, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });

  it('must not validate an event with additional properties', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      thingId: 'invalidAudioEventCreateRequest',
      event: {
        volume: 'increase',
        timestamp: 1
      },
      additionalProperty: 'val'
    };

    validationManager.validate(event, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
