'use strict';

/* The tasks are relatively the same and while not technically correct, the approach will prevent
 * unnecessary maintenance.
 */
module.exports = {
  audioEvents: '<%= zip.audioEvents.dest %>',
  led: '<%= zip.led.dest %>',
  things: '<%= zip.things.dest %>'
};