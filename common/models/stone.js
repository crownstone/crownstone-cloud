"use strict";

let loopback = require('loopback');
let crypto = require('crypto');

const versionUtil = require('../../server/util/versionUtil');
const notificationHandler = require('../../server/modules/NotificationHandler');
const WebHookHandler = require('../../server/modules/WebHookHandler');
const EventHandler = require('../../server/modules/EventHandler');
const debug = require('debug')('loopback:crownstone');
const constants = require('./sharedUtil/constants');
const Util = require('./sharedUtil/util');

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {

    //***************************
    // GENERAL, ADMIN and OWNER
    //  see sphere-content.js
    //***************************

    //***************************
    // MEMBER:
    //   - everything except:
    //   	- delete/remove location(s)
    //   	- delete:
    //   		- powerUsage
    //   		- energyUsage
    //   		- powerCurve
    //   		- coordinate
    //   	- delete stone
    //***************************
    model.settings.acls.push(
      {
        "accessType": "EXECUTE",
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "ALLOW"
      }
    );

    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__locations"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__unlink__locations"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteAllEnergyUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteAllPowerUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteEnergyUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deletePowerUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteById"
      }
    );

    //***************************
    // GUEST:
    //   - read
    //   - update stone
    //   - findLocation
    //***************************
    model.settings.acls.push(
      {
        "accessType": "READ",
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW"
      }
    );
    // model.settings.acls.push(
    // 	{
    // 		"principalType": "ROLE",
    // 		"principalId": "$group:guest",
    // 		"permission": "ALLOW",
    // 		"property": "updateAttributes"
    // 	}
    // );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "findLocation"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "updateSwitchState"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "energyUsageBatch"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "activityRangeBatchCreate"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "activityRangeBatchUpdate"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "notifyOnRecovery"
      }
    );
  }


  // address has to be unique to a stone
  model.validatesUniquenessOf('address', {scopedTo: ['sphereId'], message: 'a stone with this address was already added!'});
  model.validatesUniquenessOf('uid',     {scopedTo: ['sphereId'], message: 'a stone with this uid was already added'});
  model.validatesUniquenessOf('major',   {scopedTo: ['sphereId', 'minor'], message: 'a stone with this major minor combination was already added'});

  // model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('replaceById');


  model.disableRemoteMethodByName('prototype.__create__locations');
  model.disableRemoteMethodByName('prototype.__delete__locations');
  model.disableRemoteMethodByName('prototype.__updateById__locations');
  model.disableRemoteMethodByName('prototype.__deleteById__locations');
  model.disableRemoteMethodByName('prototype.__destroyById__locations');

  model.disableRemoteMethodByName('prototype.__updateById__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__updateById__powerCurveHistory');
  model.disableRemoteMethodByName('prototype.__updateById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__updateById__switchStateHistory');

  model.disableRemoteMethodByName('prototype.__delete__energyUsageHistory'); // this is the delete ALL
  model.disableRemoteMethodByName('prototype.__delete__powerCurveHistory');  // this is the delete ALL
  model.disableRemoteMethodByName('prototype.__delete__powerUsageHistory');  // this is the delete ALL
  model.disableRemoteMethodByName('prototype.__deleteById__switchStateHistory');
  model.disableRemoteMethodByName('prototype.__delete__switchStateHistory');

  model.disableRemoteMethodByName('prototype.__count__schedules');

  model.disableRemoteMethodByName('prototype.__count__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__create__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__findById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__destroyById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__deleteById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__get__powerUsageHistory');


  model.disableRemoteMethodByName('prototype.__count__energyUsage');
  model.disableRemoteMethodByName('prototype.__create__energyUsage');
  model.disableRemoteMethodByName('prototype.__findById__energyUsage');
  model.disableRemoteMethodByName('prototype.__updateById__energyUsage');
  model.disableRemoteMethodByName('prototype.__destroyById__energyUsage');
  model.disableRemoteMethodByName('prototype.__deleteById__energyUsage');
  model.disableRemoteMethodByName('prototype.__delete__energyUsage');
  model.disableRemoteMethodByName('prototype.__get__energyUsage');

  model.disableRemoteMethodByName('prototype.__count__abilities');
  model.disableRemoteMethodByName('prototype.__create__abilities');
  model.disableRemoteMethodByName('prototype.__findById__abilities');
  model.disableRemoteMethodByName('prototype.__updateById__abilities');
  model.disableRemoteMethodByName('prototype.__destroyById__abilities');
  model.disableRemoteMethodByName('prototype.__deleteById__abilities');
  model.disableRemoteMethodByName('prototype.__delete__abilities');
  model.disableRemoteMethodByName('prototype.__get__abilities');

  model.disableRemoteMethodByName('prototype.__get__currentSwitchState');

  model.disableRemoteMethodByName('prototype.__count__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__create__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__findById__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__destroyById__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__deleteById__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__get__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__get__location');

  model.disableRemoteMethodByName('prototype.__count__switchStateHistory');
  model.disableRemoteMethodByName('prototype.__create__switchStateHistory');
  model.disableRemoteMethodByName('prototype.__findById__switchStateHistory');
  model.disableRemoteMethodByName('prototype.__get__switchStateHistory');
  model.disableRemoteMethodByName('prototype.__destroyById__switchStateHistory');

  model.disableRemoteMethodByName('prototype.__count__behaviour');
  model.disableRemoteMethodByName('prototype.__delete__behaviour');


  function initStone(ctx, next) {
    debug("initStone");
    // debug("ctx", ctx);
    let item = ctx.instance;

    if (item) {
      injectMajorMinor(item);
      injectUID(item, next);
    }
    else {
      next();
    }
  }

 function injectMajorMinor(item, next) {
    let buf = crypto.randomBytes(4);
    if (!item.major) {
      // debug("inject major");
      item.major = buf.readUInt16BE(0);
    }
    if (!item.minor) {
      // debug("inject minor");
      item.minor = buf.readUInt16BE(2);
    }

    if (!item.minor || !item.major) {
      injectMajorMinor(item);
    }
  }

  function injectUID(item, next) {
    if (!item.uid) {
      // debug("inject uid");

      // To inject a UID, we look for the highest available one. The new one is one higher
      // If this is more than the allowed amount of Crownstones, we loop over all Crownstones in the Sphere to check for gaps
      // Gaps can form when Crownstones are deleted.
      // If all gaps are filled, we throw an error to tell the user that he reached the maximum amount.
      model.find({where: {sphereId: item.sphereId}, order: "uid DESC", limit: "1"})
        .then((result) => {
          if (result.length > 0) {
            let stone = result[0];
            if ((stone.uid + 1) > 255) {
              injectUIDinGap(item, next);
            }
            else {
              item.uid = stone.uid + 1;
              next();
            }
          }
          else {
            item.uid = 1;
            next();
          }
        })
        .catch((err) => {
          next(err);
        })
    }
    else {
      next();
    }
  }

  function injectUIDinGap(item, next) {
    model.find({where: {sphereId: item.sphereId}, order: "uid ASC"})
      .then((fullResults) => {
        let availableUID = 0;
        for (let i = 0; i < fullResults.length; i++) {
          let expectedUID = i+1;
          if (fullResults[i].uid !== expectedUID) {
            availableUID = expectedUID;
            break;
          }
        }

        if (availableUID > 0 && availableUID < 256) {
          item.uid = availableUID;
          next();
        }
        else {
          let err = {
            statusCode: 422,
            name: "ValidationError",
            message: "The maximum number of Crownstones per Sphere, 255, has been reached. You cannot add another Crownstone without deleting one first."
          };
          throw err;
        }
      })
      .catch((err) => {
        next(err);
      })
  }

  function afterSave(ctx, next) {
    enforceUniqueness(ctx, (err) => {
      if (err) { return next(err); }

      if (ctx.isNewInstance) {
        const StoneKeyModel = loopback.getModel('StoneKeys');
        let stoneId = ctx.instance.id;
        let sphereId = ctx.instance.sphereId;
        return StoneKeyModel.create([
          {sphereId: sphereId, stoneId: stoneId, keyType: constants.KEY_TYPES.MESH_DEVICE_KEY, key: Util.createKey(), ttl: 0},
          {sphereId: sphereId, stoneId: stoneId, keyType: constants.KEY_TYPES.DEVICE_UART_KEY, key: Util.createKey(), ttl: 0}
          ])
          .then(() => {
            EventHandler.dataChange.sendStoneCreatedEventBySphereId(ctx.instance.sphereId, ctx.instance);
            next();
          })
      }
      else {
        if (ctx && ctx.options && ctx.options.blockUpdateEvent === true) {
          return next();
        }

        EventHandler.dataChange.sendStoneUpdatedEventBySphereId(ctx.instance.sphereId, ctx.instance);
        next();
      }
    })
  }

  function enforceUniqueness(ctx, next) {
    // debug("ctx", ctx);
    let item = ctx.instance;
    if (item) {
      // double check if the address is indeed unique in this sphere.
      model.find({where: {and: [{sphereId: item.sphereId}, {address: item.address}]}, order: "createdAt ASC"})
        .then((results) => {
          if (results.length > 1) {
            // delete all but the first one
            for (let i = 1; i < results.length; i++) {
              model.destroyById(results[i].id).catch((err) => {});
            }
            let err = {
              "statusCode": 422,
              "name": "ValidationError",
              "message": "The `Stone` instance is not valid. Details: `address` a stone with this address was already added! (value: \"string\")."
            };
            return next(err);
          }
          else {
            next();
          }
        })
        .catch((err) => {
          next(err);
        })
    } else {
      next();
    }
  }

  // populate some of the elements like uid, major, minor, if not already provided
  model.observe('before save', initStone);
  model.observe('after save', afterSave);

  model.observe('before delete', function(ctx, next) {
    Promise.resolve()
      .then(() => {
        let stoneId = ctx.where.and[0].id;
        return model.findById(stoneId);
      })
      .then((stone) => {
        if (stone) {
          return EventHandler.dataChange.sendStoneDeletedEventBySphereId(stone.sphereId, stone);
        }
      })
      .then(() => {
        next();
      })
      .catch((err) => {
        next();
      })
  });

  /************************************
   **** Energy Usage
   ************************************/
  //
  // model._setCurrentEnergyUsage = function(stone, energyUsage, next) {
  //
  //   debug("_setCurrentEnergyUsage");
  //
  //   // debug("stone:", stone);
  //   // debug("energyUsage:", energyUsage);
  //   energyUsage.sphereId = stone.sphereId;
  //   stone.energyUsageHistory.create(energyUsage, function(err, energyUsageInstance) {
  //     if (err) return next(err);
  //
  //     if (energyUsageInstance) {
  //       stone.currentEnergyUsageId = energyUsageInstance.id;
  //       stone.save(function(err, stoneInstance) {
  //         if (next) {
  //           if (err) return next(err);
  //           next(null, energyUsageInstance);
  //         }
  //       })
  //     } else {
  //       return next(new Error("failed to create energyUsage"));
  //     }
  //   });
  //
  // };
  //
  // model.setCurrentEnergyUsage = function(energyUsage, stoneId, next) {
  //   debug("setCurrentEnergyUsage");
  //
  //   model.findById(stoneId, function(err, stone) {
  //     if (err) return next(err);
  //     if (model.checkForNullError(stone, next, "id: " + stoneId)) return;
  //
  //     model._setCurrentEnergyUsage(stone, energyUsage, next);
  //   })
  //
  // };
  //
  // model.remoteMethod(
  //   'setCurrentEnergyUsage',
  //   {
  //     http: {path: '/:id/currentEnergyUsage/', verb: 'POST'},
  //     accepts: [
  //       {arg: 'data', type: 'EnergyUsage', required: true, 'http': {source: 'body'}},
  //       {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
  //     ],
  //     returns: {arg: 'data', type: 'EnergyUsage', root: true},
  //     description: "Add current energy usage of the stone"
  //   }
  // );

  /************************************
   **** Power Usage
   ************************************/

  // model._setCurrentPowerUsage = function(stone, powerUsage, next) {
  //
  //   debug("_setCurrentPowerUsage");
  //
  //   // debug("stone:", stone);
  //   // debug("powerUsage:", powerUsage);
  //
  //   powerUsage.sphereId = stone.sphereId;
  //
  //   stone.powerUsageHistory.create(powerUsage, function(err, powerUsageInstance) {
  //     if (err) return next(err);
  //
  //     if (powerUsageInstance) {
  //       stone.currentPowerUsageId = powerUsageInstance.id;
  //
  //       stone.save(function(err, stoneInstance) {
  //         if (next) {
  //           if (err) return next(err);
  //           next(null, powerUsageInstance);
  //         }
  //       })
  //     } else {
  //       return next(new Error("failed to create powerUsage"));
  //     }
  //   });
  //
  // };

  // model.setCurrentPowerUsage = function(powerUsage, stoneId, next) {
  //   debug("setCurrentPowerUsage");
  //
  //   model.findById(stoneId, function(err, stone) {
  //     if (err) return next(err);
  //     if (model.checkForNullError(stone, next, "id: " + stoneId)) return;
  //
  //     model._setCurrentPowerUsage(stone, powerUsage, next);
  //   })
  //
  // };
  //
  // model.remoteMethod(
  //   'setCurrentPowerUsage',
  //   {
  //     http: {path: '/:id/currentPowerUsage/', verb: 'POST'},
  //     accepts: [
  //       {arg: 'data', type: 'PowerUsage', required: true, http: {source: 'body'}},
  //       {arg: 'id', type: 'any', required: true, http: {source: 'path'}}
  //     ],
  //     returns: {arg: 'data', type: 'PowerUsage', root: true},
  //     description: "Add current power usage of the stone"
  //   }
  // );
  //

  const batchSetHistory = function (fieldName, dataArray, stoneId, next) {
    let historyFieldName = fieldName + "History";
    let currentIdFieldName = "current" + capitalizeFirstLetter(fieldName) + "Id";

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      // prep array by adding sphereId to all fields.
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i].sphereId = stone.sphereId;
      }

      // create the new data in the database
      stone[historyFieldName].create(dataArray)
        .then((insertResult) => {
          if (!insertResult) { return insertResult; }

          let averageFieldKey = "power";
          if (fieldName === 'energyUsage') {
            averageFieldKey = "energy";
          }
          let averageValue = 0;
          let averageCount = 0;

          // get the most recent timestamp in the batch that we have uploaded
          let mostRecentId = null;
          let mostRecentEntry = null;
          let mostRecentTimestamp = 0;
          if (Array.isArray(insertResult)) {
            for (let i = 0; i < insertResult.length; i++) {
              if (insertResult[i][averageFieldKey] !== undefined) {
                averageCount++;
                averageValue += insertResult[i][averageFieldKey];
              }

              let checkTimestamp = new Date(insertResult[i].timestamp).valueOf();
              if (mostRecentTimestamp < checkTimestamp) {
                mostRecentTimestamp = checkTimestamp;
                mostRecentId = insertResult[i].id;
                mostRecentEntry = insertResult[i];
              }
            }
          }
          else {
            mostRecentId = insertResult.id;
            mostRecentEntry = insertResult;
            mostRecentTimestamp = new Date(insertResult.timestamp).valueOf();
          }

          if (averageCount > 0) {
            averageValue /= averageCount;
            mostRecentEntry[averageFieldKey] = averageValue;
          }

          const insertMostRecent = (currentId, mostRecentEntry) => {
            let eventName = null;
            switch (fieldName) {
              case 'powerUsage':
                eventName = 'setCurrentPowerUsage'; break;
              case 'energyUsage':
                eventName = 'setCurrentEnergyUsage'; break;
            }

            if (eventName) {
              WebHookHandler.notifyHooks(model, stoneId, mostRecentEntry, eventName)
            }

            stone[currentIdFieldName] = currentId;
            return stone.save()
              .then(() => {
                return insertResult
              })
          };

          // if there is a most current entry, match the timestamp with the new one.
          if (stone[currentIdFieldName]) {
            return stone[historyFieldName].findById(stone[currentIdFieldName])
              .then((mostRecentEntry) => {
                if (!mostRecentEntry) {
                  return insertMostRecent(mostRecentId, mostRecentEntry);
                }

                if (mostRecentTimestamp > new Date(mostRecentEntry.timestamp).valueOf()) {
                  return insertMostRecent(mostRecentId, mostRecentEntry);
                }
              })
          }
          else {
            return insertMostRecent(mostRecentId, mostRecentEntry);
          }
        })
        .then((insertResult) => {
          next(null, insertResult)
        })
        .catch((err) => {
          next(err);
        })
    });
  };

  // model.setBatchPowerUsage = function(powerUsageArray, stoneId, next) {
  //   batchSetHistory('powerUsage', powerUsageArray, stoneId, next);
  // };
  //
  // model.setBatchEnergyUsage = function(energyUsageArray, stoneId, next) {
  //   batchSetHistory('energyUsage', energyUsageArray, stoneId, next);
  // };
  //
  // model.remoteMethod(
  //   'setBatchEnergyUsage',
  //   {
  //     http: {path: '/:id/batchEnergyUsage/', verb: 'POST'},
  //     accepts: [
  //       {arg: 'data', type: ['EnergyUsage'], required: true, http: {source: 'body'}},
  //       {arg: 'id', type: 'any', required: true, http: {source: 'path'}}
  //     ],
  //     returns: {arg: 'data', type: ['EnergyUsage'], root: true},
  //     description: "Add array of energy usage measurements to the stone."
  //   }
  // );
  //
  // model.remoteMethod(
  //   'setBatchPowerUsage',
  //   {
  //     http: {path: '/:id/batchPowerUsage/', verb: 'POST'},
  //     accepts: [
  //       {arg: 'data', type: ['PowerUsage'], required: true, http: {source: 'body'}},
  //       {arg: 'id', type: 'any', required: true, http: {source: 'path'}}
  //     ],
  //     returns: {arg: 'data', type: ['PowerUsage'], root: true},
  //     description: "Add an array of power usage measurements to the stone."
  //   }
  // );


  /************************************
   **** Other
   ************************************/

  // model.notifyOnRecovery = function(stoneId, next) {
  //   debug("notifyOnRecovery");
  //
  //   model.findById(stoneId, {include: "owner"}, function(err, stone) {
  //     if (err) return next(err);
  //     if (model.checkForNullError(stone, next, "id: " + stoneId)) return;
  //
  //     let sphere = stone.owner();
  //
  //     const SphereAccess = loopback.getModel('SphereAccess');
  //     SphereAccess.find({where: {and: [{sphereId: sphere.id}, {role: "admin"}]}, include: "user"}, function(err, access) {
  //       if (err) return next(err);
  //
  //       // debug("access", access);
  //       for (let acc of access) {
  //         // debug("acc", acc);
  //         // debug("user", acc.user());
  //         util.sendStoneRecoveredEmail(acc.user(), stone);
  //       }
  //       next();
  //     });
  //
  //     // if (stone) {
  //     // 	util.sendStoneRecoveredEmail(stone, next);
  //     // } else {
  //     // 	error = new Error("no stone found with this id");
  //     // 	return next(error);
  //     // }
  //     // next();
  //   });
  // };

  /************************************
   **** Delete ALL functions
   ************************************/

  // model.remoteMethod(
  //   'notifyOnRecovery',
  //   {
  //     http: {path: '/:id/notifyOnRecovery', verb: 'head'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
  //     ],
  //     description: "Notify admin about stone recovery"
  //   }
  // );

  // model.deleteAllEnergyUsageHistory = function(id, callback) {
  //   debug("deleteAllEnergyUsageHistory");
  //   model.findById(id, function(err, stone) {
  //     if (err) return callback(err);
  //     if (model.checkForNullError(stone, callback, "id: " + id)) return;
  //
  //     stone.energyUsageHistory.destroyAll(function(err) {
  //       stone.currentEnergyUsageId = undefined;
  //       stone.save();
  //       callback(err);
  //     });
  //   })
  // };
  //
  //
  // model.deleteAllPowerUsageHistory = function(id, callback) {
  //   debug("deleteAllPowerUsageHistory");
  //   model.findById(id, function(err, stone) {
  //     if (err) return callback(err);
  //     if (model.checkForNullError(stone, callback, "id: " + id)) return;
  //
  //     stone.powerUsageHistory.destroyAll(function(err) {
  //       stone.currentPowerUsageId = undefined;
  //       stone.save();
  //       callback(err);
  //     });
  //   })
  // };
  //
  // model.deleteAllSwitchStateHistory = function(id, callback) {
  //   debug("deleteAllPowerUsageHistory");
  //   model.findById(id, function(err, stone) {
  //     if (err) return callback(err);
  //     if (model.checkForNullError(stone, callback, "id: " + id)) return;
  //
  //     stone.switchStateHistory.destroyAll(function(err) {
  //       stone.currentSwitchStateId = undefined;
  //       stone.save();
  //       callback(err);
  //     });
  //   })
  // };
  //
  // model.remoteMethod(
  //   'deleteAllEnergyUsageHistory',
  //   {
  //     http: {path: '/:id/deleteAllEnergyUsageHistory', verb: 'delete'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //     ],
  //     description: "Delete all energy usage history of this Stone"
  //   }
  // );
  //
  // model.remoteMethod(
  //   'deleteAllPowerUsageHistory',
  //   {
  //     http: {path: '/:id/deleteAllPowerUsageHistory', verb: 'delete'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //     ],
  //     description: "Delete all power usage history of this Stone"
  //   }
  // );
  //
  // model.remoteMethod(
  //   'deleteAllSwitchStateHistory',
  //   {
  //     http: {path: '/:id/deleteAllSwitchStateHistory', verb: 'delete'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //     ],
  //     description: "Delete all switch state history of this Stone"
  //   }
  // );



  model.setSwitchStateRemotely = function(id, switchState, callback) {
    "use strict";
    debug("setSwitchStateRemotely");
    model.findById(id)
      .then((stone) => {
        if (stone === null) {
          callback("Could not find this stone.");
          return;
        }

        if (stone.sphereId) {
          let sphereModel = loopback.getModel("Sphere");
          sphereModel.findById(stone.sphereId)
            .then((sphere) => {
              if (sphere) {
                EventHandler.command.sendStoneSwitch(stone, switchState, sphere);

                notificationHandler.notifySphereDevices(sphere, {
                  type: 'setSwitchStateRemotely',
                  data:{stoneId: id, sphereId: stone.sphereId, switchState: Math.max(0,Math.min(1,switchState)), command:'setSwitchStateRemotely'},
                  silentAndroid: true,
                  silentIOS: true
                });
              }
              else {
                throw 'No Sphere to notify';
              }
            });
        }

        callback();
      })
      .catch((err) => {
        callback(err);
      });
  };

  model.remoteMethod(
    'setSwitchStateRemotely',
    {
      http: {path: '/:id/setSwitchStateRemotely', verb: 'put'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'switchState', type: 'number', required: true, http: { source : 'query' }},
      ],
      description: 'Set the switchState of a stone.' +
        '\n\nPossible values are between 0 and 1. 0 is off, 1 is on, between is dimming.' +
        '\n\nIf the stone does not support dimming (or is configured that way), anything over 0 is full on.'
    }
  );


  model.getAllAccessibleCrownstones = function(filter, options, next) {
    if (options && options.accessToken) {
      let userId = options.accessToken.userId;
      // get get all sphereIds the user has access to.
      const sphereAccess = loopback.getModel("SphereAccess");

      sphereAccess.find({where: {userId: userId}, fields:{sphereId: true}})
        .then((results) => {
          let possibleIds = [];
          for (let i = 0; i < results.length; i++) {
            possibleIds.push(results[i].sphereId);
          }
          let stoneFilter = {sphereId: {inq: possibleIds}};
          let include = filter && filter.include || {}

          return model.find({where: stoneFilter, include: include})
        })
        .then((results) => {
          next(null, results);
        })
        .catch((err) => {
          next(err);
        })
    }
  };

  model.remoteMethod(
    'getAllAccessibleCrownstones',
    {
      http: {path: '/all/', verb: 'GET'},
      accepts: [
        {arg: 'filter', type: 'any', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[Stone]', root: true},
      description: "Get a list of all Crownstones your account has access to."
    }
  );

  const getHistory = function (historyField, stoneId, from, to, limit, skip, ascending, next, transform = false) {
    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      from = from || new Date(0);
      to = to || new Date();
      limit = Math.min(limit || 1000, 1000);
      skip = skip || 0;


      stone[historyField]({where: {timestamp: {between: [from, to]}}, limit: limit, skip: skip, order: ascending ? 'timestamp ASC' : 'timestamp DESC' })
        .then((result) => {
          if (transform === false) {
            next(null, result);
          }
          else {
            transform(result);
            next(null, result);
          }
        })
        .catch((err) => {
          next(err);
        })
    })
  };

  // model.getPowerUsageHistory = function(stoneId, from, to, limit, skip, ascending, next) {
  //   getHistory('powerUsageHistory', stoneId, from, to, limit, skip, ascending, next);
  // };
  //
  // model.getEnergyUsageHistory = function(stoneId, from, to, limit, skip, ascending, next) {
  //   getHistory('energyUsageHistory', stoneId, from, to, limit, skip, ascending, next);
  // };

  model.getSwitchStateHistory = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('switchStateHistory', stoneId, from, to, limit, skip, ascending, next);
  };

  model.getSwitchStateHistory = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('switchStateHistory', stoneId, from, to, limit, skip, ascending, next, function(results) {
      for (let i = 0; i < results.length; i++) {
        if (results[i].switchState > 1) {
          results[i].switchState = 0.01*results[i].switchState;
        }
      }
    });
  };
  model.getSwitchStateHistoryV2 = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('switchStateHistory', stoneId, from, to, limit, skip, ascending, next);
  };

  model.remoteMethod(
    'getSwitchStateHistoryV2',
    {
      http: {path: '/:id/switchStateHistoryV2/', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
        {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
        {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: '[SwitchState]', root: true},
      description: 'Get an array of the known switch states of the specified Crownstone.' +
        '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
        '\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

  model.remoteMethod(
    'getSwitchStateHistory',
    {
      http: {path: '/:id/switchStateHistory/', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
        {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
        {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: '[SwitchState]', root: true},
      description: 'Get an array of the known switch states of the specified Crownstone.' +
      '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
      '\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

  // model.remoteMethod(
  //   'getEnergyUsageHistory',
  //   {
  //     http: {path: '/:id/energyUsageHistory/', verb: 'GET'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
  //       {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
  //       {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'data', type: '[EnergyUsage]', root: true},
  //     description: 'Get an array of collected energy usage samples from the specified Crownstone.' +
  //     '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
  //     '\nTime is filtered like this: (from <= timestamp <= to).'
  //   }
  // );
  //
  // model.remoteMethod(
  //   'getPowerUsageHistory',
  //   {
  //     http: {path: '/:id/powerUsageHistory/', verb: 'GET'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
  //       {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
  //       {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'data', type: '[PowerUsage]', root: true},
  //     description: 'Get an array of collected power measurement samples from the specified Crownstone.' +
  //     '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
  //     '\nTime is filtered like this: (from <= timestamp <= to).'
  //   }
  // );

  const countHistory = function(historyField, stoneId, from, to, next) {
    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      from = from || new Date(0);
      to = to || new Date();
      stone[historyField].count({timestamp: {between: [from, to]}})
        .then((result) => {
          next(null, {count:result});
        })
        .catch((err) => {
          next(err);
        })
    })
  };

  // model.countPowerUsageHistory = function(stoneId, from, to, next) {
  //   countHistory('powerUsageHistory', stoneId, from, to, next);
  // };
  //
  // model.countEnergyUsageHistory = function(stoneId, from, to, next) {
  //   countHistory('energyUsageHistory', stoneId, from, to, next);
  // };

  model.countSwitchStateHistory = function(stoneId, from, to, next) {
    countHistory('switchStateHistory', stoneId, from, to, next);
  };

  // model.remoteMethod(
  //   'countEnergyUsageHistory',
  //   {
  //     http: {path: '/:id/energyUsageHistory/count', verb: 'GET'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'count', type: 'number', root: true},
  //     description: 'Get the amount of data points in between the from and to times.\nTime is filtered like this: (from <= timestamp <= to).'
  //   }
  // );
  //
  // model.remoteMethod(
  //   'countPowerUsageHistory',
  //   {
  //     http: {path: '/:id/powerUsageHistory/count', verb: 'GET'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'count', type: 'number', root: true},
  //     description: 'Get the amount of data points in between the from and to times.\nTime is filtered like this: (from <= timestamp <= to).'
  //   }
  // );
  //
  // model.remoteMethod(
  //   'countSwitchStateHistory',
  //   {
  //     http: {path: '/:id/switchStateHistory/count', verb: 'GET'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'count', type: 'number', root: true},
  //     description: 'Get the amount of data points in between the from and to times.\nTime is filtered like this: (from <= timestamp <= to).'
  //   }
  // );

  const deleteHistory = function (historyField, stoneId, from, to, next) {
    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      from = from || new Date(0);
      to = to || new Date();

      stone[historyField].destroyAll({timestamp: {between: [from, to]}})
        .then((result) => {
          next(null, {deleted: result});
        })
        .catch((err) => {
          next(err);
        })
    })
  };

  // model.deletePowerUsageHistory = function(stoneId, from, to, next) {
  //   deleteHistory('powerUsageHistory', stoneId, from, to, next);
  // };
  //
  // model.deleteEnergyUsageHistory = function(stoneId, from, to, next) {
  //   deleteHistory('energyUsageHistory', stoneId, from, to, next);
  // };

  model.deleteSwitchStateHistory = function(stoneId, from, to, next) {
    deleteHistory('switchStateHistory', stoneId, from, to, next);
  };

  //
  // model.remoteMethod(
  //   'deleteEnergyUsageHistory',
  //   {
  //     http: {path: '/:id/energyUsageHistory', verb: 'DELETE'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'count', type: 'number', root: true},
  //     description: "Delete all data points in between the from and to times.\n\nTime is filtered like this: (from <= timestamp <= to)."
  //   }
  // );
  //
  // model.remoteMethod(
  //   'deletePowerUsageHistory',
  //   {
  //     http: {path: '/:id/powerUsageHistory', verb: 'DELETE'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
  //       {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
  //     ],
  //     returns: {arg: 'count', type: 'number', root: true},
  //     description: "Delete all data points in between the from and to times.\n\nTime is filtered like this: (from <= timestamp <= to)."
  //   }
  // );


  model.remoteMethod(
    'deleteSwitchStateHistory',
    {
      http: {path: '/:id/switchStateHistory', verb: 'DELETE'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'count', type: 'number', root: true},
      description: "Delete all data points in between the from and to times.\n\nTime is filtered like this: (from <= timestamp <= to)."
    }
  );


  model.setCurrentSwitchState = function(stoneId, switchState, next) {
    debug("setCurrentPowerUsage");

    model.findById(stoneId, {include: "currentSwitchState"})
      .then((stone) => {
        if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

        let currentSwitchState = stone.currentSwitchState()
        if (currentSwitchState === null || switchState !== currentSwitchState.switchState) {
          model._setCurrentSwitchState(stone, {switchState: switchState}, next);
        }
        else {
          next(null);
        }
      })
      .catch((err) => {
        return next(err)
      })
  };

  model._setCurrentSwitchState = function(stone, switchState, next) {
    debug("_setCurrentSwitchState");
    if (switchState.switchState > 0 && switchState.switchState <= 1) {
      switchState.switchState = Math.round(100*switchState.switchState);
    }

    stone.switchStateHistory.create(switchState, function(err, switchStateInstance) {
      if (err) return next(err);

      if (switchStateInstance) {
        stone.currentSwitchStateId = switchStateInstance.id;
        stone.save({blockUpdateEvent:true}, function(err, stoneInstance) {
          EventHandler.dataChange.sendStoneSwitchOccurredBySphereId(stoneInstance.sphereId, stoneInstance, switchState.switchState);

          if (next) {
            if (err) return next(err);
            next(null, switchStateInstance);
          }
        })
      } else {
        return next(new Error("failed to create switch state data point."));
      }
    });
  };

  model.remoteMethod(
    'setCurrentSwitchState',
    {
      http: {path: '/:id/currentSwitchState', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'switchState', type: 'number', required: true, http: { source : 'query' }},
      ],
      description: 'LEGACY: Store the current switchState of a stone. This does not actually switch the Crownstone, it only stores the state.' +
      '\n\nPossible values are between 0 and 1. 0 is off, 1 is on, between is dimming.'
    }
  );

  model.remoteMethod(
    'setCurrentSwitchState',
    {
      http: {path: '/:id/currentSwitchStateV2', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'switchState', type: 'number', required: true, http: { source : 'query' }},
      ],
      description: 'Store the current switchState of a stone. This does not actually switch the Crownstone, it only stores the state.' +
        '\n\nThe value is the percentage the Crownstone is on, which ranges from 0 to 100.'
    }
  );

  function getCurrentSwitchState(stoneId, next, v2 = false) {
    debug("getCurrentSwitchState");
    model.findById(stoneId, { include: "currentSwitchState" })
      .then((stone) => {
        if (!stone) { return Util.unauthorizedError(); }
        let currentSwitchState = stone.currentSwitchState();

        if (currentSwitchState) {
          if (v2 === false && currentSwitchState.switchState > 1) {
            currentSwitchState.switchState = currentSwitchState.switchState * 0.01;
          }
          else if (v2 === true && currentSwitchState.switchState > 0 && currentSwitchState.switchState <= 1) {
            currentSwitchState.switchState = currentSwitchState.switchState * 100;
          }

          return next(null, currentSwitchState);
        }
        else {
          next(null);
        }
      })
      .catch((err) => {
        return next(err);
      })
  };

  model.getCurrentSwitchState = function(stoneId, next) {
    getCurrentSwitchState(stoneId, next, false);
  };

  model.getCurrentSwitchStateV2 = function(stoneId, next) {
    getCurrentSwitchState(stoneId, next, true);
  };

  model.remoteMethod(
    'getCurrentSwitchState',
    {
      http: {path: '/:id/currentSwitchState', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: 'LEGACY: Retreive the last reported switch state of the Crownstone.' +
        '\n\nPossible values are between 0 and 1. 0 is off, 1 is on, between is dimming.',
      returns: {arg: 'data', type: 'SwitchState', root: true},
    }
  );

  model.remoteMethod(
    'getCurrentSwitchStateV2',
    {
      http: {path: '/:id/currentSwitchStateV2', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},

      ],
      description: 'Retreive the last reported switch state of the Crownstone.' +
        '\n\nThe value is the percentage the Crownstone is on, which ranges from 0 to 100.',
      returns: {arg: 'data', type: 'SwitchState', root: true},
    }
  );


  const ABILITY_TYPE = {
    dimming:      "dimming",
    switchcraft:  "switchcraft",
    tapToToggle:  "tapToToggle",
  };

  const ABILITY_PROPERTY_TYPE = {
    dimming:      { softOnSpeed: 'softOnSpeed' },
    switchcraft:  {},
    tapToToggle:  { rssiOffset: 'rssiOffset' },
  };


  /**
   *
   * @param stoneId     string
   * @param data        { ABILITY_TYPE: {enabled: boolean, syncedToCrownstone: boolean, properties: [{type: ABILITY_PROPERTY_TYPE, value: any}]} }
   * @param options
   * @param callback
   */
  model.setAbilities = function(stoneId, data, options, callback) {
    let abilitiesToSet = Object.keys(data);
    for ( let i = 0; i < abilitiesToSet.length; i++) {
      if (ABILITY_TYPE[abilitiesToSet[i]] === undefined) {
        return callback({statusCode: 400, message: "Invalid ability: " + abilitiesToSet[i]})
      }
    }

    const StoneAbilities = loopback.getModel("StoneAbility");
    const StoneAbilityProperties = loopback.getModel("StoneAbilityProperty");

    const createAbility = function(type, abilityData) {
      return StoneAbilities.create({
        type: type,
        enabled: abilityData.enabled,
        syncedToCrownstone: abilityData.syncedToCrownstone,
        stoneId: stoneId,
        sphereId: sphereId,
      })
        .then((newAbility) => {
          let propertyLength = abilityData.properties && abilityData.properties.length || 0;
          if (propertyLength.length > 0) {
            let availableProperties = Object.keys(abilityData.properties);
            for (let i = 0; i < availableProperties.length; i++) {
              let prop = availableProperties[i];
              if (ABILITY_PROPERTY_TYPE[prop.type] !== undefined) {
                StoneAbilityProperties.create({
                  type: prop.type,
                  value: prop.value,
                  abilityId: newAbility.id,
                  sphereId: sphereId,
                });
              }
            }
          }
        })
    }

    const updateAbility = function(type, abilityData, existingAbility) {
      existingAbility.type = type
      existingAbility.enabled = abilityData.enabled;
      existingAbility.syncedToCrownstone = abilityData.syncedToCrownstone;
      existingAbility.updatedAt = abilityData.updatedAt;
      let existingProperties = existingAbility.properties();
      let existingPropertyLength = existingProperties.length || 0;
      return existingAbility.save()
        .then(() => {
          let propertyLength = abilityData.properties && abilityData.properties.length || 0;

          if (propertyLength > 0) {
            // loop over existing ability properties to chech which to add or update.
            for (let i = 0; i < propertyLength; i++) {
              let found = false;
              if (ABILITY_PROPERTY_TYPE[type][abilityData.properties[i].type] === undefined) {
                continue;
              }

              for (let j = 0; j < existingPropertyLength; j++) {
                if (abilityData.properties && abilityData.properties[i].type === existingProperties[j].type) {
                  if (abilityData.properties[i].value !== existingProperties[j].value) {
                    existingProperties[i].value = abilityData.properties[i].value;
                    existingProperties[i].save();
                  }
                  found = true;
                  break;
                }
              }

              if (!found) {
                StoneAbilityProperties.create({
                  type: abilityData.properties[i].type,
                  value: abilityData.properties[i].value,
                  abilityId: existingAbility.id,
                  sphereId: existingAbility.sphereId
                });
              }
            }
          }
        })
    }


    let stone = null;
    let sphereId = null;
    model.findById(stoneId, {fields:{sphereId:1}})
      .then((stoneResult) => {
        if (!stoneResult) { throw {statusCode: 404, message: "No stone with that ID."}}

        stone = stoneResult;
        sphereId = stone.sphereId;

        return StoneAbilities.find({where:{stoneId: stoneId}, include: ["properties"]})
      })
      .then((abilities) => {
        let promises = [];
        if (abilities.length === 0) {
          for (let i = 0; i < abilitiesToSet.length; i++) {
            promises.push(createAbility(abilitiesToSet[i], data[abilitiesToSet[i]]));
          }
        }
        else {
          for (let i = 0; i < abilitiesToSet.length; i++) {
            let found = false;
            for (let j = 0; j < abilities.length; j++) {
              if (abilities[j].type === abilitiesToSet[i]) {
                if (found == true) {
                  // THIS IS A DUPLICATE!
                  StoneAbilities.destroyById(abilities[j].id);
                }
                else {
                  found = true;
                  promises.push(updateAbility(abilitiesToSet[i], data[abilitiesToSet[i]], abilities[j]));
                }
              }
            }
          }
        }
        return Promise.all(promises);
      })
      .then(() => {
        callback();
      })
      .catch((err) => {
        callback(err);
      })
  }

  model.getAbilities = function(stoneId, options, next) {
    const StoneAbilities = loopback.getModel("StoneAbility");

    // hack to only allow the newest app access to the abilities. Will be removed later on.
    Util.deviceIsMinimalVersion(options, "4.1.0")
      .then((result) => {
        if (result) {
          return StoneAbilities.find({where: {stoneId: stoneId}}, {include: "properties"})
            .then((data) => { next(null, data); })
        }
        else {
          next(null,[]);
        }
      })
      .catch((err) => {
        next(err);
      })
  }


  model.remoteMethod(
    'setAbilities',
    {
      http: {path: '/:id/abilities', verb: 'put'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'data', type: 'any', required: true, http: { source : 'body' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: 'Set or update the abilities of this Stone. The format of data here is: \n' +
        '{ ABILITY_TYPE: { enabled: boolean, syncedToCrownstone: boolean, properties: [ { type: ABILITY_PROPERTY_TYPES, value: any} ] } }'
    }
  );

  model.remoteMethod(
    'getAbilities',
    {
      http: {path: '/:id/abilities', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[StoneAbility]', root: true},
      description: 'Get the abilities of this Stone.'
    }
  );

  model.setSwitchStateV2 = function(id, switchData, options, callback) {
    if (switchData && switchData.type && switchData.type !== 'PERCENTAGE' && switchData.type !== "TURN_ON" && switchData.type !== "TURN_OFF") {
      return callback("Type of SwitchData can only be 'PERCENTAGE', 'TURN_ON' or 'TURN_OFF'");
    }

    if (switchData && !switchData.type) {
      return callback("SwitchData have a type: it can only be 'PERCENTAGE', 'TURN_ON' or 'TURN_OFF'");
    }

    if (switchData && switchData.type === "PERCENTAGE" && (switchData.percentage === undefined || (switchData.percentage > 0 && switchData.percentage <=1) || switchData.percentage < 0 || switchData.percentage > 100)) {
      return callback("SwitchData with type PERCENTAGE require a percentage between 0 and 100:" + SwitchDataDefinition);
    }

    if (switchData && switchData.type === "PERCENTAGE" && (switchData.percentage > 0 && switchData.percentage < 10)) {
      return callback("Dimming below 10% is not allowed.");
    }

    let stone = null;
    let sphereModel = loopback.getModel("Sphere");
    model.findById(id)
      .then((stoneResult) => {
        if (!stoneResult) { throw util.unauthorizedError(); }
        stone = stoneResult;

        return sphereModel.findById(stone.sphereId)
      })
      .then((sphere) => {
        if (sphere) {
          let switchStateLegacy = 0;
          switch (switchData.type) {
            case "PERCENTAGE":
              switchStateLegacy = 0.01 * switchData.percentage;
              break;
            case "TURN_ON":
              switchStateLegacy = 1;
              break;
            case "TURN_OFF":
              switchStateLegacy = 0;
              break;
          }

          let ssePacket = EventHandler.command.sendStoneMultiSwitchBySphereId(stone.sphereId, [stone], {stoneId: switchData});

          notificationHandler.notifySphereDevices(sphere, {
            type: 'setSwitchStateRemotely',
            data: {
              event: ssePacket,
              command: 'setSwitchStateRemotely',
              stoneId: id,
              sphereId: stone.sphereId,
              switchState: Math.max(0, Math.min(1, switchStateLegacy))
            },
            silentAndroid: true,
            silentIOS: true
          });
        }
          callback(null);
      })
      .catch((err) => {
        callback(err);
      })
  }


  model.remoteMethod(
    'setSwitchStateV2',
    {
      http: {path: '/:id/switch', verb: 'post'},
      accepts: [
        {arg: 'id',            type: 'any', required: true, http: { source : 'path' }},
        {arg: 'switchData',    type: 'SwitchData',  required:true, http: {source:'body'}},
        {arg: "options",       type: "object", http: "optionsFromRequest"},
      ],
      description: "BETA: Switch Crownstone. Dimming below 10% is not allowed."
    }
  );
};


let SwitchDataDefinition = "{ type: 'PERCENTAGE' | 'TURN_ON' | 'TURN_OFF', percentage?: number }"

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
