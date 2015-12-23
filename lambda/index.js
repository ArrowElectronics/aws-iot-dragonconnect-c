var audioEvent = require('./lib/resources/audioEvent'),
    led = require('./lib/resources/led'),
    things = require('./lib/resources/things');

var errors = require('./lib/error');

var logging = require('./lib/util/log');

var validation = require('./lib/model/validationmanager');

module.exports = {
  resources: {
    audioEvent: audioEvent,
    led: led,
    things: things
  },

  errors: {
    AccessDeniedError:          errors.AccessDeniedError,
    ResourceAlreadyExistsError: errors.ResourceAlreadyExistsError,
    ResourceNotFoundError:      errors.ResourceNotFoundError,
    UnknownError:               errors.UnknownError
  },

  logging: {
    LogStream: logging.LogStream,
    CloudWatchStream: logging.CloudWatchStream,
    FileStream: logging.FileStream,
    LoggerFactory: logging.LoggerFactory
  },

  validation: {
    InvalidEntityError: validation.InvalidEntityError,
    ValidationManager: validation.ValidationManager
  }
};
