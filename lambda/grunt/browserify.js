'use strict';

module.exports = {
  options: {
    browserifyOptions: {
      standalone: 'lambda',
      browserField: false,
      builtins: false,
      commondir: false,
      detectGlobals: true,
      insertGlobalVars: {
        // Handle process https://github.com/substack/node-browserify/issues/1277
        process: function() {
        }
      }
    },
    exclude: [ 'aws-sdk' ]
  },
  audioEvents: {
    src: [ 'lib/lambda/audioEvents/handler.js' ],
    dest: 'dist/audioEvents/audioEvents.bundled.js'
  },
  led: {
    src: [ 'lib/lambda/led/handler.js' ],
    dest: 'dist/led/led.bundled.js'
  },
  things: {
    src: [ 'lib/lambda/things/handler.js' ],
    dest: 'dist/things/things.bundled.js'
  }
};
