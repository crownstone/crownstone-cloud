// "use strict";

let stl = require('../../server/middleware/stoneScanToLocation');
let loopback = require('loopback');
let crypto = require('crypto');

const notificationHandler = require('../../server/modules/NotificationHandler');
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
    //   		- scans
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
        "property": "__destroyById__scans"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__scans"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__powerUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__powerUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__energyUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__energyUsageHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__powerCurveHistory"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__powerCurveHistory"
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
        "property": "notifyOnRecovery"
      }
    );
  }


  // address has to be unique to a stone
  model.validatesUniquenessOf('address', {scopedTo: ['sphereId'], message: 'a stone with this address was already added!'});
  model.validatesUniquenessOf('uid', {scopedTo: ['sphereId'], message: 'a stone with this uid was already added'});
  model.validatesUniquenessOf('major', {scopedTo: ['sphereId', 'minor'], message: 'a stone with this major minor combination was already added'});

  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('createChangeStream');

  model.disableRemoteMethodByName('prototype.__updateById__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__link__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__unlink__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__exists__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__findById__coordinatesHistory');

  model.disableRemoteMethodByName('prototype.__create__locations');
  model.disableRemoteMethodByName('prototype.__delete__locations');
  model.disableRemoteMethodByName('prototype.__updateById__locations');
  model.disableRemoteMethodByName('prototype.__deleteById__locations');
  model.disableRemoteMethodByName('prototype.__destroyById__locations');

  // do we need these? since it is historical data, it should not be updateable once it is uploaded?
  model.disableRemoteMethodByName('prototype.__updateById__scans');
  model.disableRemoteMethodByName('prototype.__updateById__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__updateById__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__updateById__powerCurveHistory');
  model.disableRemoteMethodByName('prototype.__updateById__powerUsageHistory');

  model.disableRemoteMethodByName('prototype.__delete__scans');
  model.disableRemoteMethodByName('prototype.__delete__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__delete__energyUsageHistory');
  model.disableRemoteMethodByName('prototype.__delete__powerCurveHistory');
  model.disableRemoteMethodByName('prototype.__delete__powerUsageHistory');

  function initStone(ctx, next) {
    debug("initStone");
    // debug("ctx", ctx);

    if (ctx.instance) {
      injectMajorMinor(ctx.instance);
      injectUID(ctx.instance, next);
    } else {
      // injectMajorMinor(ctx.data);
      // injectUID(ctx.data, next);
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
      model.find({where: {sphereId: item.sphereId}, order: "uid DESC", limit: "1"}, function(err, instances) {
        if (err) return next(err);

        if (instances.length > 0) {
          let stone = instances[0];
          item.uid = stone.uid + 1;
        } else {
          item.uid = 1;
        }
        // debug("uid:", item.uid);
        next();
      })
    } else {
      next();
    }
  }

  // populate some of the elements like uid, major, minor, if not already provided
  model.observe('before save', initStone);

  model.findLocation = function(stoneAddress, callback) {
    model.find({where: {address: stoneAddress}, include: {locations: 'name'}}, function(err, stones) {
      if (stones.length > 0 && stones[0].locations.length > 0) {
        // debug('found location: ' + JSON.stringify(stones[0].locations));
        callback(null, stones[0].locations);
      } else {
        return callback(new Error("no stone found with address: " + stoneAddress));
      }
    });
  };

  model.remoteMethod(
    'findLocation',
    {
      http: {path: '/findLocation', verb: 'get'},
      accepts: {arg: 'address', type: 'string'},
      returns: {arg: 'location', type: 'object'},
      description: "Find the location of the stone by address"
    }
  );

  model.afterRemote('*.__create__scans', function(ctx, instance, next) {
    next();
  });

  /************************************
   **** Coordinate
   ************************************/

  model.setCurrentCoordinate = function(stone, coordinate, next) {

    debug("setCurrentCoordinate");

    stone.coordinatesHistory.create(coordinate, function(err, coordinateInstance) {
      if (err) return next(err);

      if (coordinateInstance) {
        stone.currentCoordinateId = coordinateInstance.id;

        stone.save(function(err, stoneInstance) {
          if (next) {
            if (err) return next(err);
            next(null, coordinateInstance);
          }
        })
      } else {
        return next(new Error("failed to create coordinate"));
      }
    });

  };

  model.remoteSetCurrentCoordinate = function(coordinate, stoneId, next) {
    debug("remoteSetCurrentCoordinate");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model.setCurrentCoordinate(stone, coordinate, next);
    })

  };

  model.remoteMethod(
    'remoteSetCurrentCoordinate',
    {
      http: {path: '/:id/currentCoordinate/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: 'Coordinate', required: true, 'http': {source: 'body'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      returns: {arg: 'data', type: 'Coordinate', root: true},
      description: "Add current coordinate of the stone"
    }
  );

  /************************************
   **** Energy Usage
   ************************************/

  model.setCurrentEnergyUsage = function(stone, energyUsage, next) {

    debug("setCurrentEnergyUsage");

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

  model.remoteSetCurrentEnergyUsage = function(energyUsage, stoneId, next) {
    debug("remoteSetCurrentEnergyUsage");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model.setCurrentEnergyUsage(stone, energyUsage, next);
    })

  };

  model.remoteMethod(
    'remoteSetCurrentEnergyUsage',
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

  model.setCurrentPowerUsage = function(stone, powerUsage, next) {

    debug("setCurrentPowerUsage");

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

  model.remoteSetCurrentPowerUsage = function(powerUsage, stoneId, next) {
    debug("remoteSetCurrentPowerUsage");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model.setCurrentPowerUsage(stone, powerUsage, next);
    })

  };

  model.remoteMethod(
    'remoteSetCurrentPowerUsage',
    {
      http: {path: '/:id/currentPowerUsage/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: 'PowerUsage', required: true, 'http': {source: 'body'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      returns: {arg: 'data', type: 'PowerUsage', root: true},
      description: "Add current power usage of the stone"
    }
  );

  /************************************
   **** Power Curve
   ************************************/

  model.setCurrentPowerCurve = function(stone, powerCurve, next) {

    debug("setCurrentPowerCurve");

    // debug("stone:", stone);
    // debug("powerCurve:", powerCurve);

    powerCurve.sphereId = stone.sphereId;

    stone.powerCurveHistory.create(powerCurve, function(err, powerCurveInstance) {
      if (err) return next(err);

      if (powerCurveInstance) {
        stone.currentPowerCurveId = powerCurveInstance.id;

        stone.save(function(err, stoneInstance) {
          if (next) {
            if (err) return next(err);
            next(null, powerCurveInstance);
          }
        })
      } else {
        return next(new Error("failed to create powerCurve"));
      }
    });

  };

  model.remoteSetCurrentPowerCurve = function(powerCurve, stoneId, next) {
    debug("remoteSetCurrentPowerCurve");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      model.setCurrentPowerCurve(stone, powerCurve, next);
    })

  };

  model.remoteMethod(
    'remoteSetCurrentPowerCurve',
    {
      http: {path: '/:id/currentPowerCurve/', verb: 'POST'},
      accepts: [
        {arg: 'data', type: 'PowerCurve', required: true, 'http': {source: 'body'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      returns: {arg: 'data', type: 'PowerCurve', root: true},
      description: "Add current power curve of the stone"
    }
  );

  /************************************
   **** Appliance
   ************************************/

  // function removeApplianceFromStone(stone, applianceId, next) {

  // 	const Appliance = loopback.getModel('Appliance');
  // 	Appliance.findById(applianceId, function(err, appliance) {
  // 		if (err) return next(err);
  // 		if (Appliance.checkForNullError(appliance, next, "id: " + applianceId)) return;

  // 		stone.applianceId = undefined;
  // 		stone.save();

  // 		if (!appliance) {
  // 			// this is not necessarily a fatal error, could happen
  // 			// if the appliance was deleted but stone still has the link
  // 			// if a new appliance should be added we don't care if the
  // 			// stone can't be removed from the old one because it was not
  // 			// found
  // 			debug("no appliance found with id");
  // 			return next();
  // 		} else {
  // 			appliance.stones.remove(stone, function(err) {
  // 				if (err) return next(err);
  // 				next();
  // 			});
  // 		}
  // 	});
  // }

  // function addApplianceToStone(stone, applianceId, next) {

  // 	const Appliance = loopback.getModel('Appliance');
  // 	Appliance.findById(applianceId, function(err, appliance) {
  // 		if (err) return next(err);
  // 		if (Appliance.checkForNullError(appliance, next, "id: " + applianceId)) return;

  // 		stone.applianceId = applianceId;
  // 		stone.save(function(err) {
  // 			if (err) return next(err);
  // 			next();
  // 		});
  // 		// appliance.stones.add(stone, function(err) {
  // 		// 	if (err) return next(err);
  // 		// 	next();
  // 		// });
  // 	});
  // }

  model.remoteSetAppliance = function(stoneId, applianceId, next) {
    debug("remoteSetAppliance");

    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      stone.applianceId = applianceId;
      stone.save(function(err) {
        if (err) return next(err);
        next();
      });
      // if (stone.applianceId) {
      // 	removeApplianceFromStone(stone, stone.applianceId, function(err) {
      // 		if (err) return next(err);
      // 		addApplianceToStone(stone, applianceId, next);
      // 	})
      // } else {
      // 	addApplianceToStone(stone, applianceId, next);
      // }
    });

  };

  model.remoteMethod(
    'remoteSetAppliance',
    {
      http: {path: '/:id/appliance/:fk', verb: 'PUT'},
      accepts: [
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}},
        {arg: 'fk', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Link appliance to stone"
    }
  );

  model.remoteRemoveAppliance = function(stoneId, applianceId, next) {
    debug("remoteRemoveAppliance");

    const Appliance = loopback.getModel('Appliance');
    model.findById(stoneId, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      stone.applianceId = undefined;
      stone.save(function(err) {
        if (err) return next(err);
        next();
      });

      // removeApplianceFromStone(stone, applianceId, function(err) {
      // 	if (err) return next(err);
      // 	next();
      // });
    });

  };

  model.remoteMethod(
    'remoteRemoveAppliance',
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

  model.notifyOnRecovery = function(stoneId, next) {
    debug("notifyOnRecovery");

    model.findById(stoneId, {include: "owner"}, function(err, stone) {
      if (err) return next(err);
      if (model.checkForNullError(stone, next, "id: " + stoneId)) return;

      let sphere = stone.owner();

      const SphereAccess = loopback.getModel('SphereAccess');
      SphereAccess.find({where: {and: [{sphereId: sphere.id}, {role: "admin"}]}, include: "user"}, function(err, access) {
        if (err) return next(err);

        // debug("access", access);
        for (let acc of access) {
          // debug("acc", acc);
          // debug("user", acc.user());
          util.sendStoneRecoveredEmail(acc.user(), stone);
        }
        next();
      });

      // if (stone) {
      // 	util.sendStoneRecoveredEmail(stone, next);
      // } else {
      // 	error = new Error("no stone found with this id");
      // 	return next(error);
      // }
      // next();
    });

  };

  /************************************
   **** Delete ALL functions
   ************************************/

  model.remoteMethod(
    'notifyOnRecovery',
    {
      http: {path: '/:id/notifyOnRecovery', verb: 'head'},
      accepts: [
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Notify admin about stone recovery"
    }
  );

  model.deleteCoordinatesHistory = function(id, callback) {
    debug("deleteCoordinatesHistory");
    model.findById(id, {include: "coordinatesHistory"}, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.coordinatesHistory.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteCoordinatesHistory',
    {
      http: {path: '/:id/deleteCoordinatesHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete coordinates history of Stone"
    }
  );

  model.deleteEnergyUsageHistory = function(id, callback) {
    debug("deleteEnergyUsageHistory");
    model.findById(id, {include: "energyUsageHistory"}, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.energyUsageHistory.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteEnergyUsageHistory',
    {
      http: {path: '/:id/deleteEnergyUsageHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete energy usage history of Stone"
    }
  );

  model.deletePowerUsageHistory = function(id, callback) {
    debug("deletePowerUsageHistory");
    model.findById(id, {include: "powerUsageHistory"}, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.powerUsageHistory.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deletePowerUsageHistory',
    {
      http: {path: '/:id/deletePowerUsageHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete power usage history of Stone"
    }
  );

  model.deletePowerCurveHistory = function(id, callback) {
    debug("deletePowerCurveHistory");
    model.findById(id, {include: "powerCurveHistory"}, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.powerCurveHistory.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deletePowerCurveHistory',
    {
      http: {path: '/:id/deletePowerCurveHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete power curve history of Stone"
    }
  );

  model.deleteAllScans = function(id, callback) {
    debug("deleteAllScans");
    model.findById(id, {include: "scans"}, function(err, stone) {
      if (err) return callback(err);
      if (model.checkForNullError(stone, callback, "id: " + id)) return;

      stone.scans.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllScans',
    {
      http: {path: '/:id/deleteAllScans', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: 'Delete all scans of Stone'
    }
  );


  model.setSwitchStateRemotely = function(id, switchState, switchStateUpdatedAt, updatedAt, callback) {
    "use strict";
    debug("setSwitchStateRemotely");
    model.findById(id)
      .then((stone) => {
        if (stone === null) {
          callback("Could not find this stone.");
          return;
        }
        if (!switchStateUpdatedAt) {
          switchStateUpdatedAt = new Date();
        }

        stone.switchStateUpdatedAt = switchStateUpdatedAt;
        stone.switchState = Math.max(0,Math.min(1, switchState));

        if (updatedAt) {
          stone.updatedAt = updatedAt;
        }

        if (stone.sphereId) {
          let sphereModel = loopback.getModel("Sphere");
          sphereModel.findById(stone.sphereId)
            .then((sphere) => {
              if (sphere) {
                notificationHandler.notify(sphere);
              }
              else {
                throw 'No Sphere to notify';
              }
            });
        }

        return stone.save();
      })
      .then((stoneInstance) => {
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
        {arg: 'switchStateUpdatedAt', type: 'date', required: false, http: { source : 'query' }},
        {arg: 'updatedAt', type: 'date', required: false, http: { source : 'query' }},
      ],
      description: "Set the switchState of a stone. Possible values are between 0 and 1. 0 is off, 1 is on, between is dimming. If the stone does not support dimming (or is configured that way), anything over 0 is full on."
    }
  );
};
