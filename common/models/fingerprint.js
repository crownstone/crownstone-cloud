"use strict";

const loopback = require('loopback');
const debug = require('debug')('loopback:dobots');
const versionUtil = require('../../server/util/versionUtil');


/**
 * Minimum compatible version is used to determine if a fresh install is required.
 * If the version is 2.1.3 and the minimum compatible version is 1.3.2, coming from any
 * version lower than 1.3.2 will require a clean install
 * @param model
 */
module.exports = function(model) {

  let app = require('../../server/server');
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
    model.settings.acls.push(
      {
        "accessType": "READ",
        "principalType": "ROLE",
        "principalId": "$everyone",
        "permission": "ALLOW"
      }
    );
  }

  // model.disableRemoteMethodByName('create');
  // model.disableRemoteMethodByName('replaceOrCreate');
  // model.disableRemoteMethodByName('patchOrCreate');
  // model.disableRemoteMethodByName('exists');
  // model.disableRemoteMethodByName('findById');
  // model.disableRemoteMethodByName('find');
  // model.disableRemoteMethodByName('findOne');
  // model.disableRemoteMethodByName('destroyById');
  // model.disableRemoteMethodByName('deleteById');
  // model.disableRemoteMethodByName('count');
  // model.disableRemoteMethodByName('replaceById');
  // model.disableRemoteMethodByName('createChangeStream');
  // model.disableRemoteMethodByName('updateAll');
  // model.disableRemoteMethodByName('replaceOrCreate');
  // model.disableRemoteMethodByName('replaceById');
  // model.disableRemoteMethodByName('prototype.patchAttributes');
  // model.disableRemoteMethodByName('patchById');
  // model.disableRemoteMethodByName('upsertWithWhere');


};
