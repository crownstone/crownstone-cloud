"use strict";

const loopback = require('loopback');
const debug = require('debug')('loopback:dobots');
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

  model.validatesUniquenessOf('downloadUrl', {message: 'This bootloader download url already exists.'});

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
    hardwareVersion = hardwareVersion.substr(0,11);
    model.find({where: {version: version}})
      .then((bootloaders) => {
        if (bootloaders.length === 0) {
          return callback(null, []);
        }
        let foundBootloader = false;
        for (let i = 0; i < bootloaders.length; i++) {
          let bootloader = bootloaders[i];
          // check if the hardware version is supported by this bootloader
          if (bootloader && bootloader.supportedHardwareVersions && Array.isArray(bootloader.supportedHardwareVersions)) {
            for (let j = 0; j < bootloader.supportedHardwareVersions.length; j++) {
              if (bootloader.supportedHardwareVersions[j] === hardwareVersion) {
                foundBootloader = bootloader;
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
    'getBootloader',
    {
      http: {path: '/', verb: 'get'},
      accepts: [
        {arg: 'version', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'hardwareVersion', type: 'string', required: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: 'Bootloader', root: true},
      description: "Get bootloader details by version number and hardware version, or null if the version was not found."
    }
  );

  const getBootloader = (appVersion, options, callback, filterOptions = {}) => {
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
        // FILTER BY APP VERSION
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
        let bootloaderForHardwareVersions = {};
        hwVersions.forEach((hwVersion) => {
          bootloaderForHardwareVersions[hwVersion] = [];
          filteredVersions.forEach((bootloaderVersion) => {
            if (bootloaderVersion.supportedHardwareVersions.indexOf(hwVersion) !== -1) {
              bootloaderForHardwareVersions[hwVersion].push(bootloaderVersion);
            }
          })
        });

        if (filterOptions.latest === true) {
          hwVersions.forEach((hwVersion) => {
            let latestVersion = '0.0.0';
            bootloaderForHardwareVersions[hwVersion].forEach((entry) => {
              if (versionUtil.isHigher(entry.version, latestVersion)) {
                latestVersion = entry.version;
              }
            });
            if (latestVersion !== '0.0.0') {
              bootloaderForHardwareVersions[hwVersion] = latestVersion;
            }
            else {
              bootloaderForHardwareVersions[hwVersion] = null;
            }
          });
          return bootloaderForHardwareVersions;
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

  model.getMyLatestBootloader = function(appVersion, options, callback) {
    getBootloader(appVersion, options, callback, {latest:true});
  };

  model.getMyBootloader = function(appVersion, options, callback) {
    getBootloader(appVersion, options, callback, {latest:false});
  };


  model.remoteMethod(
    'getMyBootloader',
    {
      http: {path: '/available', verb: 'get'},
      accepts: [
        {arg: "appVersion", type: 'string', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[Bootloader]', root: true},
      description: "Get bootloader details by version number and hardware version, or null if the version was not found."
    }
  );

  model.remoteMethod(
    'getMyLatestBootloader',
    {
      http: {path: '/latest', verb: 'get'},
      accepts: [
        {arg: "appVersion", type: 'string', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', root: true},
      description: "Get bootloader versions per hardware version, or null if no version is available."
    }
  );


};
