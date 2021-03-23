"use strict";
let CHANGE_DATA = false;

const Util = require("../../common/models/sharedUtil/util")
const constants = require("../../common/models/sharedUtil/constants")
const { ask, callbackPromiseBatchPerformer } = require("./insertUtil");
var ObjectID = require('mongodb').ObjectID;

function performMigration(app) {
  Promise.resolve()
    // .then(() => { return migrateTokens(app) })
    // .then(() => { return migrateFirmwareFields(app) })
    // .then(() => { return migrateBootloaderFields(app) })
    // .then(() => { return migrateFirmwareHardwareVersions(app) })
    // .then(() => { return migrateBootloaderHardwareVersions(app) })
    // .then(() => { return migrateKeysForExistingSpheres(app) })
    // .then(() => { return migrateKeysForExistingStones(app) })
    .then(() => { console.log("DONE!") })
}

function migrateTokens(app) {
  const tokenModel = app.dataSources.mongoDs.getModel('AccessToken');
  const newTokenModel = app.dataSources.mongoDs.getModel('CrownstoneAccessToken');

  let doIt = function() {
    let newResults = {};
    let toMigrate = 0;
    let alreadyMigrated = 0;
    let expired = 0;
    return newTokenModel.find()
      .then((results) => {
        results.forEach((r) => {
          newResults[r.id] = true;
        })

        return tokenModel.find()
      })
      .then((results) => {
        let migratedData = [];
        let now = new Date().valueOf();

        results.forEach((r) => {
          if (now - (new Date(r.created).valueOf() + 1000*r.ttl) <= 0) {
            if (newResults[r.id] === true) {
              alreadyMigrated += 1;
            }
            else {
              migratedData.push({
                id: r.id,
                ttl: r.ttl,
                created: r.created,
                userId: r.userId,
                principalType:"user"
              })
              toMigrate += 1;
            }
          }
          else {
            expired += 1;
          }
        })

        if (CHANGE_DATA !== true) {
          console.log("Because change data is false nothing was changed. I would have migrated", toMigrate, "tokens, ignored", expired, " and skipped", alreadyMigrated, "tokens");
        } else {
          return newTokenModel.create(migratedData);
        }
      })
      .then(() => {
        console.log("I have migrated", toMigrate, "tokens, ignored", expired, " and skipped", alreadyMigrated, "tokens.");
      })
      .catch((err) => {
        console.log("Error during migration:", err);
      })
  }

  // if (CHANGE_DATA === true) {
  //   return ask("Database Operations: DO YOU WANT TO MIGRATE THE DEPENDENCE FORMAT OF FIRMWARE ENTRIES Continue? (YES/NO)")
  //     .then((answer) => {
  //       if (answer === 'YES') {
  //         console.log("STARTING OPERATION")
  //         return doIt();
  //       }
  //       else {
  //         return new Promise((resolve, reject) => {
  //           reject("User permission denied for updating the dependence format fo the firmware entries. Restart script and type YES to continue.")
  //         });
  //       }
  //     })
  // }
  // else {
  //   return doIt();
  // }
  return doIt()
}



function migrateFirmwareFields(app) {
  const firmwareModel = app.dataSources.mongoDs.getModel('Firmware');

  let doIt = function() {
    return firmwareModel.find()
      .then((results) => {
        let promises = [Promise.resolve()];
        results.forEach((result) => {
          let changeFW = false;
          let changeBL = false;
          if (!result.dependsOnFirmwareVersion) {
            result.dependsOnFirmwareVersion = '1.0.0';
            changeFW = true;
          }
          if (!result.dependsOnBootloaderVersion) {
            result.dependsOnBootloaderVersion = '1.0.0';
            changeBL = true;
          }

          if (changeFW || changeBL) {
            if (CHANGE_DATA !== true) {
              console.log("Because change data is false nothing was changed. I would have changed the firmware dependence ", changeFW, " and the bootloader dependence", changeBL);
            } else {
              promises.push(result.save());
            }
          }

        })
        return Promise.all(promises);
      })
      .catch((err) => {
        console.log("Error during migration:", err);
      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO MIGRATE THE DEPENDENCE FORMAT OF FIRMWARE ENTRIES Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt();
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for updating the dependence format fo the firmware entries. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt();
  }
}



function migrateBootloaderFields(app) {
  const bootloaderModel = app.dataSources.mongoDs.getModel('Bootloader');

  let doIt = function() {
    return bootloaderModel.find()
      .then((results) => {
        let promises = [Promise.resolve()]
        results.forEach((result) => {
          let changeBL = false;
          console.log(result.dependsOnBootloaderVersion)
          if (!result.dependsOnBootloaderVersion) {
            result.dependsOnBootloaderVersion = '1.0.0';
            changeBL = true;
          }

          if (changeBL) {
            if (CHANGE_DATA !== true) {
              console.log("Because change data is false nothing was changed. I would have changed the bootloader dependence", changeBL);
            } else {
              promises.push(result.save());
            }
          }
        })

        return Promise.all(promises);
      })
      .catch((err) => {
        console.log("Error during migration:", err);
      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO MIGRATE THE DEPENDENCE FORMAT OF BOOTLOADER ENTRIES Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt();
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for updating the dependence format fo the bootloader entries. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt();
  }
}

function migrateFirmwareHardwareVersions(app) {
  console.log("------------------- Starting migrateFirmwareHardwareVersions");
  const firmwareModel   = app.dataSources.mongoDs.getModel('Firmware');
  return _migrateHardwareVersions(firmwareModel)
}

function migrateBootloaderHardwareVersions(app) {
  console.log("------------------- Starting migrateBootloaderHardwareVersions");
  const firmwareModel   = app.dataSources.mongoDs.getModel('Bootloader');
  return _migrateHardwareVersions(firmwareModel)
}


function _migrateHardwareVersions(model) {
  let doIt = function() {
    return model.find()
      .then((results) => {
        results.forEach((result) => {
          result.supportedHardwareVersions = result.supportedHardwareVersions.map((x) => { return x.substr(0,11)})
          if (CHANGE_DATA !== true) {
            console.log("Because change data is false nothing was changed. I would have changed the supportedHw versions to ", result.supportedHardwareVersions);
          }
          else {
            result.save();
          }
        })
      })
      .catch((err) => {
        console.log("Error during migration:", err);
      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO UPDATE THE SUPPORTED HARDWARE VERSIONS OF THE FIRMWARE OR BOOTLOADER Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt();
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for updating the supported hardware versions of the firmware of bootloader. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt();
  }
}









function migrateKeysForExistingSpheres(app) {
  console.log("------------------- Starting migrateKeysForExistingSpheres");

  const sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  const SphereKeyModel =  app.dataSources.mongoDs.getModel('SphereKeys');

  let spheresToInsert = 0;
  let sphereCounter = 0;

  let doIt = function() {
    return sphereModel.find()
      .then((results) => {
        let keyPromises = [];
        sphereCounter = results.length;
        for (let i = 0; i < results.length; i++) {
          let sphere = results[i];

          keyPromises.push(() => {
            let adminKeyStored        = false;
            let memberKeyStored       = false;
            let basicKeyStored        = false;
            let localizationKeyStored = false;
            let serviceDataKeyStored  = false;
            let meshAppKeyStored      = false;
            let meshNetKeyStored      = false;

            console.log("Searching keys for sphere", sphere.id, i, sphereCounter)
            return SphereKeyModel.find({where: {sphereId: String(sphere.id)}})
              .then((existingKeys) => {
                for (let i = 0; i < existingKeys.length; i++) {
                  let key = existingKeys[i];
                  switch (key.keyType) {
                    case constants.KEY_TYPES.ADMIN_KEY:            adminKeyStored        = true; break;
                    case constants.KEY_TYPES.MEMBER_KEY:           memberKeyStored       = true; break;
                    case constants.KEY_TYPES.BASIC_KEY:            basicKeyStored        = true; break;
                    case constants.KEY_TYPES.LOCALIZATION_KEY:     localizationKeyStored = true; break;
                    case constants.KEY_TYPES.SERVICE_DATA_KEY:     serviceDataKeyStored  = true; break;
                    case constants.KEY_TYPES.MESH_APPLICATION_KEY: meshAppKeyStored      = true; break;
                    case constants.KEY_TYPES.MESH_NETWORK_KEY:     meshNetKeyStored      = true; break;
                  }
                }

                let requiredKeys = [];
                if (!adminKeyStored      )  { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.ADMIN_KEY,            key: sphere.adminEncryptionKey,  ttl: 0 }) }
                if (!memberKeyStored     )  { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.MEMBER_KEY,           key: sphere.memberEncryptionKey, ttl: 0 }) }
                if (!basicKeyStored      )  { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.BASIC_KEY,            key: sphere.guestEncryptionKey,  ttl: 0 }) }
                if (!localizationKeyStored) { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.LOCALIZATION_KEY,     key: Util.createKey(),           ttl: 0 }) }
                if (!serviceDataKeyStored)  { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.SERVICE_DATA_KEY,     key: sphere.guestEncryptionKey,  ttl: 0 }) }
                if (!meshAppKeyStored    )  { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.MESH_APPLICATION_KEY, key: Util.createKey(),           ttl: 0 }) }
                if (!meshNetKeyStored    )  { requiredKeys.push({ sphereId: ObjectID(sphere.id), keyType: constants.KEY_TYPES.MESH_NETWORK_KEY,     key: Util.createKey(),           ttl: 0 }) }

                let keyList = "";
                for (let i = 0; i < requiredKeys.length; i++) {
                  keyList += requiredKeys[i].keyType + " ";
                }

                if (requiredKeys.length > 0) {
                  spheresToInsert++;
                  if (CHANGE_DATA === true) {
                    console.log("Inserting keys:", keyList)
                    return SphereKeyModel.create(requiredKeys);
                  }
                  console.log("Would insert keys:", keyList)
                }
                else {
                  console.log("Inserting keys not required")
                }
              })
          })
        }

        return callbackPromiseBatchPerformer(keyPromises,0);
      })
      .then(() => {
        if (CHANGE_DATA !== true) {
          console.log("Because change data is false nothing was changed. I would have migrated keys from ", spheresToInsert, " out of ", sphereCounter, " Spheres.")
        } else {
          console.log("FINISHED")
        }
      })
      .catch((err) => {
        console.log("Error during migration:", err);

      })
    }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO MIGRATE KEYS FOR ALL EXISTING SPHERES Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt();
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for migrating keys from spheres. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt();
  }
}


function migrateSyncKeysWithExistingSpheres(app) {
  console.log("------------------- Starting migrateSyncKeysWithExistingSpheres");

  const sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  const SphereKeyModel =  app.dataSources.mongoDs.getModel('SphereKeys');

  let sphereCounter = 0;

  let doIt = function() {
    return sphereModel.find()
      .then((results) => {
        let keyPromises = [];
        sphereCounter = results.length;
        for (let i = 0; i < results.length; i++) {
          let sphere = results[i];

          keyPromises.push(() => {
            let adminKeyStored        = false;
            let memberKeyStored       = false;
            let basicKeyStored        = false;
            let localizationKeyStored = false;
            let serviceDataKeyStored  = false;
            let meshAppKeyStored      = false;
            let meshNetKeyStored      = false;

            console.log("Searching keys for sphere", sphere.id, i, sphereCounter)
            return SphereKeyModel.find({where: {sphereId: String(sphere.id)}})
              .then((existingKeys) => {
                let promises = [];
                for (let i = 0; i < existingKeys.length; i++) {
                  let key = existingKeys[i];
                  let changeRequired = false;

                  switch (key.keyType) {
                    case constants.KEY_TYPES.ADMIN_KEY:            adminKeyStored        = true; break;
                    case constants.KEY_TYPES.MEMBER_KEY:           memberKeyStored       = true; break;
                    case constants.KEY_TYPES.BASIC_KEY:            basicKeyStored        = true; break;
                    case constants.KEY_TYPES.LOCALIZATION_KEY:     localizationKeyStored = true; break;
                    case constants.KEY_TYPES.SERVICE_DATA_KEY:     serviceDataKeyStored  = true; break;
                    case constants.KEY_TYPES.MESH_APPLICATION_KEY: meshAppKeyStored      = true; break;
                    case constants.KEY_TYPES.MESH_NETWORK_KEY:     meshNetKeyStored      = true; break;
                  }

                  switch (key.keyType) {
                    case constants.KEY_TYPES.ADMIN_KEY:
                      if (key.key !== sphere.adminEncryptionKey && sphere.adminEncryptionKey) {
                        // console.log("Admin key is not the same as the old key", sphere.id)
                        key.key = sphere.adminEncryptionKey;
                        changeRequired = true;
                      }
                      break;
                    case constants.KEY_TYPES.MEMBER_KEY:
                      if (key.key !== sphere.memberEncryptionKey && sphere.memberEncryptionKey) {
                        // console.log("Member key is not the same as the old key", sphere.id)
                        key.key = sphere.memberEncryptionKey;
                        changeRequired = true;
                      }
                      break;
                    case constants.KEY_TYPES.BASIC_KEY:
                      if (key.key !== sphere.guestEncryptionKey && sphere.adminEncryptionKey) {
                        // console.log("Guest key is not the same as the old key", sphere.id)
                        key.key = sphere.guestEncryptionKey;
                        changeRequired = true;
                      }
                      break;
                  }


                  if (changeRequired) {
                    if (CHANGE_DATA === true) {
                      console.log("changing key")
                      promises.push(key.save());
                    }
                    console.log("Would change key:", key.id)

                  }
                }

                return Promise.all(promises);
              })
          })
        }

        return callbackPromiseBatchPerformer(keyPromises,0);
      })
      .then(() => {
        if (CHANGE_DATA !== true) {
          console.log("Because change data is false nothing was changed. I would have changed keys.")
        } else {
          console.log("FINISHED")
        }
      })
      .catch((err) => {
        console.log("Error during migration:", err);

      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO SYNC KEYS BETWEEN SPHERES AND NEW KEYS Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt();
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for syncing keys. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt();
  }
}




function migrateKeysForExistingStones(app) {
  console.log("------------------- Starting migrateKeysForExistingStones");

  const StoneModel = app.dataSources.mongoDs.getModel('Stone');
  const StoneKeyModel =  app.dataSources.mongoDs.getModel('StoneKeys');

  let stonesToInsert = 0;
  let stoneCounter = 0;

  let doIt = function() {
    return StoneModel.find()
      .then((results) => {
        let keyPromises = [];
        stoneCounter = results.length;
        for (let i = 0; i < results.length; i++) {
          let stone = results[i];
          keyPromises.push(() => {
            let meshDeviceKeyStored = false;
            console.log("Searching for stone", stone.id, i, stoneCounter);
            return StoneKeyModel.find({where: {stoneId: stone.id}})
              .then((existingKeys) => {
                for (let i = 0; i < existingKeys.length; i++) {
                  let key = existingKeys[i];
                  switch (key.keyType) {
                    case constants.KEY_TYPES.MESH_DEVICE_KEY: meshDeviceKeyStored = true; break;
                  }
                }

                let requiredKeys = [];
                if (!meshDeviceKeyStored) {
                  requiredKeys.push({
                    sphereId: ObjectID(stone.sphereId),
                    stoneId:  ObjectID(stone.id),
                    keyType:  constants.KEY_TYPES.MESH_DEVICE_KEY,
                    key: Util.createKey(),
                    ttl: 0
                  }) }

                if (requiredKeys.length > 0) {
                  stonesToInsert++;
                  if (CHANGE_DATA === true) {
                    console.log("Creating keys")
                    return StoneKeyModel.create(requiredKeys);
                  }
                }
                else {
                  console.log("Inserting keys not required")
                }
              })
          })
        }

        return callbackPromiseBatchPerformer(keyPromises,0);
      })
      .then(() => {
        if (CHANGE_DATA !== true) {
          console.log("Because change data is false nothing was changed. I would have migrated keys from ", stonesToInsert, " out of ", stoneCounter, " Stones.")
        } else {
          console.log("FINISHED")
        }
      })
      .catch((err) => {
        console.log("Error during migration:", err);

      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO MIGRATE KEYS FOR ALL EXISTING STONES Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt()
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for migrating keys from spheres. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt()
  }
}




module.exports = performMigration;
