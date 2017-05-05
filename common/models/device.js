// "use strict";

let stl = require('../../server/middleware/deviceScanToLocation');
let loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    });
    //***************************
    // AUTHENTICATED:
    //   - create new device
    //***************************
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": "create"
    });
    //***************************
    // OWNER:
    //   - everything
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$owner",
      "permission": "ALLOW"
    });
    //***************************
    // LIB-USER:
    //   - nothing except:
    //   	- findOne
    //   	- create scans
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "lib-user",
      "permission": "DENY"
    });
    model.settings.acls.push({
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "lib-user",
      "permission": "ALLOW",
      "property": "__create__scans"
    });
  }

  // address has to be unique to a stone
  // model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

  model.disableRemoteMethodByName('prototype.__updateById__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__link__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__unlink__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__exists__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__findById__coordinatesHistory');
  model.disableRemoteMethodByName('prototype.__delete__coordinatesHistory');

  model.disableRemoteMethodByName('prototype.__updateById__locationsHistory');
  // model.disableRemoteMethodByName('prototype.__create__locationsHistory');
  model.disableRemoteMethodByName('prototype.__delete__locationsHistory');
  model.disableRemoteMethodByName('prototype.__link__locationsHistory');
  model.disableRemoteMethodByName('prototype.__unlink__locationsHistory');
  model.disableRemoteMethodByName('prototype.__exists__locationsHistory');
  model.disableRemoteMethodByName('prototype.__findById__locationsHistory');

  model.disableRemoteMethodByName('prototype.__create__installations');

  model.disableRemoteMethodByName('prototype.__updateById__scans');
  model.disableRemoteMethodByName('prototype.__findById__scans');
  model.disableRemoteMethodByName('prototype.__delete__scans');

  model.disableRemoteMethodByName('createChangeStream');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('count');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('updateAll');

  let injectOwner = function(ctx, next) {
    let item;
    if (ctx.isNewInstance) {
      item = ctx.instance;
    } else {
      item = ctx.data;

      if (!item) {
        debug("ctx.data is NULL!!");
        item = ctx.instance;
      }
    }

    if (!item.ownerId) {
      debug("injectOwner");
      // debug("ctx.instance: ", item);

      const token = ctx.options && ctx.options.accessToken;
      const userId = token && token.userId;

      if (!userId) {
        return next(new Error("Not logged in!"));
      }
      item.ownerId = userId;
      next();
    }
    else {
      next();
    }
  };

  model.observe('before save', injectOwner);

  model.afterRemote('prototype.__create__scans', function(ctx, instance, next) {
    next();
  });

  /************************************
   **** Location
   ************************************/

  model.setCurrentLocation = function(device, locationId, next) {
    if ((device.currentLocationId === locationId) ||
      (String(device.currentLocationId) === String(locationId))) {
      debug("location == current location, nothing to do!");
      return next();
    }

    let Location = loopback.getModel('Location');
    Location.findById(locationId, function(err, location) {
      if (err) return next(err);
      if (Location.checkForNullError(location, next, "id: " + locationId)) return;

      device.currentLocationId = locationId;

      device.locationsHistory.create({
        locationId: locationId
      }, function(err, instance) {
        // if (next) {
        // 	if (err) return next(err);
        // 	next();
        // }
      });

      device.save(function(err, deviceInstance) {
        next(err);
        // if (next) {
        // 	if (err) return next(err);
        // 	next();
        // }
      })

    });
  };

  model.clearCurrentLocation = function(device, next) {

    debug("clearing current location");
    device.currentLocationId = null;

    device.save(function(err, deviceInstance) {
      if (next) {
        if (err) return next(err);
        next();
      }
    })

  };

  model.remoteSetCurrentLocation = function(locationId, deviceId, next) {
    debug("remoteSetCurrentLocation");

    model.findById(deviceId, function(err, device) {
      if (err) return next(err);
      if (model.checkForNullError(device, next, "id: " + deviceId)) return;

      if (locationId) {
        model.setCurrentLocation(device, locationId, next);
      } else {
        model.clearCurrentLocation(device, next);
      }
    })

  };

  model.remoteMethod(
    'remoteSetCurrentLocation',
    {
      http: {path: '/:id/currentLocation/:fk', verb: 'PUT'},
      accepts: [
        {arg: 'fk', type: 'any', required: true, 'http': {source: 'path'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Set the current location of the device"
    }
  );

  /************************************
   **** Coordinate
   ************************************/

  model.setCurrentCoordinate = function(device, coordinate, next) {

    debug("setCurrentCoordinate");

    // debug("device:", device);
    // debug("coordinate:", coordinate);

    device.coordinatesHistory.create(coordinate, function(err, coordinateInstance) {
      if (err) return next(err);

      if (coordinateInstance) {
        device.currentCoordinateId = coordinateInstance.id;

        device.save(function(err, deviceInstance) {
          if (next) {
            if (err) return next(err);
            next(null, coordinateInstance);
          }
        })
      } else {
        next({"message": "failed to create coordinate"});
      }
    });

  };

  model.remoteSetCurrentCoordinate = function(coordinate, deviceId, next) {
    debug("remoteSetCurrentCoordinate");

    model.findById(deviceId, function(err, device) {
      if (err) return next(err);
      if (model.checkForNullError(device, next, "id: " + deviceId)) return;

      model.setCurrentCoordinate(device, coordinate, next);
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
      description: "Add current coordinate of the device"
    }
  );

  model.deleteCoordinatesHistory = function(id, callback) {
    debug("deleteCoordinatesHistory");
    model.findById(id, {include: "coordinatesHistory"}, function(err, device) {
      if (err) return callback(err);
      if (model.checkForNullError(device, callback, "id: " + id)) return;

      device.coordinatesHistory.destroyAll(function(err) {
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
      description: "Delete coordinates history of Device"
    }
  );

  model.deleteLocationsHistory = function(id, callback) {
    debug("deleteLocationsHistory");
    model.findById(id, {include: "locationsHistory"}, function(err, device) {
      if (err) return callback(err);
      if (model.checkForNullError(device, callback, "id: " + id)) return;

      device.locationsHistory.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteLocationsHistory',
    {
      http: {path: '/:id/deleteLocationsHistory', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete locations history of Device"
    }
  );

  model.deleteAllScans = function(id, callback) {
    debug("deleteAllScans");
    model.findById(id, {include: "scans"}, function(err, device) {
      if (err) return callback(err);
      if (model.checkForNullError(device, callback, "id: " + id)) return;

      device.scans.destroyAll(function(err) {
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
      description: "Delete all scans of Device"
    }
  );


  model.createInstallation = function(data, id, appName, options, callback) {
    // look for appName in the App model.
    const appModel = loopback.getModel('App');
    appModel.findOne({where : {name: appName}})
      .then((App) => {
    		if (App === null || App && App.id === undefined) {
    			throw "No Application is registered by that name.";
				}

				data.appName = appName;
				data.appId = App.id;
        return model.findById(id)
      })
      .then((currentDevice) => {
        if (currentDevice) {
          return currentDevice.installations.create(data);
        }
        else {
          throw "No device selected."
        }
      })
			.then((result) => {
        // console.log("Created Installation", result);
        callback(null, result);
			})
			.catch((err) => {
    		// console.log("ERR createInstallation", err);
        callback(err);
			});
  };

  model.remoteMethod(
    'createInstallation',
    {
      http: {path: '/:id/installations', verb: 'post'},
      accepts: [
        {arg: 'data', type: 'AppInstallation', required: true, http: { source : 'body' }},
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'appName', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'AppInstallation', root:true},
      description: "Creates a snew instance in installation of this model."
    }
  );

};