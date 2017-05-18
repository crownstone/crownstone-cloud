"use strict";

let hardwareVersions = require("../constants/hardwareVersions");

const versionUtil = {

  getHighestForAllHardwareVersionsForAllUsers: function(data) {
    return versionUtil.getHighestForAllHardwareVersions(data, 0);
  },



  /**
   * Data is assumed to be a dump of the firmware or bootloader model. It will return a JSON with:
   *
   * {
   *  hardwareVersionNumber: highestCompatibleVersion
   * }
   *
   * If there is no highestCompatibleVersion for a specific hardwareVersionNumber, there will not be an entry in the JSON.
   *
   * releaseLevel defines how far into the release this version is. 0 is the final release that is default for all users.
   *
   * @param data
   * @param releaseLevel
   * @returns {{}}
   */
  getHighestForAllHardwareVersions: function(data, releaseLevel) {
    let result = {};
    let allVersions = hardwareVersions.util.getAllVersions();

    // create hashMaps of supported hardware versions so we can easily query the list instead of doing a lot of indexOfs
    let dataMaps = [];
    for (let i = 0; i < data.length; i++) {
      let newMap = {};
      for (let j = 0; j < data[i].supportedHardwareVersions.length; j++) {
        newMap[data[i].supportedHardwareVersions[j]] = true;
      }
      dataMaps.push(newMap);
    }

    // for each hardware version, loop over the firmwares and check if this version if supported.
    for (let i = 0; i < allVersions.length; i++) {
      let highestCompatibleVersion = versionUtil.getHighestWithHardwareVersionSupport(data, dataMaps, allVersions[i], releaseLevel);
      if (highestCompatibleVersion) {
        result[allVersions[i]] = highestCompatibleVersion;
      }
    }
    return result;
  },

  getHighestWithHardwareVersionSupport: function(data, dataMaps, hardwareVersion, releaseLevel) {
    let highest = null;

    for (let i = 0; i < data.length; i++) {
      if (data[i].releaseLevel !== undefined && data[i].releaseLevel <= releaseLevel) {
        if (dataMaps[i][hardwareVersion] === true) {
          highest = isHigher(data[i].version, highest) ? data[i].version : highest;
        }
      }
    }

    return highest;
  },

};

function isHigher(version, compareWithVersion) {
  if (!compareWithVersion) {
    return true;
  }

  if (!version) {
    return false;
  }

  // a git commit hash is never higher, we pick 12 so 123.122.1234 is the max semver length.
  if (version.length > 12) {
    return false;
  }

  let A = version.split('.');

  // further ensure only semver is compared
  if (A.length !== 3) {
    return false;
  }

  let B = compareWithVersion.split('.');

  if (B.length !== 3) {
    return false;
  }

  if (A[0] < B[0]) return false;
  else if (A[0] > B[0]) return true;
  else { // A[0] == B[0]
    if (A[1] < B[1]) return false;
    else if (A[1] > B[1]) return true;
    else { // A[1] == B[1]
      return (A[2] > B[2]);
    }
  }
};

module.exports = versionUtil;