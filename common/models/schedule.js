// "use strict";

let loopback = require('loopback');
const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('replaceById');

  model.disableRemoteMethodByName('prototype.__get__stone');

};