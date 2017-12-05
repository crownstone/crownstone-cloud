"use strict";

let hardwareVersions = require("../constants/hardwareVersions");
const versionUtil = require('../../server/util/versionUtil');

const { ask, promiseBatchPerformer } = require("./insertUtil");

let plugAndBuiltinVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns());

let APP;
let CHANGE_DATA = false;

let BETA_RELEASE_LEVEL = 100;
let PUBLIC_RELEASE_LEVEL = 0;

let TYPES = {
  firmware: "Firmware",
  bootloader: "Bootloader",
  firmwareField: "firmwareVersionsAvailable",
  bootloaderField: "bootloaderVersionsAvailable",
  user: 'user'
};

/**
 *
 * release a firmware:
 *
 return releaseFirmware(
   '1.5.1',                                     // release version
   '1.3.1',                                     // minimum compatible version,
   plugAndBuiltinVariations,                    // hardware versions
   '9b3ad906e65553ef7c77d96f0c0105d0e4c7b9d6',  // sha1 hash to validate download
   'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_1.5.1/bin/crownstone_1.5.1.zip',
   1,                                           // release level: 0 for release to all new users
   {                                            // release notes
     'en' :
     '- Added Scheduler functionality.\n' +
     '- Added software based safety fuses.\n' +
     '- Added time syncing between Crownstones.'
     ,
     'nl' : '',
     'de' : '',
     'es' : '',
     'it' : '',
     'fr' : ''
   }
 );
 *
 * @param app
 */
function performFirmwareOperations(app) {
  APP = app;
  console.log("\n\nPerforming firmware Operations\n\n");
  if (!CHANGE_DATA) {
    console.log("Test run only. \n\n");
  }


  // start with empty promise so we can put all commands in a chain (easier for commenting/uncommenting lines)
  new Promise((resolve, reject) => resolve())
    .then(() => {
      if (CHANGE_DATA) {
        return ask("Firmware Operations: Change Data is enabled. Continue? (y/n)")
          .then((answer) => {
            if (answer === 'y') {
              //pass
            }
            else {
              return new Promise((resolve, reject) => { reject("User permission denied for changing data during firmware operations") });
            }
          })
      }
    })
    // .then(() => { return changeFirmwareReleaseLevel('1.5.1',3); })
    // .then(() => { return getFirmwareVersion('1.5.1') })
    // .then(() => { return clearFirmwares(); })
    // .then(() => { return removeFirmwareVersion('1.7.0'); })
    // .then(() => { return clearBootloaders(); })
    // .then(() => { return clearFirmwareAtUsers() })
    // .then(() => { return clearBootloaderAtUsers() })
    // .then(() => {
    //   return releaseBootloader(
    //     '1.2.2', // release version
    //     '1.2.2', // minimum compatible version
    //     '1.12.0', // minimum App version,
    //     plugAndBuiltinVariations, // hardware versions
    //     '45306bf3ed920dc9768a57c3df3fd16954ea5b97', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_1.2.2/bin/bootloader_1.2.2.zip',
    //     PUBLIC_RELEASE_LEVEL, // release level: 0 for release to all new users
    //     {  // release notes
    //       'en' : 'stability',
    //       'nl' : '',
    //       'de' : '',
    //       'es' : '',
    //       'it' : '',
    //       'fr' : ''
    //     }
    //   );
    // })
    // .then(() => {
    //   return releaseFirmware(
    //     '1.5.1', // release version
    //     '1.3.1', // minimum compatible version,
    //     '1.0.0',
    //     plugAndBuiltinVariations, // hardware versions
    //     '9b3ad906e65553ef7c77d96f0c0105d0e4c7b9d6', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_1.5.1/bin/crownstone_1.5.1.zip',
    //     PUBLIC_RELEASE_LEVEL, // release level: 0 for release to all new users
    //     {  // release notes
    //       'en' :
    //       '- Added Scheduler functionality.\n' +
    //       '- Added software based safety fuses.\n' +
    //       '- Added time syncing between Crownstones.'
    //       ,
    //       'nl' : '',
    //       'de' : '',
    //       'es' : '',
    //       'it' : '',
    //       'fr' : ''
    //     }
    //   );
    // })
    // .then(() => {
    //   return releaseFirmware(
    //     '1.7.0', // release version
    //     '1.3.1', // minimum compatible version,
    //     '1.12.0', // minimum App version,
    //     plugAndBuiltinVariations, // hardware versions
    //     '6942f0c646696fa884f6aa39e8d982282759ad80', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_1.7.0/bin/crownstone_1.7.0.zip',
    //     BETA_RELEASE_LEVEL, // release level
    //     {  // release notes
    //       'en' :
    //       '- Dimming done by trailing edge dimming (currently compatible with EU Standard 50Hz grid).\n\n' +
    //       '- Dimmer state is stored in persistent storage, and restored on power on (currently with a delay of about 2s).\n\n' +
    //       '- Overcurrent detection is improved to avoid getting triggered by interference.'
    //       ,
    //       'nl' : '',
    //       'de' : '',
    //       'es' : '',
    //       'it' : '',
    //       'fr' : ''
    //     }
    //   );
    // })
    // .then(() => { return releaseFirmwareToUsers('1.5.1', plugAndBuiltinVariations, {where: {email: {like: /alex/}}}); })
    // .then(() => { return releaseBootloaderToUsers('1.2.2', plugAndBuiltinVariations); })
    // .then(() => {return clearFirmwares(firmwareModel) })
    // .then(() => {return clearBootloaders(bootloaderModel) })
    // .then(() => {
    //   return releaseBootloader(
    //     bootloaderModel,
    //     '1.2.2', // release version
    //     '1.2.2', // minimum compatible version
    //     plugAndBuiltinVariations, // hardware versions
    //     '45306bf3ed920dc9768a57c3df3fd16954ea5b97', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/bootloader_1.2.2/bin/bootloader_1.2.2.zip'
    //   );
    // })
    .then(() => { console.log("performFirmwareOperations: DONE") })
    .catch((err) => {
      console.log("performFirmwareOperations: Error", err);
    })
}

function changeFirmwareReleaseLevel(version, level) {
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return new Promise((resolve, reject) => {
    if (CHANGE_DATA) {
      return ask("Change Firmware Release Level: Change Data is enabled. Continue? (YES/NO)")
        .then((answer) => {
          if (answer === 'YES') {
            resolve();
          }
          else {
            reject("User permission denied for changing data during Update Release Level. Rerun script and type YES.");
          }
        })
    }
    else {
      resolve()
    }})
    .then(() => {
      return _getVersion(firmwareModel, version);
    })
    .then((firmware) => {
      if (firmware.length > 0) {
        firmware[0].releaseLevel = level;
        return firmware[0].save();
      }
      else {
        throw "Can not find this version."
      }
    })
}

function changeBootloaderReleaseLevel(version, level) {
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  return new Promise((resolve, reject) => {
    if (CHANGE_DATA) {
      return ask("Change Bootloader Release Level: Change Data is enabled. Continue? (YES/NO)")
        .then((answer) => {
          if (answer === 'YES') {
            resolve();
          }
          else {
            reject("User permission denied for changing data during Update Release Level. Rerun script and type YES.");
          }
        })
    }
    else {
      resolve()
    }})
    .then(() => {
      return _getVersion(bootloaderModel, version);
    })
    .then((bootloader) => {
      if (bootloader.length > 0) {
        bootloader[0].releaseLevel = level;
        return bootloader[0].save();
      }
      else {
        throw "Can not find this version bootloader."
      }
    })
}

function getFirmwareVersion(version) {
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return _getVersion(firmwareModel, version);
}

function getBootloaderVersion(version) {
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  return _getVersion(bootloaderModel, version);
}

function releaseFirmwareToUsers(version, hwTypes, filter) {
  console.log("\n-- Releasing firmware to users.");
  return _releaseToUsers(TYPES.firmware, version, hwTypes, filter);
}

function releaseBootloaderToUsers(version, hwTypes, filter) {
  console.log("\n-- Releasing bootloader to users.");
  return _releaseToUsers(TYPES.bootloader, version, hwTypes, filter);
}

function clearFirmwareAtUsers() {
  console.log("\n-- Clearing all firmwares from users.");
  return _clearReleaseFromUsers(TYPES.firmwareField);
}

function clearBootloaderAtUsers() {
  console.log("\n-- Clearing all bootloaders from users.");
  return _clearReleaseFromUsers(TYPES.bootloaderField);
}

function clearFirmwares() {
  console.log("\n-- Deleting all firmwares from the cloud.");
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return _removeAll(firmwareModel, TYPES.firmware);
}

function clearBootloaders() {
  console.log("\n-- Deleting all bootloaders from the cloud.");
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  return _removeAll(bootloaderModel, TYPES.bootloader);
}

function showFirmwares() {
  console.log("\n-- Getting a list of all firmwares in the cloud.");
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return _getAll(firmwareModel).then((results) => { console.log(TYPES.firmware, "versions found:", results);});
}

function showBootloaders() {
  console.log("\n-- Getting a list of all bootloaders in the cloud.");
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  return _getAll(bootloaderModel).then((results) => { console.log(TYPES.firmware, "versions found:", results);});
}

function releaseFirmware(firmwareVersion, minimumCompatibleVersion, minimumAppVersion, hardwareVersions, hash, downloadUrl, releaseLevel, releaseNotes = {}) {
  if (downloadUrl.indexOf("firmware") === -1) {
    throw new Error("Release firmware releaseURL does not contain the word firmware: this likely is a bug!");
  }
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return _release(
    firmwareModel,
    TYPES.firmware,
    firmwareVersion,
    minimumCompatibleVersion,
    minimumAppVersion,
    hardwareVersions,
    hash,
    downloadUrl,
    releaseLevel,
    releaseNotes
  );
}

function releaseBootloader(bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel, releaseNotes = {}) {
  if (downloadUrl.indexOf("bootloader") === -1) {
    throw new Error("Release bootloader releaseURL does not contain the word bootloader: this likely is a bug!");
  }
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  return _release(
    bootloaderModel,
    TYPES.bootloader,
    bootloaderVersion,
    minimumCompatibleVersion,
    minimumAppVersion,
    hardwareVersions,
    hash,
    downloadUrl,
    releaseLevel,
    releaseNotes
  );
}

function removeFirmwareVersion(version) {
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return _remove(firmwareModel, version, TYPES.firmware);
}

function removeBootloaderModel(version) {
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  return _remove(bootloaderModel, version, TYPES.bootloader);
}

// UTIL:




function _getAll(model) {
  return model.find()
    .then((results) => {
      return results;
    })
}

function _getVersion(model, version) {
  return model.find({where: {version: version}})
    .then((results) => {
      return results;
    })
}

function _release(model, type, releaseVersion, minimumCompatibleVersion, minimumAppVersion, hardwareVersions, hash, downloadUrl, releaseLevel, releaseNotes) {
  console.log("\n-- Releasing ", type, releaseVersion, "to level", releaseLevel);
  let action = () => {
    return model.create({
      version: releaseVersion,
      supportedHardwareVersions: hardwareVersions,
      minimumCompatibleVersion: minimumCompatibleVersion,
      minimumAppVersion: minimumAppVersion,
      sha1hash: hash.replace(/( )/g, ""),
      downloadUrl: downloadUrl,
      releaseLevel: releaseLevel,
      releaseNotes: releaseNotes,
    })
      .then((result) => {
        console.log(type, "version ", releaseVersion, " added successfully!");
        console.log("Result:", result);
      })
      .catch((err) => {
        console.log("Error adding", type, "version:", releaseVersion, ' :', err);
      });
  };
  if (CHANGE_DATA === true) {
    return ask('Are you absolutely sure you want to release ' + type + ' v: ' + releaseVersion + ' ( YES / NO )')
      .then((answer) => {
        if (answer === "YES") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and type YES."); });
        }
      })
  }
  else {
    console.log("Not releasing", type, releaseVersion, "to", hardwareVersions, "because CHANGE_DATA = false.");
  }
}

function _remove(model, version, type) {
  console.log("\n-- REMOVING ", type, version);
  let action = (allowDelete = false) => {
    return model.find({where:{version:version}})
      .then((results) => {
        let deletionPromises = [];
        if (allowDelete === true) {
          results.forEach((result) => {
            deletionPromises.push(model.destroyById(result.id))
          });
          return Promise.all(deletionPromises)
            .then(() => {
              console.log("Successfully deleted " + type + ": ",version, ' :');
            })
        }
        else {
          console.log("Did not delete " + type + " due to CHANGE_DATA = false. Would have deleted: ", results);
        }
      })

      .catch((err) => { console.log("Error DELETING "+type+" version: ",version, ' :', err); })
  };
  if (CHANGE_DATA === true) {
    return ask('DELETE SINGLE: Are you absolutely sure you want to REMOVE ' + type + ' v: ' + version + ' ( YES / NO )')
      .then((answer) => {
        if (answer === "YES") {
          return action(true);
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and type YES."); });
        }
      })
  }
  else {
    return action(false);
  }
}

function _removeAll(model, type) {
  let action = () => {
    return model.destroyAll()
      .then(() => {
        console.log("REMOVED ALL", type);
      })
  };
  if (CHANGE_DATA === true) {
    return ask('DELETE ALL '+ type + ': Are you absolutely sure you want to REMOVE EVERYTHING of type ' + type + '?? ( YES / NO )')
      .then((answer) => {
        if (answer === "YES") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and type YES."); });
        }
      })
  }
  else {
    console.log("NOT REMOVING DUE TO CHANGE_DATA = false");
    return new Promise((resolve, reject) => { resolve(); });
  }
}


module.exports = performFirmwareOperations;
