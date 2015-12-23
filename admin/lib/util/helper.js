'use strict';

var config = require('dragonconnect-config');

var configureAws = function(AWS) {
  AWS.config.update({
    region: config.region
  });
};

module.exports = {
  configureAws: configureAws
};