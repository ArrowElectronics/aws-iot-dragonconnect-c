var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/led/retrieve/response');

var config = require('./../../../config');

describe('the led retrieve response model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(
    function () {
      validationManager = new ValidationManager(context);
    }
  );

  it('must validate a valid response', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'validLedRetrieveResponse',
      active: true
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate an empty response', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var message = {};

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });

  it('must not validate a response with additional properties', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var message = {
      active: true,
      additionalProperty: 'value'
    };

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
