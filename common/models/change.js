// "use strict";

let loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    });

    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": "*"
    });
  }

  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('destroyById');
  model.disableRemoteMethodByName('deleteById');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('findById');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('prototype.patchAttributes');

  model.disableRemoteMethodByName('replaceOrCreate');           // disable PUT	    api/model/
  model.disableRemoteMethodByName('prototype.__get__owner');    // disable get owner

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