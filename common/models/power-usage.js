// "use strict";

module.exports = function(model) {
  model.validatesUniquenessOf('timestamp', {scopedTo: ['stoneId'], message: 'there already is a data point for this stone and this exact time.'});


  // disable all remote methods.
  model.disableRemoteMethodByName('create');                     // disable POST	    api/model/
  model.disableRemoteMethodByName('patchOrCreate');              // disable PATCH	  api/model/
  model.disableRemoteMethodByName('findById');                   // disable GET	    api/model/:id
  model.disableRemoteMethodByName('find');                       // disable GET	    api/model
  model.disableRemoteMethodByName('destroyById');                // disable DELETE	  api/model/:id
  model.disableRemoteMethodByName('deleteById');                 // disable DELETE	  api/model/:id
  model.disableRemoteMethodByName('replaceById');                // disable PUT	    api/model/:id  and  api/model/:id/replace
  model.disableRemoteMethodByName('prototype.patchAttributes');  // disable PATCH	  api/model/:id
  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('prototype.__get__appliance');
  model.disableRemoteMethodByName('prototype.__get__stone');


};
