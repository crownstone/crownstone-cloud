// "use strict";

module.exports = function(model) {

  // This induces an extra find for EVERY insert.
  // model.validatesUniquenessOf('timestamp', {scopedTo: ['stoneId'], message: 'there already is a data point for this stone and this exact time.'});
};
