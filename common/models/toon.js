// "use strict";

module.exports = function(model) {


  model.validatesUniquenessOf('toonAgreementId', {scopedTo: ['sphereId'], message: 'a Toon with this agreementId was already added!'});

  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__owner');
};
