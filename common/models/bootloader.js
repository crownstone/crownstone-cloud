// "use strict";

const debug = require('debug')('loopback:dobots');


/**
 * Minimum compatible version is used to determine if a fresh install is required.
 * If the version is 2.1.3 and the minimum compatible version is 1.3.2, coming from any
 * version lower than 1.3.2 will require a clean install
 * @param model
 */
module.exports = function(model) {

  /************************************
   **** Model Validation
   ************************************/

  model.validatesUniquenessOf('version', {message: 'This firmware version already exists.'});
  model.validatesUniquenessOf('downloadUrl', {message: 'This firmware download url already exists.'});

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



  model.getBootloader = function(version, hardwareVersion, callback) {
    model.findOne({where: {version: version}})
      .then((result) => {
        // check if the hardware version is supported by this firmware
        if (result && result.supportedHardwareVersions && Array.isArray(result.supportedHardwareVersions)) {
          for (let i = 0; i < result.supportedHardwareVersions.length; i++) {
            if (result.supportedHardwareVersions[i] === hardwareVersion) {
              return callback(null, result);
            }
          }
          // nothing found.
          callback(null, null);
        }
        else {
          callback(null, null);
        }
      })
      .catch((err) => {
        callback(err)
      })
  };

  model.remoteMethod(
    'getBootloader',
    {
      http: {path: '/getBootloader', verb: 'get'},
      accepts: [
        {arg: 'version', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'hardwareVersion', type: 'string', required: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: 'Bootloader', root: true},
      description: "Get bootloader details by version number and hardware version, or null if the version was not found."
    }
  );
};