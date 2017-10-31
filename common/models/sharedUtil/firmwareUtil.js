"use strict";

const loopback = require('loopback');

const firmwareUtils = {
  insertLatestFirmwareAndBootloader: function (user) {
    const Firmwares = loopback.getModel('Firmware');
    const Bootloaders = loopback.getModel('Bootloader');

    return Firmwares.getLatestVersions()
      .then((data) => {
        user.firmwareVersionsAvailable = data;
        return Bootloaders.getLatestVersions();
      })
      .then((data) => {
        user.bootloaderVersionsAvailable = data;
        return user.save();
      })
  }
};

module.exports = firmwareUtils;