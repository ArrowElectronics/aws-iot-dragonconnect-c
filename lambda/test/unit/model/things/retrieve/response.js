var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/things/retrieve/response');

var config = require('./../../../config');

var findProperty = require('./../../../util/common').findProperty;

describe('the things retrieve response model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(function () {
    validationManager = new ValidationManager(context);
  });

  it('must validate with a valid name and attributes', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'validId',
      attributes: {
        attr1: "val1"
      }
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate with a valid name and no attributes', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'validId',
      attributes: {}
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });

  it('must not validate with a valid name and more attributes than allowed', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'validId'
    };

    var MAX_ELEMENTS = findProperty(subjectSchema.schema.properties.attributes.allOf, 'maxProperties');

    var attributes = {};
    for (var i = 1; i <= MAX_ELEMENTS + 1; i++) {
      var index = i.toString();
      attributes['attr' + index] = 'val' + index;
    }
    thing.attributes = attributes;

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });
});
