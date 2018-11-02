"use strict";

/**
 * The hardware version is constructed as follows
 *
 *  type + productionRun + housingId + reserved + nordicChipVersion
 *
 * Type is separated into plug, builtin and guidestone at the moment and will be probably expanded in the future
 */
const hardwareVersionExportData = {
  hardwareVersionElements : {
    nordicChipVersions : ["QFAAB0"],
    productionRuns : ["0000"],
    housingIds : ["0000"],
    reservedData : ["00000000"],
    types : {
      plugVersions: [
        "10102000100", // ACR01B2A :: CROWNSTONE PLUG
        "10102000200", // ACR01B2B :: CROWNSTONE PLUG
        "10102010000", // ACR01B2C :: CROWNSTONE PLUG
        "10102010300", // ACR01B2G :: CROWNSTONE PLUG
      ],

      builtinVersions: [
        "10103000100", // ACR01B1A :: CROWNSTONE BUILTIN
        "10103000200", // ACR01B1B :: CROWNSTONE BUILTIN
        "10103000300", // ACR01B1C :: CROWNSTONE BUILTIN
        "10103000400", // ACR01B1D :: CROWNSTONE BUILTIN
        "10103010000", // ACR01B1E :: CROWNSTONE BUILTIN
        "10103000500", // ACR01B1E :: CROWNSTONE BUILTIN // renamed by marc
      ],

      guidestoneVersions: [
        "10104010000", // GUIDESTONE
      ],

      dongleVersions: [
        "10105000000",
      ]
    }
  },
  util: {
    getAllVersions() {
      // get all types
      let allTypes = [];
      let categorizedTypes = hardwareVersionExportData.hardwareVersionElements.types;
      let productTypes = Object.keys(categorizedTypes);
      productTypes.forEach((type) => {
        allTypes = allTypes.concat(categorizedTypes[type])
      });

      return combineAll(allTypes);
    },

    getAllPlugs() {
      return combineAll(hardwareVersionExportData.hardwareVersionElements.types.plugVersions);
    },

    getAllBuiltIns() {
      return combineAll(hardwareVersionExportData.hardwareVersionElements.types.builtinVersions);
    },

    getAllGuideStones() {
      return combineAll(hardwareVersionExportData.hardwareVersionElements.types.guidestoneVersions);
    },

    getAllDongles() {
      return combineAll(hardwareVersionExportData.hardwareVersionElements.types.dongleVersions);
    }
  }
};

/**
 * combine all production numbers with the provided types
 * @param types
 * @returns {Array}
 */
function combineAll(types) {
  let result = [];
  let elements = hardwareVersionExportData.hardwareVersionElements;
  types.forEach((type) => {
    elements.productionRuns.forEach((productionRun) => {
      elements.housingIds.forEach((housingId) => {
        elements.reservedData.forEach((reserved) => {
          elements.nordicChipVersions.forEach((nordicChipVersion) => {
            result.push(type + productionRun + housingId + reserved + nordicChipVersion);
          });
        });
      });
    });
  });

  return result;
}

module.exports = hardwareVersionExportData;
