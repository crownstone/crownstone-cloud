// "use strict";

let loopback = require('loopback');
const debug = require('debug')('loopback:crownstone');

module.exports = function(model) {

  model.validatesUniquenessOf('scheduleEntryIndex', {scopedTo: ['stoneId'], message: 'A schedule with this scheduleEntryIndex already exists on this Crownstone'});

  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('replaceById');

  model.disableRemoteMethodByName('prototype.__get__stone');

};
