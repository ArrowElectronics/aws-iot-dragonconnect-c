'use strict';

module.exports = {
  audioEvents: {
    src: [ '<%= browserify.audioEvents.dest %>' ],
    dest: 'dist/audioEvents/audioEvents.js'
  },
  led: {
    src: [ '<%= browserify.led.dest %>' ],
    dest: 'dist/led/led.js'
  },
  things: {
    src: [ '<%= browserify.things.dest %>' ],
    dest: 'dist/things/things.js'
  }
};