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
    // .then(() => {
    //   return removeFirmwareVersion('3.0.4')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.0.1-RC0')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.0.1-RC1')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.0.1-RC2')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.1.0-RC0')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.1.0-RC1')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.1.2-RC0')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('2.1.4-RC0')
    // })
    // .then(() => {
    //   return removeFirmwareVersion('3.0.6')
    // })
    // .then(() => {
    //   return removeBootloaderVersion('1.8.0')
    // })
    // .then(() => {
    //   return removeBootloaderVersion('1.9.0')
    // })
    // .then(() => {
    //   return removeBootloaderVersion('2.0.0')
    // })
    .then(() => {
      return releaseFirmware(
        '3.0.6', // release version
        '3.0.2', // minimum App version,
        '2.0.0', // this firmware required this bootloader
        null,  // this firmware can be upgraded from this version and up.
        [...hardwareVersions.util.getAllPlugs(), ...hardwareVersions.util.getAllBuiltIns(), ...hardwareVersions.util.getAllDongles()], // hardware versions
        '2bb516cd914fd7661d936cc4eaf7e020ef1b634d', // sha1 hash to validate download
        'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_3.0.6/bin/crownstone_3.0.6.zip',
        PUBLIC_RELEASE_LEVEL, // release level
        {  // release notes
          'en' :
            '- Instant Switching\n' +
            '- Bluetooth Mesh\n\n'
          ,
          'nl' : '',
          'de' : '',
          'es' : '',
          'it' : '',
          'fr' : ''
        }
      );
    })
    .then(() => {
      return releaseBootloader(
        '1.8.0', // release version
        '3.0.2', // minimum App version,
        '1.2.2', // this firmware required this bootloader
        [...hardwareVersions.util.getAllPlugs(), ...hardwareVersions.util.getAllBuiltIns(), ...hardwareVersions.util.getAllDongles()], // hardware versions
        '8739bbc66509cdf5163784154c9da97c979cd95a', // sha1 hash to validate download
        'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_1.8.0/bin/bootloader_1.8.0.zip',
        PUBLIC_RELEASE_LEVEL, // release level
        {  // release notes
          'en' :
          '- Migration to new firmware.\n\n'
          ,
          'nl' : '',
          'de' : '',
          'es' : '',
          'it' : '',
          'fr' : ''
        }
      );
    })
    .then(() => {
      return releaseBootloader(
        '1.9.0', // release version
        '3.0.2', // minimum App version,
        '1.8.0', // this firmware required this bootloader
        [...hardwareVersions.util.getAllPlugs(), ...hardwareVersions.util.getAllBuiltIns(), ...hardwareVersions.util.getAllDongles()], // hardware versions
        '7e579ef29ff23f065bb780e307e04975a7624328', // sha1 hash to validate download
        'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_1.9.0/bin/bootloader_1.9.0.zip',
        PUBLIC_RELEASE_LEVEL, // release level
        {  // release notes
          'en' :
            '- Migration to new firmware.\n\n'
          ,
          'nl' : '',
          'de' : '',
          'es' : '',
          'it' : '',
          'fr' : ''
        }
      );
    })
    .then(() => {
      return releaseBootloader(
        '2.0.0', // release version
        '3.0.2', // minimum App version,
        '1.9.0', // this firmware required this bootloader
        [...hardwareVersions.util.getAllPlugs(), ...hardwareVersions.util.getAllBuiltIns(), ...hardwareVersions.util.getAllDongles()], // hardware versions
        'd4cf79a913347f23a8e1376e59323945b2311bb4', // sha1 hash to validate download
        'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_2.0.0/bin/bootloader_1.9_to_2.0.0.zip',
        PUBLIC_RELEASE_LEVEL, // release level
        {  // release notes
          'en' :
            '- Secure bootloader ready for Firmware 3.0.\n\n'
          ,
          'nl' : '',
          'de' : '',
          'es' : '',
          'it' : '',
          'fr' : ''
        }
      );
    })
    .then(() => {
      return releaseBootloader(
        '2.0.0', // release version
        '3.0.1', // minimum App version,
        null, // this firmware required this bootloader
        hardwareVersions.util.getAllBuiltInOnes(), // hardware versions
        'd496f8051551246bcabf25d575a0e2e607f03450', // sha1 hash to validate download
        'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_2.0.0/bin/bootloader_2.0.0.zip',
        PUBLIC_RELEASE_LEVEL, // release level
        {  // release notes
          'en' :
            '- Secure bootloader ready for Firmware 3.0.\n\n'
          ,
          'nl' : '',
          'de' : '',
          'es' : '',
          'it' : '',
          'fr' : ''
        }
      );
    })
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

// function getFirmwareVersion(version) {
//   let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
//   return _getVersion(firmwareModel, version);
// }
//
// function getBootloaderVersion(version) {
//   let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
//   return _getVersion(bootloaderModel, version);
// }
//
// function clearFirmwares() {
//   console.log("\n-- Deleting all firmwares from the cloud.");
//   let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
//   return _removeAll(firmwareModel, TYPES.firmware);
// }
//
// function clearBootloaders() {
//   console.log("\n-- Deleting all bootloaders from the cloud.");
//   let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
//   return _removeAll(bootloaderModel, TYPES.bootloader);
// }
//
// function showFirmwares() {
//   console.log("\n-- Getting a list of all firmwares in the cloud.");
//   let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
//   return _getAll(firmwareModel).then((results) => { console.log(TYPES.firmware, "versions found:", results);});
// }
//
// function showBootloaders() {
//   console.log("\n-- Getting a list of all bootloaders in the cloud.");
//   let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);
//   return _getAll(bootloaderModel).then((results) => { console.log(TYPES.firmware, "versions found:", results);});
// }

function releaseFirmware(firmwareVersion, minimumAppVersion, dependsOnBootloader, dependsOnFirmware, hardwareVersions, hash, downloadUrl, releaseLevel, releaseNotes = {}) {
  if (downloadUrl.indexOf("firmware") === -1) {
    throw new Error("Release firmware releaseURL does not contain the word firmware: this likely is a bug!");
  }
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);

  let payload = {
    version: firmwareVersion,
    supportedHardwareVersions: hardwareVersions,
    minimumCompatibleVersion: null, // legacy
    minimumAppVersion: minimumAppVersion,
    dependsOnBootloaderVersion: dependsOnBootloader,
    dependsOnFirmwareVersion: dependsOnFirmware,
    sha1hash: hash.replace(/( )/g, ""),
    downloadUrl: downloadUrl,
    releaseLevel: releaseLevel,
    releaseNotes: releaseNotes,
  };

  return _release(
    firmwareModel,
    TYPES.firmware,
    payload
  );
}

function releaseBootloader(bootloaderVersion, minimumAppVersion, dependsOnBootloader, hardwareVersions, hash, downloadUrl, releaseLevel, releaseNotes = {}) {
  if (downloadUrl.indexOf("bootloader") === -1) {
    throw new Error("Release bootloader releaseURL does not contain the word bootloader: this likely is a bug!");
  }
  let bootloaderModel = APP.dataSources.mongoDs.getModel(TYPES.bootloader);

  let payload = {
    version: bootloaderVersion,
    supportedHardwareVersions: hardwareVersions,
    minimumCompatibleVersion: null, // legacy
    minimumAppVersion: minimumAppVersion,
    dependsOnBootloaderVersion: dependsOnBootloader,
    sha1hash: hash.replace(/( )/g, ""),
    downloadUrl: downloadUrl,
    releaseLevel: releaseLevel,
    releaseNotes: releaseNotes,
  };

  return _release(
    bootloaderModel,
    TYPES.bootloader,
    payload,
  );
}

function removeFirmwareVersion(version) {
  let firmwareModel = APP.dataSources.mongoDs.getModel(TYPES.firmware);
  return _remove(firmwareModel, version, TYPES.firmware);
}

function removeBootloaderVersion(version) {
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

function _release(model, type, payload) {
  console.log("\n-- Releasing ", type, payload.version, "to level", payload.releaseLevel);
  let action = () => {
    return model.create(payload)
      .then((result) => {
        console.log(type, "version ", payload.version, " added successfully!");
        console.log("Result:", result);
      })
      .catch((err) => {
        console.log("Error adding", type, "version:", payload.version, ' :', err);
      });
  };
  if (CHANGE_DATA === true) {
    return ask('Are you absolutely sure you want to release ' + type + ' v: ' + payload.version + ' ( YES / NO )')
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
    console.log("Not releasing", type, payload.version, "to", payload.supportedHardwareVersions, "because CHANGE_DATA = false.");
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
