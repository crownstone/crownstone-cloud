"use strict";

let nordicChipVersion = "QFAAB0";
let productionRun = "0000";
let housingId = "0000";
let reserved = "00000000";
let plugVersions = [
  "10102000100", // ACR01B2A == CROWNSTONE PLUG
  "10102000200", // ACR01B2B == CROWNSTONE PLUG
  "10102010000", // ACR01B2C == CROWNSTONE PLUG
];

let builtinVersions = [
  "10103000100", // ACR01B1A == CROWNSTONE BUILTIN
  "10103000200", // ACR01B1B == CROWNSTONE BUILTIN
  "10103000300", // ACR01B1C == CROWNSTONE BUILTIN
  "10103000400", // ACR01B1D == CROWNSTONE BUILTIN
  "10103010000", // ACR01B1E == CROWNSTONE BUILTIN
];

let guidestoneVersions = [
  "10104010000", // GUIDESTONE
];

let plugAndBuiltinVariations = [];
plugVersions.forEach(   (version) => { plugAndBuiltinVariations.push(version + productionRun + housingId + reserved + nordicChipVersion); });
builtinVersions.forEach((version) => { plugAndBuiltinVariations.push(version + productionRun + housingId + reserved + nordicChipVersion); });


function performFirmwareOperations(app) {
  let firmwareModel = app.dataSources.mongoDs.getModel('Firmware');
  let bootloaderModel = app.dataSources.mongoDs.getModel('Bootloader');

  // start with empty promise so we can put all commands in a chain (easier for commenting/uncommenting lines)
  // new Promise((resolve, reject) => resolve())
  //   .then(() => {clearFirmwares(firmwareModel) })
  //   .then(() => {clearBootloaders(bootloaderModel) })
  //   .then(() => {
  //     return releaseFirmware(
  //       firmwareModel,
  //       '1.3.1', // release version
  //       '1.3.1', // minimum compatible version,
  //       plugAndBuiltinVariations, // hardware versions
  //       'f4871adaef314e32b96d0004e2e77a879aa651d1', // sha1 hash to validate download
  //       'https://github.com/crownstone/bluenet-release/raw/master/crownstone_1.3.1/bin/crownstone_1.3.1.zip'
  //     );
  //   })
  //   .then(() => {
  //     return releaseBootloader(
  //       bootloaderModel,
  //       '1.2.2', // release version
  //       '1.2.2', // minimum compatible version
  //       plugAndBuiltinVariations, // hardware versions
  //       '45306bf3ed920dc9768a57c3df3fd16954ea5b97', // sha1 hash to validate download
  //       'https://github.com/crownstone/bluenet-release/raw/master/bootloader_1.2.2/bin/bootloader_1.2.2.zip'
  //     );
  //   })
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

function releaseFirmware(firmwareModel, firmwareVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl) {
  return _release(firmwareModel, 'Firmware', firmwareVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl);
}

function releaseBootloader(bootloaderModel, bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl) {
  return _release(bootloaderModel, 'Bootloader', bootloaderVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl);
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

function _release(model, type, releaseVersion, minimumCompatibleVersion, hardwareVersions, hash, downloadUrl) {
  return model.create({
    version: releaseVersion,
    supportedHardwareVersions: hardwareVersions,
    minimumCompatibleVersion: minimumCompatibleVersion,
    sha1hash: hash.replace(/( )/g,""),
    downloadUrl: downloadUrl,
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
}

function _removeAll(model, type) {
  return model.destroyAll()
    .then(() => {
      console.log("REMOVED ALL", type);
    })
}


module.exports = performFirmwareOperations;