var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/audioEvents/retrieve/response');

var config = require('./../../../config');

describe('the audioEvent retrieve response model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(function () {
    validationManager = new ValidationManager(context);
  });

  it('must validate with valid audio events', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var audioEvents = {
      thingId: 'validId',
      events: [
        {
          volume: 'increase',
          timestamp: 1
        },
        {
          volume: 'decrease',
          timestamp: 2
        }
      ]
    };

    validationManager.validate(audioEvents, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate with a valid thingId and no events', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var audioEvents = {
      thingId: 'validThingIdNoEvents'
    };

    validationManager.validate(audioEvents, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done)
  });

  it('must validate with a valid thingId and empty events', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var audioEvents = {
      thingId: 'validId',
      events: []
    };

    validationManager.validate(audioEvents, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate with additional properties', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var audioEvents = {
      thingId: 'validId',
      events: [
        {
          volume: 'increase',
          timestamp: 1
        }
      ],
      additionalProperty: false
    };

    validationManager.validate(audioEvents, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });
});
