"use strict";

let hardwareVersions = require("../constants/hardwareVersions");

let plugAndBuiltinVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns());
let APP;
let CHANGE_DATA = true;

const rl = require('readline');

function ask(question) {
  return new Promise((resolve, reject) => {
    let r = rl.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    r.question(question + '\n', function(answer) {
      r.close();
      resolve(answer);
    });
  })

}


function performFirmwareOperations(app) {
  APP = app;

  // start with empty promise so we can put all commands in a chain (easier for commenting/uncommenting lines)
  new Promise((resolve, reject) => resolve())
    // .then(() => { return releaseFirmwareToUsers(userModel, "1.5.0", plugAndBuiltinVariations); })
    .then(() => { return clearFirmwares() })
    // .then(() => { return clearBootloaders() })
    // .then(() => { return clearFirmwareAtUsers() })
    // .then(() => { return clearBootloaderAtUsers() })
    // .then(() => {
    //   return releaseFirmware(
    //     '1.5.1', // release version
    //     '1.3.1', // minimum compatible version,
    //     plugAndBuiltinVariations, // hardware versions
    //     '9b3ad906e65553ef7c77d96f0c0105d0e4c7b9d6', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_1.5.1/bin/crownstone_1.5.1.zip',
    //     0 // release level: 0 for release to all new users
    //   );
    // })
    // .then(() => {
    //   return releaseBootloader(
    //     '1.2.2', // release version
    //     '1.2.2', // minimum compatible version
    //     plugAndBuiltinVariations, // hardware versions
    //     '45306bf3ed920dc9768a57c3df3fd16954ea5b97', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_1.2.2/bin/bootloader_1.2.2.zip',
    //     0 // release level: 0 for release to all new users
    //   );
    // })
    // .then(() => { return releaseFirmwareToUsers('1.5.1', plugAndBuiltinVariations, {where: {email: {like: /alex/}}}); })
    // .then(() => { return releaseBootloaderToUsers('1.2.2', plugAndBuiltinVariations); })
    .catch((err) => {
      console.log("performFirmwareOperations: Error", err);
    })
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
}

function releaseFirmwareToUsers(version, hwTypes, filter) {
  return _releaseToUsers('firmwareVersionsAvailable', version, hwTypes, filter);
}

function releaseBootloaderToUsers(version, hwTypes, filter) {
  return _releaseToUsers('bootloaderVersionsAvailable', version, hwTypes, filter);
}

function clearFirmwareAtUsers() {
  return _clearReleaseFromUsers('firmwareVersionsAvailable');
}

function clearBootloaderAtUsers() {
  return _clearReleaseFromUsers('bootloaderVersionsAvailable');
}

function clearFirmwares() {
  let firmwareModel = APP.dataSources.mongoDs.getModel('Firmware');
  return _removeAll(firmwareModel, 'FIRMWARES');
}

function clearBootloaders() {
  let bootloaderModel = APP.dataSources.mongoDs.getModel('Bootloader');
  return _removeAll(bootloaderModel, 'BOOTLOADERS');
}

function showFirmwares() {
  let firmwareModel = APP.dataSources.mongoDs.getModel('Firmware');
  return _show(firmwareModel, 'Firmware');
}

function showBootloaders() {
  let bootloaderModel = APP.dataSources.mongoDs.getModel('Bootloader');
  return _show(bootloaderModel, 'Bootloader');
}

function releaseFirmware(firmwareVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel) {
  let firmwareModel = APP.dataSources.mongoDs.getModel('Firmware');
  return _release(firmwareModel, 'Firmware', firmwareVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel);
}

function releaseBootloader(bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel) {
  let bootloaderModel = APP.dataSources.mongoDs.getModel('Bootloader');
  return _release(bootloaderModel, 'Bootloader', bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel);
}

function removeFirmwareVersion(version) {
  let firmwareModel = APP.dataSources.mongoDs.getModel('Firmware');
  return _remove(firmwareModel, version, 'firmware');
}

function removeBootloaderModel(version) {
  let bootloaderModel = APP.dataSources.mongoDs.getModel('Bootloader');
  return _remove(bootloaderModel, version, 'bootloader');
}

// UTIL:

function _clearReleaseFromUsers(releaseField, filter) {
  let action = () => {
    let userModel = APP.dataSources.mongoDs.getModel('user');
    let amountOfUsers = 0;
    let counter = 0;

    return userModel.find(filter)
      .then((results) => {
        amountOfUsers = results.length;
        if (amountOfUsers > 0) {
          return promiseBatchPerformer(results, 0, (user) => {
            counter++;
            if (counter % 5 === 0) {
              console.log("Clearing ", releaseField, " from ", counter, "/", amountOfUsers, " users.");
            }
            if (CHANGE_DATA === true) {
              user[releaseField] = {};
              return user.save()
            }
            else {
              console.log("WOULD CLEAR:", user, "'s ", releaseField);
              return new Promise((resolve, reject) => { resolve() })
            }
          })
        }
      })
      .then(() => {
        if (CHANGE_DATA === true) {
          console.log("DONE! -- Removed release ",releaseField," version from ", amountOfUsers, " users.");
        }
        else {
          console.log("DONE! Matched ", amountOfUsers, " users for ", releaseField);
        }
      })
      .catch((err) => { console.log("Could not remove firmware", err); })
  };

  if (CHANGE_DATA === true) {
    return ask('CLEAR USER RELEASE: Are you absolutely sure you want to clear releases in ' + releaseField + filter ? ' from users with filter ' + JSON.stringify(filter) : '. (Y/N)')
      .then((answer) => {
        if (answer === "Y") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and press Y."); });
        }
      })
  }
  else {
    return action();
  }
}

function _releaseToUsers(releaseField, version, hwTypes, filter) {
  let action = () => {
    let userModel = APP.dataSources.mongoDs.getModel('user');
    let content = {};
    hwTypes.forEach((hwType) => {
      content[hwType] = version;
    });

    let amountOfUsers = 0;
    let counter = 0;

    return userModel.find(filter)
      .then((results) => {
        amountOfUsers = results.length;
        if (amountOfUsers > 0) {
          return promiseBatchPerformer(results, 0, (user) => {
            counter++;
            if (counter % 5 === 0) {
              console.log("Releasing version", version, " in ", releaseField, " from ", counter, "/", amountOfUsers, " users.");
            }
            if (CHANGE_DATA === true) {
              user[releaseField] = content;
              return user.save();
            }
            else {
              console.log("WOULD CHANGE:", user, "'s ", releaseField);
              return new Promise((resolve, reject) => {
                resolve()
              })
            }
          })
        }
      })
      .then(() => {
        if (CHANGE_DATA === true) {
          console.log("DONE! ---- Released ", releaseField, " version ", version, " to ", amountOfUsers, " users.");
        }
        else {
          console.log("DONE! Matched ", amountOfUsers, " users for release in ", releaseField);
        }
      })
      .catch((err) => {
        console.log("Could not release version: " + version, err);
      })
  };

  if (CHANGE_DATA === true) {
    return ask('USER RELEASE Are you absolutely sure you want to release ' + version + ' in ' + releaseField + filter ? ' to users with filter ' + JSON.stringify(filter) : '. (Y/N)')
      .then((answer) => {
        if (answer === "Y") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and press Y."); });
        }
      })
  }
  else {
    return action();
  }
}


function _show(model, type) {
  return model.find()
    .then((results) => {
      console.log(type, "versions found:", results);
    })
}

function _release(model, type, releaseVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel) {
  let action = () => {
    return model.create({
      version: releaseVersion,
      supportedHardwareVersions: hardwareVersions,
      minimumCompatibleVersion: minimumCompatibleVersion,
      sha1hash: hash.replace(/( )/g, ""),
      downloadUrl: downloadUrl,
      releaseLevel: releaseLevel,
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
    return ask('Are you absolutely sure you want to release ' + type + ' v: ' + releaseVersion + ' (Y/N)')
      .then((answer) => {
        if (answer === "Y") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and press Y."); });
        }
      })
  }
  else {
    return new Promise((resolve, reject) => {
      reject("PERMISSION DENIED BY USER");
    });
  }
}

function _remove(model, version, type) {
  let action = () => {
    return model.find({version:version})
      .then((results) => {
        let deletionPromises = [];
        results.forEach((result) => {
          deletionPromises.push(model.destroyById(result.id))
        });
        return Promise.all(deletionPromises);
      })
      .then(() => {
        console.log("Successfully deleted " + type + ": ",version, ' :');
      })
      .catch((err) => { console.log("Error DELETING "+type+" version: ",version, ' :', err); })
  };
  if (CHANGE_DATA === true) {
    return ask('DELETE SINGLE: Are you absolutely sure you want to REMOVE ' + type + ' v: ' + version + ' (Y/N)')
      .then((answer) => {
        if (answer === "Y") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("PERMISSION DENIED BY USER. Rerun script and press Y."); });
        }
      })
  }
  else {
    return new Promise((resolve, reject) => {
      reject("PERMISSION DENIED BY USER");
    });
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
    return ask('DELETE ALL '+ type + ': Are you absolutely sure you want to REMOVE EVERYTHING of type ' + type + '?? (Y/N)')
      .then((answer) => {
        if (answer === "Y") {
          return action();
        }
        else {
          return new Promise((resolve, reject) => { reject("USER PERMISSION DENIED, TYPE Y TO CONTINUE."); });
        }
      })
  }
  else {
    return new Promise((resolve, reject) => {
      reject("PERMISSION DENIED BY USER");
    });
  }
}

let promiseBatchPerformer = (arr, index, method) => {
  return new Promise((resolve, reject) => {
    if (index < arr.length) {
      method(arr[index])
        .then(() => {
          return promiseBatchPerformer(arr, index+1, method);
        })
        .then(() => {
          resolve()
        })
        .catch((err) => reject(err))
    }
    else {
      resolve();
    }
  })
};


module.exports = performFirmwareOperations;
