var stl = require('../../server/middleware/deviceScanToLocation');
var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {
		model.disableRemoteMethod('find', true);

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

	model.disableRemoteMethod('__updateById__coordinatesHistory', false);
	model.disableRemoteMethod('__link__coordinatesHistory', false);
	model.disableRemoteMethod('__unlink__coordinatesHistory', false);
	model.disableRemoteMethod('__exists__coordinatesHistory', false);
	model.disableRemoteMethod('__findById__coordinatesHistory', false);
	model.disableRemoteMethod('__delete__coordinatesHistory', false);

	model.disableRemoteMethod('__updateById__locationsHistory', false);
	// model.disableRemoteMethod('__create__locationsHistory', false);
	model.disableRemoteMethod('__delete__locationsHistory', false);
	model.disableRemoteMethod('__link__locationsHistory', false);
	model.disableRemoteMethod('__unlink__locationsHistory', false);
	model.disableRemoteMethod('__exists__locationsHistory', false);
	model.disableRemoteMethod('__findById__locationsHistory', false);

	model.disableRemoteMethod('__updateById__scans', false);
	model.disableRemoteMethod('__findById__scans', false);
	model.disableRemoteMethod('__delete__scans', false);

	model.disableRemoteMethod('createChangeStream', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('count', true);
	model.disableRemoteMethod('findOne', true);
	model.disableRemoteMethod('updateAll', true);

	var initDevice = function(ctx, next) {
		debug("initDevice");

		if (ctx.isNewInstance) {
			injectOwner(ctx.instance, next)
		} else {
			injectOwner(ctx.data, next);
		}
	}

	var injectOwner = function(ctx, next) {
		// debug("ctx", ctx);
		// debug("next", next);

		var item;
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

			const loopbackContext = loopback.getCurrentContext();
			var currentUser = loopbackContext.get('currentUser');

			if (!currentUser) {
				return next(new Error("Not logged in!"));
			}

			item.ownerId = currentUser.id;
			next();
		} else {
			next();
		}
	};

	model.observe('before save', injectOwner);

	model.afterRemote('prototype.__create__scans', function(ctx, instance, next) {

		// console.log("ctx: ", ctx);
		// console.log("instance: ", ctx.instance);

		next();

		// const loopbackContext = loopback.getCurrentContext();
		// var currentUser = loopbackContext.get('currentUser');
		// stl.update(ctx.args.data, ctx.instance, currentUser);

	});

	/************************************
	 **** Location
	 ************************************/

    var badge = 1;

	model.setCurrentLocation = function(device, locationId, next) {
		if ((device.currentLocationId === locationId) ||
			(new String(device.currentLocationId).valueOf() === new String(locationId).valueOf())) {
			debug("location == current location, nothing to do!");
			return next();
		}

		Location = loopback.getModel('Location');
		Location.findById(locationId, function(err, location) {
			if (err) return next(err);
			if (Location.checkForNullError(location, next, "id: " + locationId)) return;

			debug("setCurrentLocation");

			// debug("device:", device);
			// debug("new location:", locationId);

			debug("notify location change")

			PushModel = loopback.getModel('Push');
			Notification = loopback.getModel('Notification');

			// debug("location: ", location);

			var note = new Notification({
		        expirationInterval: 3600, // Expires 1 hour from now.
		        badge: badge++,
		        sound: 'ping.aiff',
		        alert: '\uD83D\uDCE7 \u2709 ' + 'Location changed to ' + location.name + ' (' + locationId + ')',
		        message: '\uD83D\uDCE7 \u2709 ' + 'Location changed to ' + location.name + ' (' + locationId + ')',
		        messageFrom: 'Me'
		    });

		    // debug("installation: ", device.installation());

		    Installation = loopback.getModel('Installation');
		    Installation.findOne({where: {deviceId: device.id}}, function(err, installation) {
		    	if (err || !installation) {
		    		debug("no installation found for device");
		    		return;
		    	}

		    	PushModel.notifyById(installation.id, note, function (err) {
					if (err) {
						debug('Cannot notify %j: %s', installation.id, err.stack);
						return;
					}
					debug('pushing notification to %j', installation.id);
				});
		    })

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
	}

	model.clearCurrentLocation = function(device, next) {

		debug("clearing current location");
		device.currentLocationId = null;

		device.save(function(err, deviceInstance) {
			if (next) {
				if (err) return next(err);
				next();
			}
		})

	}

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

	}

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

	}

	model.remoteSetCurrentCoordinate = function(coordinate, deviceId, next) {
		debug("remoteSetCurrentCoordinate");

		model.findById(deviceId, function(err, device) {
			if (err) return next(err);
			if (model.checkForNullError(device, next, "id: " + deviceId)) return;

			model.setCurrentCoordinate(device, coordinate, next);
		})

	}

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

	model.deleteCoordinatesHistory = function(id, cb) {
		debug("deleteCoordinatesHistory");
		model.findById(id, {include: "coordinatesHistory"}, function(err, device) {
			if (err) return cb(err);
			if (model.checkForNullError(device, cb, "id: " + id)) return;

			device.coordinatesHistory.destroyAll(function(err) {
				cb(err);
			});
		})
	}

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

	model.deleteLocationsHistory = function(id, cb) {
		debug("deleteLocationsHistory");
		model.findById(id, {include: "locationsHistory"}, function(err, device) {
			if (err) return cb(err);
			if (model.checkForNullError(device, cb, "id: " + id)) return;

			device.locationsHistory.destroyAll(function(err) {
				cb(err);
			});
		})
	}

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

	model.deleteAllScans = function(id, cb) {
		debug("deleteAllScans");
		model.findById(id, {include: "scans"}, function(err, device) {
			if (err) return cb(err);
			if (model.checkForNullError(device, cb, "id: " + id)) return;

			device.scans.destroyAll(function(err) {
				cb(err);
			});
		})
	}

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

};
