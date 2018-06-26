"use strict";

let hardwareVersions = require("../constants/hardwareVersions");
const versionUtil = require('../../server/util/versionUtil');

const { ask, promiseBatchPerformer } = require("./insertUtil");

let plugAndBuiltinVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns());
let plugAndBuiltinAndDongleVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns()).concat(hardwareVersions.util.getAllDongles());

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
    // .then(() => { return removeFirmwareVersion('2.1.2'); })
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
    //     '1.10.0', // minimum App version,
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
    // .then(() => {
    //   return releaseFirmware(
    //     '1.7.1', // release version
    //     '1.3.1', // minimum compatible version,
    //     '1.0.0', // minimum App version,
    //     plugAndBuiltinVariations, // hardware versions
    //     '8b1e4b7e4510ba5d9536dc11721d8015ff6682ce', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_1.7.1/bin/crownstone_1.7.1.zip',
    //     PUBLIC_RELEASE_LEVEL, // release level
    //     {  // release notes
    //       'en' :
    //       '- More hardware safeguards added.\n\n' +
    //       '- Dimming done by trailing edge dimming (currently compatible with EU Standard 50Hz grid).\n\n' +
    //       '- Dimming will work with app 1.12, which will be released in January.\n\n'
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
    //     '2.0.0', // release version
    //     '1.3.1', // minimum compatible version,
    //     '2.0.0', // minimum App version,
    //     plugAndBuiltinVariations, // hardware versions
    //     '0fa807f564e1fd961e897bcb5953075092bf058f', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_2.0.0/bin/crownstone_2.0.0.zip',
    //     BETA_RELEASE_LEVEL, // release level
    //     {  // release notes
    //       'en' :
    //       '- Introducing "The Mesh".\n\n' +
    //       '- Introducing Dimming functionality.\n\n' +
    //       '- More hardware safeguards added.\n\n' +
    //       '- Dimming done by trailing edge dimming (currently compatible with EU Standard 50Hz grid).\n\n'
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
    //     '2.0.1', // release version
    //     '1.3.1', // minimum compatible version,
    //     '2.0.0', // minimum App version,
    //     plugAndBuiltinVariations, // hardware versions
    //     '77f4bd9638b756b6d3b0b64cc17a9b7f4ac2e7d8', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_2.0.1/bin/crownstone_2.0.1.zip',
    //     PUBLIC_RELEASE_LEVEL, // release level
    //     {  // release notes
    //       'en' :
    //       '- Introducing Dimming functionality.\n\n' +
    //       '- More hardware safeguards added.\n\n' +
    //       '- Dimming done by trailing edge dimming (currently compatible with EU Standard 50Hz grid).\n\n'
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
    //     '2.1.2', // release version
    //     '1.3.1', // minimum compatible version,
    //     '2.1.0', // minimum App version,
    //     plugAndBuiltinAndDongleVariations, // hardware versions
    //     'fa5403234a7f1ffbb8dbcc9088ca5b36eb0c7b76', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_2.1.2/bin/crownstone_2.1.2.zip',
    //     PUBLIC_RELEASE_LEVEL, // release level
    //     {  // release notes
    //       'en' :
    //       '- Introducing the mesh.\n\n' +
    //       '- Fast setup.\n\n' +
    //       '- Improved quality of power measurement.\n\n'
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
    //     '2.1.3', // release version
    //     '1.3.1', // minimum compatible version,
    //     '2.1.0', // minimum App version,
    //     hardwareVersions.util.getAllGuideStones(), // hardware versions
    //     '112ad5f0ad8c1c7d30ec74a723e271f3fb3affdc', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/guidestone_2.1.3/bin/guidestone_2.1.3.zip',
    //     PUBLIC_RELEASE_LEVEL, // release level
    //     {  // release notes
    //       'en' :
    //       '- Introducing the mesh.\n\n' +
    //       '- Fast setup.\n\n' +
    //       '- Improved quality of power measurement.\n\n'
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
    // .then(() => { return updateReleaseRollout_legacy() })
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



function updateReleaseRollout_legacy() {
  console.log("\n-- Updating release rollout.");
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
  let userModel = APP.dataSources.mongoDs.getModel(TYPES.user);

  // get firmware versions
  let firmwares = [];
  let bootloaders = [];
  let users = [];

  let allHardware = hardwareVersions.util.getAllVersions();
  let counter = 0;

  return new Promise((resolve, reject) => {
    if (CHANGE_DATA) {
      return ask("Update Release Rollout: Change Data is enabled. Continue? (YES/NO)")
        .then((answer) => {
          if (answer === 'YES') {
            resolve();
          }
          else {
            reject("User permission denied for changing data during Update Release Rollout. Rerun script and type YES.");
          }
        })
    }
    else {
      resolve();
    }
  })
    .then(() => { return _getAll(firmwareModel) })
    .then((result) => { firmwares = result; return _getAll(bootloaderModel)})
    .then((result) => { bootloaders = result; return _getAll(userModel)})
    .then((result) => { users = result; })
    .then(() => {
      let firmwareAccessLevels = {};
      let bootloaderAccessLevels = {};

      let fillList = (source, list) => {
        source.forEach((item) => {
          allHardware.forEach((hardwareVersion) => {
            if (item.supportedHardwareVersions.indexOf(hardwareVersion) !== -1) {
              if (list[hardwareVersion] === undefined) {
                list[hardwareVersion] = {};
              }
              if (list[hardwareVersion][item.releaseLevel] === undefined) {
                list[hardwareVersion][item.releaseLevel] = item.version;
              }

              if (versionUtil.isHigher(item.version, list[hardwareVersion][item.releaseLevel])) {
                list[hardwareVersion][item.releaseLevel] = item.version;
              }
            }
          })
        })
      };

      fillList(firmwares, firmwareAccessLevels);
      fillList(bootloaders, bootloaderAccessLevels);


      return promiseBatchPerformer(users, 0, (user) => {
        let userLevel = user.earlyAccessLevel || 0;
        let firmwareData = {};
        let bootloaderData = {};
        let fillUserList = (source, list) => {
          allHardware.forEach((hardwareVersion) => {
            if (source[hardwareVersion] && source[hardwareVersion][userLevel]) {
              list[hardwareVersion] = source[hardwareVersion][userLevel]
            }
            else if (source[hardwareVersion]) {
              let allAccessLevels = Object.keys(source[hardwareVersion]);
              let allAccessLevelsNumeric = [];
              allAccessLevels.forEach((level) => { allAccessLevelsNumeric.push(Number(level) )});
              allAccessLevelsNumeric.sort();

              for (let i = 0; i < allAccessLevelsNumeric.length; i++) {
                if (allAccessLevelsNumeric[i] <= userLevel) {
                  list[hardwareVersion] = source[hardwareVersion][allAccessLevelsNumeric[i]]
                }
              }
            }
          });
        };

        fillUserList(firmwareAccessLevels, firmwareData);
        fillUserList(bootloaderAccessLevels, bootloaderData);

        counter++;
        if (counter % 5 === 0) {
          console.log("Release rollout: ", counter, "/", users.length, " users.");
        }
        if (CHANGE_DATA === true) {
          let changed = false;
          if (JSON.stringify(user[TYPES.firmwareField]) !== JSON.stringify(firmwareData)) {
            user[TYPES.firmwareField] = firmwareData;
            changed = true;
          }
          if (JSON.stringify(user[TYPES.bootloaderField]) !== JSON.stringify(bootloaderData)) {
            user[TYPES.bootloaderField] = bootloaderData;
            changed = true;
          }

          if (changed) {
            return user.save().catch((err) => { console.log("ERROR:", err, user); })
          }
          else {
            return new Promise((resolve, reject) => { resolve(); })
          }
        }
        else {
          if (JSON.stringify(user[TYPES.firmwareField]) !== JSON.stringify(firmwareData) && JSON.stringify(user[TYPES.bootloaderField]) !== JSON.stringify(bootloaderData)) {
            console.log("Would have released firmware: ", firmwareData, " and bootloader:", bootloaderData, "to", user.firstName, user.lastName, " (", user.email, ") level:", userLevel);
          }
          else if (JSON.stringify(user[TYPES.bootloaderField]) !== JSON.stringify(bootloaderData)) {
            console.log("Would have released bootloader:", bootloaderData, "to", user.firstName, user.lastName, " (", user.email, ") level:", userLevel);
          }
          else if (JSON.stringify(user[TYPES.firmwareField]) !== JSON.stringify(firmwareData)) {
            console.log("Would have released firmware: ", firmwareData, "to", user.firstName, user.lastName, " (", user.email, ") level:", userLevel);
          }
          else {
            if (user.email === 'bart@dobots.nl') {
              console.log(JSON.stringify(user[TYPES.firmwareField]) , JSON.stringify(firmwareData))
            }
            console.log("Skipping ", user.firstName, user.lastName, " (", user.email, ")", userLevel);
          }
          return new Promise((resolve, reject) => { resolve(); })
        }
      })

    })
  // get bootloader versions

  // get users
  // match users with access level and release level
  // save
}


module.exports = performFirmwareOperations;
