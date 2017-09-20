// "use strict";

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
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "lib-user",
      "permission": "DENY"
    });
  }

  // address has to be unique to a stone
  // model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

  model.disableRemoteMethodByName('prototype.__get__currentLocation');
  model.disableRemoteMethodByName('prototype.__get__currentSphere');
  model.disableRemoteMethodByName('prototype.__create__installations');

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
      device.save(function(err, deviceInstance) {
        next(err);
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
        {arg: 'fk', type: 'any', 'http': {source: 'path'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Set the current location of the device"
    }
  );

  model.setCurrentSphere = function(device, sphereId, next) {
    if ((device.currentSphereId === sphereId) ||
      (String(device.currentSphereId) === String(sphereId))) {
      debug("location == current location, nothing to do!");
      return next();
    }

    let Sphere = loopback.getModel('Sphere');
    Sphere.findById(sphereId, function(err, sphere) {
      if (err) return next(err);
      if (Sphere.checkForNullError(sphere, next, "id: " + sphereId)) return;

      device.currentSphereId = sphereId;
      device.save(function(err, deviceInstance) {
        next(err);
      })
    });
  };

  model.clearCurrentSphere = function(device, next) {
    debug("clearing current sphere");
    device.currentSphereId = null;

    device.save(function(err, deviceInstance) {
      if (next) {
        if (err) return next(err);
        next();
      }
    })

  };

  model.remoteSetCurrentSphere = function(sphereId, deviceId, next) {
    model.findById(deviceId, function(err, device) {
      if (err) return next(err);
      if (model.checkForNullError(device, next, "id: " + deviceId)) return;

      if (sphereId) {
        model.setCurrentSphere(device, sphereId, next);
      } else {
        model.clearCurrentSphere(device, next);
      }
    })
  };

  model.remoteMethod(
    'remoteSetCurrentSphere',
    {
      http: {path: '/:id/currentSphere/:fk', verb: 'PUT'},
      accepts: [
        {arg: 'fk', type: 'any', 'http': {source: 'path'}},
        {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
      ],
      description: "Set the current Sphere of the device"
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