"use strict";

function performFirmwareOperations(app) {
  let firmwareModel = app.dataSources.mongoDs.getModel('Firmware');
  let bootloaderModel = app.dataSources.mongoDs.getModel('Bootloader');
  //let userModel = app.dataSources.userDs.getModel('user');

  // showFirmwares(firmwareModel);
  // showBootloaders(bootloaderModel);

  // releaseFirmware(
  //   firmwareModel,
  //   '1.3.1', // release version
  //   '1.3.1', // minimum compatible version
  //   '1.3.1', // minimum compatible version
  //   'https://github.com/crownstone/bluenet-release/raw/master/crownstone_1.3.1/bin/crownstone_1.3.1.zip'
  // );
  //
  // releaseBootloader(
  //   bootloaderModel,
  //   '1.2.2', // release version
  //   '1.2.2', // minimum compatible version
  //   '1.2.2', // minimum compatible version
  //   'https://github.com/crownstone/bluenet-release/raw/master/bootloader_1.2.2/bin/bootloader_1.2.2.zip'
  // );
}

function showFirmwares(firmwareModel) {
  show(firmwareModel, 'Firmware');
}

function showBootloaders(bootloaderModel) {
  show(bootloaderModel, 'Bootloader');
}

function releaseFirmware(firmwareModel, version, minimumCompatibleVersion, hash, downloadUrl) {
  return _release(firmwareModel, 'Firmware', version, minimumCompatibleVersion, hash, downloadUrl);
}

function releaseBootloader(bootloaderModel, version, minimumCompatibleVersion, hash, downloadUrl) {
  return _release(bootloaderModel, 'Bootloader', version, minimumCompatibleVersion, hash, downloadUrl);
}

function removeFirmwareVersion(firmwareModel, version) {
  return _remove(firmwareModel, version);
}

function removeBootloaderModel(bootloaderModel, version) {
  return _remove(bootloaderModel, version);
}

// UTIL:

function show(model, type) {
  model.find()
    .then((results) => {
     console.log(type, "versions found:", results);
    })
}

function _release(model, type, version, minimumCompatibleVersion, hash, downloadUrl) {
  model.create({
    version: version,
    minimumCompatibleVersion: minimumCompatibleVersion,
    sha1hash: hash,
    downloadUrl: downloadUrl,
  })
    .then((result) => {
      console.log(type, "version ", version, " added successfully!");
      console.log("Result:", result);
    })
    .catch((err) => { console.log("Error adding",type, "version:", version, ' :', err); })
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


module.exports = performFirmwareOperations;