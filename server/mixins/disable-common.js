"use strict";


/**
 * Mixin that hooks the Webhook system into existing models. It generates a list of available events based on the REST endpoints.
 * @param model
 * @param options
 */
module.exports = function (model, options) {

  // // All endpoints
  // model.disableRemoteMethodByName('create');                    // disable POST	    api/model/
  // model.disableRemoteMethodByName('patchOrCreate');             // disable PATCH	  api/model/
  // model.disableRemoteMethodByName('findById');                  // disable GET	    api/model/:id
  // model.disableRemoteMethodByName('find');                      // disable GET	    api/model
  // model.disableRemoteMethodByName('destroyById');               // disable DELETE	  api/model/:id
  // model.disableRemoteMethodByName('deleteById');                // disable DELETE	  api/model/:id
  // model.disableRemoteMethodByName('replaceById');               // disable PUT	    api/model/:id  and  api/model/:id/replace
  // model.disableRemoteMethodByName('prototype.patchAttributes'); // disable PATCH	  api/model/:id

  // this is superseded by the prototype.patchAttributes
  model.disableRemoteMethodByName('replaceOrCreate');           // disable PUT	    api/model/

  // odd endpoints which we do not use.
  model.disableRemoteMethodByName('upsert');                    // disable POST     api/model/upsertWithWhere
  model.disableRemoteMethodByName('upsertWithWhere');           // disable POST     api/model/upsertWithWhere
  model.disableRemoteMethodByName('exists');                    // disable GET	    api/model/:id/exists
  model.disableRemoteMethodByName('findOne');                   // disable GET	    api/model/findOne
  model.disableRemoteMethodByName('count');                     // disable GET	    api/model/count
  model.disableRemoteMethodByName('createChangeStream');        // disable POST	    api/model/change-stream
  model.disableRemoteMethodByName('updateAll');                 // disable POST	    api/model/update
  model.disableRemoteMethodByName('replaceOrCreate');           // disable POST	    api/model/replaceOrCreate
};

