// "use strict";

module.exports = function(model) {
  model.validatesUniquenessOf('timestamp', {scopedTo: ['stoneId'], message: 'there already is a data point for this stone and this exact time.'});
};
