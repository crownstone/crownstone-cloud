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
          highest = versionUtil.isHigher(data[i].version, highest) ? data[i].version : highest;
        }
      }
    }

    return highest;
  },

  isHigher: function(version, compareWithVersion) {
    if (!compareWithVersion) {
      return true;
    }

    if (!version) {
      return false;
    }

    let [versionClean, versionRc] = getRC(version);
    let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

    if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
      return false;
    }

    let A = versionClean.split('.');
    let B = compareWithVersionClean.split('.');

    if (A[0] < B[0]) return false;
    else if (A[0] > B[0]) return true;
    else { // A[0] == B[0]
      if (A[1] < B[1]) return false;
      else if (A[1] > B[1]) return true;
      else { // A[1] == B[1]
        if (A[2] < B[2]) return false;
        else if (A[2] > B[2]) return true;
        else { // A[2] == B[2]
          if (versionRc === null && compareWithVersionRc === null) {
            return false;
          }
          else if (versionRc !== null && compareWithVersionRc !== null) {
            return (versionRc > compareWithVersionRc);
          }
          else if (versionRc !== null) {
            // 2.0.0.rc0 is smaller than 2.0.0
            return false;
          }
          else {
            return true;
          }
        }
      }
    }
  },

  isHigherOrEqual: function(version, compareWithVersion) {
    if (!version || !compareWithVersion) {
      return false;
    }

    let [versionClean, versionRc] = getRC(version);
    let [compareWithVersionClean, compareWithVersionRc] = getRC(compareWithVersion);

    if (checkSemVer(versionClean) === false || checkSemVer(compareWithVersionClean) === false) {
      return false;
    }

    if (version === compareWithVersion && version && compareWithVersion) {
      return true;
    }

    return versionUtil.isHigher(version, compareWithVersion);
  },
};

function getRC(version) {
  let lowerCaseVersion = version.toLowerCase()
  let lowerCaseRC_split = lowerCaseVersion.split("-rc");
  let RC = null
  if (lowerCaseRC_split.length > 1) {
    RC = lowerCaseRC_split[1];
  }

  return [lowerCaseRC_split[0], RC];
}


let checkSemVer = (str) => {
  if (!str) { return false; }

  // a git commit hash is longer than 12, we pick 12 so 123.122.1234 is the max semver length.
  if (str.length > 12) {
    return false;
  }

  let A = str.split('.');

  // further ensure only semver is compared
  if (A.length !== 3) {
    return false;
  }

  return true;
};

module.exports = versionUtil;
