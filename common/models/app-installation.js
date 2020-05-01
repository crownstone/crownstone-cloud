"use strict";

const loopback = require('loopback');
const uuid = require('node-uuid');
const crypto = require('crypto');

const debug = require('debug')('loopback:crownstone');

const config = require('../../server/config.json');
const emailUtil = require('../../server/emails/util');
const mesh = require('../../server/middleware/mesh-access-address');

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');
    //***************************
    // OWNER:
    //   - everything
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$owner",
      "permission": "ALLOW"
    });

    //***************************
    // DEVICE OWNER:
    //   - everything
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$device:owner",
      "permission": "ALLOW"
    });

    //***************************
    // AUTHENTICATED:
    //   - create new device
    //***************************
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": "create"
    });


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
  }



  // // All endpoints
  model.disableRemoteMethodByName('create');                    // disable POST	    api/model/
  // model.disableRemoteMethodByName('patchOrCreate');             // disable PATCH	  api/model/
  // model.disableRemoteMethodByName('findById');                  // disable GET	    api/model/:id
  model.disableRemoteMethodByName('find');                      // disable GET	    api/model
  model.disableRemoteMethodByName('destroyById');               // disable DELETE	  api/model/:id
  model.disableRemoteMethodByName('deleteById');                // disable DELETE	  api/model/:id
  model.disableRemoteMethodByName('replaceById');               // disable PUT	    api/model/:id  and  api/model/:id/replace
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

  model.disableRemoteMethodByName('prototype.__get__device');

};
