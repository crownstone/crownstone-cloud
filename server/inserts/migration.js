"use strict";
let CHANGE_DATA = false;

const Util = require("../../common/models/sharedUtil/util")
const constants = require("../../common/models/sharedUtil/constants")
const { ask, callbackPromiseBatchPerformer } = require("./insertUtil");
var ObjectID = require('mongodb').ObjectID;

function performMigration(app) {
  Promise.resolve()
    .then(() => { return migrateKeysForExistingSpheres(app) })
    // .then(() => { return migrateKeysForExistingStones(app) })
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
