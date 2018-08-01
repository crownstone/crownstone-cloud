// "use strict";

module.exports = function(model) {
  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__owner');
};
