"use strict";

const loopback = require('loopback');
const debug = require('debug')('loopback:crownstone');
const versionUtil = require('../../server/util/versionUtil');


let hardwareVersions = require("../../server/constants/hardwareVersions");

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

  model.validatesUniquenessOf('downloadUrl', {message: 'This firmware download url already exists.'});


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


  model.getFirmware = function(version, hardwareVersion, callback) {
    hardwareVersion = hardwareVersion.substr(0,11);
    model.find({where: {version: version}})
      .then((firmwares) => {
        if (firmwares.length === 0) {
          return callback(null, []);
        }
        let foundBootloader = false;
        for (let i = 0; i < firmwares.length; i++) {
          let firmware = firmwares[i];
          // check if the hardware version is supported by this bootloader
          if (firmware && firmware.supportedHardwareVersions && Array.isArray(firmware.supportedHardwareVersions)) {
            for (let j = 0; j < firmware.supportedHardwareVersions.length; j++) {
              if (firmware.supportedHardwareVersions[j] === hardwareVersion) {
                foundBootloader = firmware;
                break;
              }
            }
          }
        }

        if (foundBootloader !== null) {
          callback(null, foundBootloader);
        }
        else {
          callback(null, []);
        }
      })
			.catch((err) => {
        callback(err)
      })
  };


  model.getLatestVersions = function() {
    return new Promise((resolve, reject) => {
      model.find()
        .then((results) => {
          resolve(versionUtil.getHighestForAllHardwareVersionsForAllUsers(results));
        })
        .catch((err) => { reject(err); })
    })
  };


  model.remoteMethod(
    'getFirmware',
    {
      http: {path: '/', verb: 'get'},
      accepts: [
        {arg: 'version', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'hardwareVersion', type: 'string', required: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: 'Firmware', root: true},
      description: "Get firmware details by version number and hardware version, or null if the version was not found."
    }
  );

  const getFirmware = (appVersion, options, callback, filterOptions = {}) => {
    let hwVersions = hardwareVersions.util.getAllVersions();
    let accessLevel = 0;
    new Promise((resolve, reject) => {
      if (options && options.accessToken && options.accessToken.userId) {
        let userId = options.accessToken.userId;
        const User = loopback.findModel('user');
        User.findById(userId)
          .then((user) => {
            if (user) {
              accessLevel = user.earlyAccessLevel;
              resolve();
            }
          })
          .catch((err) => { reject(err); })
      }
      else {
        resolve()
      }
    })
      .then(() => {
        return model.find({where: {releaseLevel: {lte: accessLevel }}})
      })
      .then((results) => {
        let filteredByAppVersion = [];
        if (appVersion) {
          results.forEach((result) => {
            if (versionUtil.isHigherOrEqual(appVersion, result.minimumAppVersion) || !result.minimumAppVersion) {
              filteredByAppVersion.push(result);
            }
          });
          return filteredByAppVersion;
        }
        else {
          return results;
        }
      })
      .then((filteredVersions) => {
        let firmwareForHardwareVersions = {};
        hwVersions.forEach((hwVersion) => {
          firmwareForHardwareVersions[hwVersion] = [];
          filteredVersions.forEach((firmwareVersion) => {
            if (firmwareVersion.supportedHardwareVersions.indexOf(hwVersion) !== -1) {
              firmwareForHardwareVersions[hwVersion].push(firmwareVersion);
            }
          })
        });

        if (filterOptions.latest === true) {
          hwVersions.forEach((hwVersion) => {
            let latestVersion = '0.0.0';
            firmwareForHardwareVersions[hwVersion].forEach((entry) => {
              if (versionUtil.isHigher(entry.version, latestVersion)) {
                latestVersion = entry.version;
              }
            });
            if (latestVersion !== '0.0.0') {
              firmwareForHardwareVersions[hwVersion] = latestVersion;
            }
            else {
              firmwareForHardwareVersions[hwVersion] = null;
            }
          });
          return firmwareForHardwareVersions;
        }
        return filteredVersions;
      })
      .then((finalFilter) => {
        callback(null, finalFilter);
      })
      .catch((err) => {
        callback(err);
      })
  };

  model.getMyLatestFirmware = function(appVersion, options, callback) {
    getFirmware(appVersion, options, callback, {latest:true});
  };

  model.getMyFirmwares = function(appVersion, options, callback) {
    getFirmware(appVersion, options, callback, {latest:false});
  };



  model.remoteMethod(
    'getMyFirmwares',
    {
      http: {path: '/available', verb: 'get'},
      accepts: [
        {arg: "appVersion", type: 'string', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[Firmware]', root: true},
      description: "Get firmware details by version number and hardware version, or null if the version was not found."
    }
  );

  model.remoteMethod(
    'getMyLatestFirmware',
    {
      http: {path: '/latest', verb: 'get'},
      accepts: [
        {arg: "appVersion", type: 'string', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', root: true},
      description: "Get firmware versions per hardware version, or null if no version is available."
    }
  );
};
