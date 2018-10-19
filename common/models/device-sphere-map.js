// "use strict";

module.exports = function(model) {

  model.disableRemoteMethodByName('prototype.__get__device');
  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__location');

};
