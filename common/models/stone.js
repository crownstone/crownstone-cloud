"use strict";

let loopback = require('loopback');
let crypto = require('crypto');

const notificationHandler = require('../../server/modules/NotificationHandler');
const eventHandler = require('../../server/modules/EventHandler');
const debug = require('debug')('loopback:dobots');

let util = require('../../server/emails/util');

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
        "property": "activityLogBatch"
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
  // model.disableRemoteMethodByName('find');
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

  model.disableRemoteMethodByName('prototype.__count__diagnostics');
  model.disableRemoteMethodByName('prototype.__create__diagnostics');
  model.disableRemoteMethodByName('prototype.__findById__diagnostics');
  model.disableRemoteMethodByName('prototype.__destroyById__diagnostics');
  model.disableRemoteMethodByName('prototype.__deleteById__diagnostics');
  model.disableRemoteMethodByName('prototype.__delete__diagnostics');
  model.disableRemoteMethodByName('prototype.__updateById__diagnostics');
  model.disableRemoteMethodByName('prototype.__get__diagnostics');

  model.disableRemoteMethodByName('prototype.__count__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__create__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__findById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__destroyById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__deleteById__powerUsageHistory');
  model.disableRemoteMethodByName('prototype.__get__powerUsageHistory');

  model.disableRemoteMethodByName('prototype.__count__activityLog');
  model.disableRemoteMethodByName('prototype.__create__activityLog');
  model.disableRemoteMethodByName('prototype.__findById__activityLog');
  model.disableRemoteMethodByName('prototype.__updateById__activityLog');
  model.disableRemoteMethodByName('prototype.__destroyById__activityLog');
  model.disableRemoteMethodByName('prototype.__deleteById__activityLog');
  model.disableRemoteMethodByName('prototype.__delete__activityLog');
  model.disableRemoteMethodByName('prototype.__get__activityLog');

  model.disableRemoteMethodByName('prototype.__count__activityRange');
  model.disableRemoteMethodByName('prototype.__create__activityRange');
  model.disableRemoteMethodByName('prototype.__findById__activityRange');
  model.disableRemoteMethodByName('prototype.__updateById__activityRange');
  model.disableRemoteMethodByName('prototype.__destroyById__activityRange');
  model.disableRemoteMethodByName('prototype.__deleteById__activityRange');
  model.disableRemoteMethodByName('prototype.__delete__activityRange');
  model.disableRemoteMethodByName('prototype.__get__activityRange');

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
  model.disableRemoteMethodByName('prototype.__destroyById__switchStateHistory');

  model.disableRemoteMethodByName('prototype.__get__switchStateHistory');


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
  model.observe('after save', enforceUniqueness);

  /************************************
   **** Energy Usage
   ************************************/

  model._setCurrentEnergyUsage = function(stone, energyUsage, next) {

    debug("_setCurrentEnergyUsage");

    // debug("stone:", stone);
    // debug("energyUsage:", energyUsage);
    energyUsage.sphereId = stone.sphereId;
    stone.energyUsageHistory.create(energyUsage, function(err, energyUsageInstance) {
      if (err) return next(err);

      if (energyUsageInstance) {
        stone.currentEnergyUsageId = energyUsageInstance.id;
        stone.save(function(err, stoneInstance) {
          if (next) {
            if (err) return next(err);
            next(null, energyUsageInstance);
          }
        })
      } else {
        return next(new Error("failed to create energyUsage"));
      }
    });

  };

  model.setCurrentEnergyUsage = function(energyUsage, stoneId, next) {
    debug("setCurrentEnergyUsage");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model._setCurrentEnergyUsage(stone, energyUsage, next);
    })

  };

  model.remoteMethod(
    'setCurrentEnergyUsage',
    {
      http: {path: '/:id/currentEnergyUsage/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: 'EnergyUsage', required: true, 'http': {source: 'body'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      returns: {arg: 'data', type: 'EnergyUsage', root: true},
      description: "Add current energy usage of the stone"
    }
  );

  /************************************
   **** Power Usage
   ************************************/

  model._setCurrentPowerUsage = function(stone, powerUsage, next) {

    debug("_setCurrentPowerUsage");

    // debug("stone:", stone);
    // debug("powerUsage:", powerUsage);

    powerUsage.sphereId = stone.sphereId;

    stone.powerUsageHistory.create(powerUsage, function(err, powerUsageInstance) {
      if (err) return next(err);

      if (powerUsageInstance) {
        stone.currentPowerUsageId = powerUsageInstance.id;

        stone.save(function(err, stoneInstance) {
          if (next) {
            if (err) return next(err);
            next(null, powerUsageInstance);
          }
        })
      } else {
        return next(new Error("failed to create powerUsage"));
      }
    });

  };

  model.setCurrentPowerUsage = function(powerUsage, stoneId, next) {
    debug("setCurrentPowerUsage");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model._setCurrentPowerUsage(stone, powerUsage, next);
    })

  };

  model.remoteMethod(
    'setCurrentPowerUsage',
    {
      http: {path: '/:id/currentPowerUsage/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: 'PowerUsage', required: true, http: {source: 'body'}},
        {arg: 'id', type: 'any', required: true, http: {source: 'path'}}
      ],
      returns: {arg: 'data', type: 'PowerUsage', root: true},
      description: "Add current power usage of the stone"
    }
  );


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

          // get the most recent timestamp in the batch that we have uploaded
          let mostRecentId = null;
          let mostRecentEntry = null;
          let mostRecentTimestamp = 0;
          if (Array.isArray(insertResult)) {
            for (let i = 0; i < insertResult.length; i++) {
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

          const insertMostRecent = (currentId, mostRecentEntry) => {
            let eventName = null;
            switch (fieldName) {
              case 'powerUsage':
                eventName = 'setCurrentPowerUsage'; break;
              case 'energyUsage':
                eventName = 'setCurrentEnergyUsage'; break;
            }

            if (eventName) {
              eventHandler.notifyHooks(model, stoneId, mostRecentEntry, eventName)
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

  model.setBatchPowerUsage = function(powerUsageArray, stoneId, next) {
    batchSetHistory('powerUsage', powerUsageArray, stoneId, next);
  };

  model.setBatchEnergyUsage = function(energyUsageArray, stoneId, next) {
    batchSetHistory('energyUsage', energyUsageArray, stoneId, next);
  };

  model.remoteMethod(
    'setBatchEnergyUsage',
    {
      http: {path: '/:id/batchEnergyUsage/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: ['EnergyUsage'], required: true, http: {source: 'body'}},
        {arg: 'id', type: 'any', required: true, http: {source: 'path'}}
      ],
      returns: {arg: 'data', type: ['EnergyUsage'], root: true},
      description: "Add array of energy usage measurements to the stone."
    }
  );

  model.remoteMethod(
    'setBatchPowerUsage',
    {
      http: {path: '/:id/batchPowerUsage/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: ['PowerUsage'], required: true, http: {source: 'body'}},
        {arg: 'id', type: 'any', required: true, http: {source: 'path'}}
      ],
      returns: {arg: 'data', type: ['PowerUsage'], root: true},
      description: "Add an array of power usage measurements to the stone."
    }
  );

  /************************************
   **** Appliance
   ************************************/

  model.setAppliance = function(stoneId, applianceId, next) {
    debug("setAppliance");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      stone.applianceId = applianceId;
      stone.save(function (err) {
        if (err) return next(err);
        next();
      });
    });
  };

  model.remoteMethod(
    'setAppliance',
    {
      http: {path: '/:id/appliance/:fk', verb: 'PUT'},
      accepts: [
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}},
        {arg: 'fk', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Link appliance to stone."
    }
  );

  model.removeAppliance = function(stoneId, applianceId, next) {
    debug("removeAppliance");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      stone.applianceId = undefined;
      stone.save(function(err) {
        if (err) return next(err);
        next();
      });
    });

  };

  model.remoteMethod(
    'removeAppliance',
    {
      http: {path: '/:id/appliance/:fk', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}},
        {arg: 'fk', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Unlink appliance from stone"
    }
  );

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

  model.deleteAllEnergyUsageHistory = function(id, callback) {
    debug("deleteAllEnergyUsageHistory");
    model.findById(id, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.energyUsageHistory.destroyAll(function(err) {
        stone.currentEnergyUsageId = undefined;
        stone.save();
        callback(err);
      });
    })
  };


  model.deleteAllPowerUsageHistory = function(id, callback) {
    debug("deleteAllPowerUsageHistory");
    model.findById(id, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.powerUsageHistory.destroyAll(function(err) {
        stone.currentPowerUsageId = undefined;
        stone.save();
        callback(err);
      });
    })
  };

  model.deleteAllSwitchStateHistory = function(id, callback) {
    debug("deleteAllPowerUsageHistory");
    model.findById(id, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.switchStateHistory.destroyAll(function(err) {
        stone.currentSwitchStateId = undefined;
        stone.save();
        callback(err);
      });
    })
  };
  model.deleteAllDiagnosticHistory = function(id, callback) {
    debug("deleteAllDiagnosticHistory");
    model.findById(id, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.diagnostics.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllEnergyUsageHistory',
    {
      http: {path: '/:id/deleteAllEnergyUsageHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all energy usage history of this Stone"
    }
  );

  model.remoteMethod(
    'deleteAllPowerUsageHistory',
    {
      http: {path: '/:id/deleteAllPowerUsageHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all power usage history of this Stone"
    }
  );

  model.remoteMethod(
    'deleteAllSwitchStateHistory',
    {
      http: {path: '/:id/deleteAllSwitchStateHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all switch state history of this Stone"
    }
  );

  model.remoteMethod(
    'deleteAllDiagnosticHistory',
    {
      http: {path: '/:id/deleteAllDiagnosticHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all switch state history of this Stone"
    }
  );



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


  model.getAllAccessibleCrownstones = function(options, next) {
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
          let filter = {sphereId: {inq: possibleIds}};

          return model.find({where: filter})
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
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[Stone]', root: true},
      description: "Get a list of all Crownstones your account has access to."
    }
  );

  const getHistory = function (historyField, stoneId, from, to, limit, skip, ascending, next) {
    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      from = from || new Date(0);
      to = to || new Date();
      limit = Math.min(limit || 1000, 1000);
      skip = skip || 0;


      stone[historyField]({where: {timestamp: {between: [from, to]}}, limit: limit, skip: skip, order: ascending ? 'timestamp ASC' : 'timestamp DESC' })
        .then((result) => {
          next(null, result);
        })
        .catch((err) => {
          next(err);
        })
    })
  };

  model.getPowerUsageHistory = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('powerUsageHistory', stoneId, from, to, limit, skip, ascending, next);
  };

  model.getEnergyUsageHistory = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('energyUsageHistory', stoneId, from, to, limit, skip, ascending, next);
  };

  model.getSwitchStateHistory = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('switchStateHistory', stoneId, from, to, limit, skip, ascending, next);
  };
  model.getDiagnosticsHistory = function(stoneId, from, to, limit, skip, ascending, next) {
    getHistory('diagnostics', stoneId, from, to, limit, skip, ascending, next);
  };

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

  model.remoteMethod(
    'getEnergyUsageHistory',
    {
      http: {path: '/:id/energyUsageHistory/', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
        {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
        {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: '[EnergyUsage]', root: true},
      description: 'Get an array of collected energy usage samples from the specified Crownstone.' +
      '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
      '\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

  model.remoteMethod(
    'getPowerUsageHistory',
    {
      http: {path: '/:id/powerUsageHistory/', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
        {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
        {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: '[PowerUsage]', root: true},
      description: 'Get an array of collected power measurement samples from the specified Crownstone.' +
      '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
      '\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

  model.remoteMethod(
    'getDiagnosticsHistory',
    {
      http: {path: '/:id/diagnosticsHistory/', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'limit', type: 'number', required: false, default: 1000, http: { source : 'query' }},
        {arg: 'skip', type: 'number', required: false, default: 0, http: { source : 'query' }},
        {arg: 'ascending', type: 'boolean', required: true, default: true, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: '[Diagnostic]', root: true},
      description: 'Get an array of the gathered statistics of the specified Crownstone.' +
      '\nLimit indicates the maximum amount of samples, it cannot currently be larger than 1000 (default).' +
      '\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

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

  model.countPowerUsageHistory = function(stoneId, from, to, next) {
    countHistory('powerUsageHistory', stoneId, from, to, next);
  };

  model.countEnergyUsageHistory = function(stoneId, from, to, next) {
    countHistory('energyUsageHistory', stoneId, from, to, next);
  };

  model.countSwitchStateHistory = function(stoneId, from, to, next) {
    countHistory('switchStateHistory', stoneId, from, to, next);
  };

  model.remoteMethod(
    'countEnergyUsageHistory',
    {
      http: {path: '/:id/energyUsageHistory/count', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'count', type: 'number', root: true},
      description: 'Get the amount of data points in between the from and to times.\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

  model.remoteMethod(
    'countPowerUsageHistory',
    {
      http: {path: '/:id/powerUsageHistory/count', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'count', type: 'number', root: true},
      description: 'Get the amount of data points in between the from and to times.\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

  model.remoteMethod(
    'countSwitchStateHistory',
    {
      http: {path: '/:id/switchStateHistory/count', verb: 'GET'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'count', type: 'number', root: true},
      description: 'Get the amount of data points in between the from and to times.\nTime is filtered like this: (from <= timestamp <= to).'
    }
  );

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

  model.deletePowerUsageHistory = function(stoneId, from, to, next) {
    deleteHistory('powerUsageHistory', stoneId, from, to, next);
  };

  model.deleteEnergyUsageHistory = function(stoneId, from, to, next) {
    deleteHistory('energyUsageHistory', stoneId, from, to, next);
  };

  model.deleteSwitchStateHistory = function(stoneId, from, to, next) {
    deleteHistory('switchStateHistory', stoneId, from, to, next);
  };


  model.remoteMethod(
    'deleteEnergyUsageHistory',
    {
      http: {path: '/:id/energyUsageHistory', verb: 'DELETE'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'count', type: 'number', root: true},
      description: "Delete all data points in between the from and to times.\n\nTime is filtered like this: (from <= timestamp <= to)."
    }
  );

  model.remoteMethod(
    'deletePowerUsageHistory',
    {
      http: {path: '/:id/powerUsageHistory', verb: 'DELETE'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'from', type: 'date', default: new Date(new Date().valueOf() - 24*7*3600*1000), required: false, http: { source : 'query' }},
        {arg: 'to', type: 'date', default: new Date(new Date().valueOf() + 24*3600*1000), required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'count', type: 'number', root: true},
      description: "Delete all data points in between the from and to times.\n\nTime is filtered like this: (from <= timestamp <= to)."
    }
  );


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

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model._setCurrentSwitchState(stone, {switchState: switchState}, next);
    })

  };

  model._setCurrentSwitchState = function(stone, switchState, next) {
    debug("_setCurrentSwitchState");
    stone.switchStateHistory.create(switchState, function(err, switchStateInstance) {
      if (err) return next(err);

      if (switchStateInstance) {
        stone.currentSwitchStateId = switchStateInstance.id;
        stone.save(function(err, stoneInstance) {
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
      description: 'Store the current switchState of a stone. This does not actually switch the Crownstone, it only stores the state.' +
      '\n\nPossible values are between 0 and 1. 0 is off, 1 is on, between is dimming.'
    }
  );


  model.setDiagnostics = function(stoneId, diagnosticData, next) {
    debug("setDiagnostics");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      diagnosticData.stoneId = stoneId;
      diagnosticData.sphereId = stone.sphereId;

      stone.diagnostics.create(diagnosticData, function(err, instance) {
        if (err) return next(err);
        next(null, instance);
      });
    })
  };

  model.remoteMethod(
    'setDiagnostics',
    {
      http: {path: '/:id/diagnostics', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'data', type: 'Diagnostic', required: true, http: { source : 'body' }},
      ],
      returns: {arg: 'data', type: 'Diagnostic', root: true},
      description: 'Store diagnostic information about this Crownstone'
    }
  );


  model.activityLogBatch = function(stoneId, batchOfLogs, timestamp, options, next) {
    let dt = new Date().valueOf() - ((timestamp || 0)+50); // assuming a bit of travel time, say 50ms, this can be used to correct the activity log times across phones.
    if (Math.abs(dt) < 1000) {
      dt = 0;
    }

    if (!Array.isArray(batchOfLogs)) {
      batchOfLogs = [batchOfLogs];
    }

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      if (timestamp && timestamp > 0 && dt !== 0) {
        for (let i = 0; i < batchOfLogs.length; i++) {
          if (batchOfLogs[i].timestamp) {
            // map the time to cloud time.
            batchOfLogs[i].timestamp += dt;
          }
        }
      }

      // create the new data in the database
      stone.activityLog.create(batchOfLogs)
        .then((insertResult) => {
          next(null, insertResult)
        })
        .catch((err) => {
          next(err);
        })
    })
  }

  model.remoteMethod(
    'activityLogBatch',
    {
      http: {path: '/:id/activityLogBatch', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'data', type: '[ActivityLog]', required: true, http: { source : 'body' }},
        {arg: 'timestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[ActivityLog]', root: true},
      description: 'Store activity logs for this Crownstone'
    }
  );

  model.getActivityLogs = function(stoneId, yourTimestamp, excludeUserId, sinceTimestamp, options, next) {
    let dt = new Date().valueOf() - ((yourTimestamp || 0)+50); // assuming a bit of travel time, say 50ms, this can be used to correct the activity log times across phones.
    if (Math.abs(dt) < 1000) {
      dt = 0;
    }

    let activityLogModel = loopback.getModel("ActivityLog")
    let query = {where: {and: [{stoneId:stoneId}]}};
    if (excludeUserId)  { query.where.and.push({userId:    {neq: excludeUserId}});  }
    if (sinceTimestamp) { query.where.and.push({timestamp: {gte: sinceTimestamp}}); }
    activityLogModel.find(query)
      .then((data) => {
        if (yourTimestamp && yourTimestamp > 0 && dt !== 0) {
          for (let i = 0; i < data.length; i++) {
            // map the time to phone time
            data[i].timestamp -= dt;
          }
        }
        next(null, data)
      })
      .catch((err) => {
        next(err);
      })

  }

  model.remoteMethod(
    'getActivityLogs',
    {
      http: {path: '/:id/activityLogs', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'yourTimestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: 'excludeUserId', type: 'string', required: false, http: { source : 'query' }},
        {arg: 'sinceTimestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[ActivityLog]', root: true},
      description: 'Get last activity logs for this Crownstone'
    }
  );



  model.remoteMethod(
    'getActivityRanges',
    {
      http: {path: '/:id/activityRanges', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'yourTimestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: 'excludeUserId', type: 'string', required: false, http: { source : 'query' }},
        {arg: 'sinceTimestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[ActivityRange]', root: true},
      description: 'Get last activity ranges for this Crownstone'
    }
  );

  model.remoteMethod(
    'activityRangeBatchCreate',
    {
      http: {path: '/:id/activityRangeBatch', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'data', type: '[ActivityRange]', required: true, http: { source : 'body' }},
        {arg: 'timestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[ActivityRange]', root: true},
      description: 'Get last activity ranges for this Crownstone'
    }
  );

  model.remoteMethod(
    'activityRangeBatchUpdate',
    {
      http: {path: '/:id/activityRangeBatch', verb: 'put'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'data', type: '[ActivityRange]', required: true, http: { source : 'body' }},
        {arg: 'timestamp', type: 'number', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: 'Get last activity ranges for this Crownstone'
    }
  );


  model.getActivityRanges = function(stoneId, yourTimestamp, excludeUserId, sinceTimestamp, options, next) {
    let dt = new Date().valueOf() - ((yourTimestamp || 0)+50); // assuming a bit of travel time, say 50ms, this can be used to correct the activity log times across phones.
    if (Math.abs(dt) < 1000) {
      dt = 0;
    }

    console.log("sinceTimestamp",sinceTimestamp)

    let activityRangeModel = loopback.getModel("ActivityRange")
    let query = {where: {and: [{stoneId:stoneId}]}};
    if (excludeUserId)  { query.where.and.push({userId:  {neq: excludeUserId}});  }
    if (sinceTimestamp) { query.where.and.push({or:     [{lastDirectTime: {gte:sinceTimestamp}}, {lastMeshTime: {gte:sinceTimestamp}}]}); }
    activityRangeModel.find(query)
      .then((data) => {
        if (yourTimestamp && yourTimestamp > 0 && dt !== 0) {
          for (let i = 0; i < data.length; i++) {
            // map the time to phone time
            data[i].startTime -= dt;
            if (data[i].lastDirectTime) { data[i].lastDirectTime -= dt; }
            if (data[i].lastMeshTime)   { data[i].lastMeshTime   -= dt; }
          }
        }
        next(null, data)
      })
      .catch((err) => {
        next(err);
      })

  }

  model.activityRangeBatchCreate = function(stoneId, batchOfRanges, timestamp, options, next) {
    let dt = new Date().valueOf() - ((timestamp || 0)+50); // assuming a bit of travel time, say 50ms, this can be used to correct the activity log times across phones.
    if (Math.abs(dt) < 1000) {
      dt = 0;
    }

    if (!Array.isArray(batchOfRanges)) {
      batchOfRanges = [batchOfRanges];
    }

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      if (timestamp && timestamp > 0 && dt !== 0) {
        for (let i = 0; i < batchOfRanges.length; i++) {
          batchOfRanges[i].startTime += dt;
          if (batchOfRanges[i].lastDirectTime) { batchOfRanges[i].lastDirectTime += dt; }
          if (batchOfRanges[i].lastMeshTime)   { batchOfRanges[i].lastMeshTime   += dt; }
        }
      }

      // create the new data in the database
      stone.activityRange.create(batchOfRanges)
        .then((insertResult) => {
          next(null, insertResult)
        })
        .catch((err) => {
          next(err);
        })
    })
  }

  model.activityRangeBatchUpdate = function(stoneId, batchOfRanges, timestamp, options, next) {
    let dt = new Date().valueOf() - ((timestamp || 0)+50); // assuming a bit of travel time, say 50ms, this can be used to correct the activity log times across phones.
    if (Math.abs(dt) < 1000) {
      dt = 0;
    }

    if (!Array.isArray(batchOfRanges)) {
      batchOfRanges = [batchOfRanges];
    }

    let activityRangeModel = loopback.getModel("ActivityRange")
    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      let idArray = [];
      let batchMap = {}
      for (let i = 0; i < batchOfRanges.length; i++) {
        idArray.push(batchOfRanges[i].id)
        batchMap[batchOfRanges[i].id] = batchOfRanges[i];
      }

      // create the new data in the database
      activityRangeModel.find({where:{id:{inq:idArray}}})
        .then((res) => {
          if (res.length > 0) {
            for (let i = 0; i < res.length; i++) {
              let item = res[i];
              let updatedItem = batchMap[item.id];
              if (item.count !== updatedItem.count) {
                item.count = updatedItem.count;
                if (updatedItem.lastDirectTime) {
                  item.lastDirectTime = updatedItem.lastDirectTime + dt;
                }
                if (updatedItem.lastMeshTime) {
                  item.lastMeshTime = updatedItem.lastMeshTime + dt;
                }
                item.switchedToState = updatedItem.switchedToState;
                item.delayInCommand  = updatedItem.delayInCommand;
                item.save();
              }
            }
          }
          next(null)
        })
        .catch((err) => {
          next(err);
        })
    })
  }

};


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
