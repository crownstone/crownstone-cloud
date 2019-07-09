"use strict";

const loopback = require('loopback');
const app = require('../../../server/server');


module.exports = function(model) {

  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$everyone",
        "permission": "DENY"
      }
    );

    //***************************
    // AUTHENTICATED:
    //   - create new sphere
    //***************************
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$authenticated",
        "permission": "ALLOW",
        "property": "create"
      }
    );

    //***************************
    // OWNER:
    //   - everything
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$owner",
        "permission": "ALLOW"
      }
    );

    //***************************
    // Viewer:
    //   - TODO
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:viewer",
        "permission": "DENY"
      }
    );

    //***************************
    // Installer:
    //   - TODO
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:installer",
        "permission": "DENY"
      }
    );
  }


  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('replaceOrCreate');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('exists');
  model.disableRemoteMethodByName('findById');
  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('destroyById');
  model.disableRemoteMethodByName('deleteById');
  model.disableRemoteMethodByName('count');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('createChangeStream');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('replaceOrCreate');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('prototype.patchAttributes');
  model.disableRemoteMethodByName('patchById');
  model.disableRemoteMethodByName('upsertWithWhere');

};
