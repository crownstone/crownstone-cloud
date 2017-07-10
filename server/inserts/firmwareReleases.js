"use strict";

let hardwareVersions = require("../constants/hardwareVersions");

let plugAndBuiltinVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns());

function performFirmwareOperations(app) {
  let firmwareModel = app.dataSources.mongoDs.getModel('Firmware');
  let bootloaderModel = app.dataSources.mongoDs.getModel('Bootloader');

  // start with empty promise so we can put all commands in a chain (easier for commenting/uncommenting lines)
  new Promise((resolve, reject) => resolve())
    // .then(() => { return clearFirmwares(firmwareModel) })
    // .then(() => { return clearBootloaders(bootloaderModel) })
    // .then(() => {
    //   return releaseFirmware(
    //     firmwareModel,
    //     '1.4.0', // release version
    //     '1.3.1', // minimum compatible version,
    //     plugAndBuiltinVariations, // hardware versions
    //     'e66ccea1cac79905eee81197339ef3ff41ef7fc9', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/firmwares/crownstone_1.4.0/bin/crownstone_1.4.0.zip',
    //     1 // release level: 0 for release to all new users
    //   );
    // })
    // .then(() => {
    //   return releaseBootloader(
    //     bootloaderModel,
    //     '1.2.2', // release version
    //     '1.2.2', // minimum compatible version
    //     plugAndBuiltinVariations, // hardware versions
    //     '45306bf3ed920dc9768a57c3df3fd16954ea5b97', // sha1 hash to validate download
    //     'https://github.com/crownstone/bluenet-release/raw/master/bootloaders/bootloader_1.2.2/bin/bootloader_1.2.2.zip',
    //     1 // release level: 0 for release to all new users
    //   );
    // })
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

function clearFirmwares(firmwareModel) {
  return _removeAll(firmwareModel, 'FIRMWARES');
}

function clearBootloaders(bootloaderModel) {
  return _removeAll(bootloaderModel, 'BOOTLOADERS');
}

function showFirmwares(firmwareModel) {
  return show(firmwareModel, 'Firmware');
}

function showBootloaders(bootloaderModel) {
  return show(bootloaderModel, 'Bootloader');
}

function releaseFirmware(firmwareModel, firmwareVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel) {
  return _release(firmwareModel, 'Firmware', firmwareVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel);
}

function releaseBootloader(bootloaderModel, bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel) {
  return _release(bootloaderModel, 'Bootloader', bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel);
}

function removeFirmwareVersion(firmwareModel, version) {
  return _remove(firmwareModel, version);
}

function removeBootloaderModel(bootloaderModel, version) {
  return _remove(bootloaderModel, version);
}

// UTIL:

function show(model, type) {
  return model.find()
    .then((results) => {
     console.log(type, "versions found:", results);
    })
}

function _release(model, type, releaseVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl, releaseLevel) {
  return model.create({
    version: releaseVersion,
    supportedHardwareVersions: hardwareVersions,
    minimumCompatibleVersion: minimumCompatibleVersion,
    sha1hash: hash.replace(/( )/g,""),
    downloadUrl: downloadUrl,
    releaseLevel: releaseLevel,
  })
    .then((result) => {
      console.log(type, "version ", releaseVersion, " added successfully!");
      console.log("Result:", result);
    })
    .catch((err) => { console.log("Error adding",type, "version:", releaseVersion, ' :', err); })
}

function _remove(model, version) {
  return model.find({version:version})
    .then((results) => {
      let deletionPromises = [];
      results.forEach((result) => {
        deletionPromises.push(model.destroyById(result.id))
      });
      return Promise.all(deletionPromises);
    })
    .then(() => {
      console.log("Successfully deleted firmware: ",version, ' :');
    })
    .catch((err) => { console.log("Error DELETING FIRMWARE version: ",version, ' :', err); })
}

function _removeAll(model, type) {
  return model.destroyAll()
    .then(() => {
      console.log("REMOVED ALL", type);
    })
}


module.exports = performFirmwareOperations;
