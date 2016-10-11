var stl = require('../../server/middleware/stoneScanToLocation');
var loopback = require('loopback');
var crypto = require('crypto');

const debug = require('debug')('loopback:dobots');

var util = require('../../server/emails/util');

module.exports = function(model) {

	var app = require('../../server/server');
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

	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__updateById__coordinatesHistory', false);
	model.disableRemoteMethod('__link__coordinatesHistory', false);
	model.disableRemoteMethod('__unlink__coordinatesHistory', false);
	model.disableRemoteMethod('__exists__coordinatesHistory', false);
	model.disableRemoteMethod('__findById__coordinatesHistory', false);

	model.disableRemoteMethod('__create__locations', false);
	model.disableRemoteMethod('__delete__locations', false);
	model.disableRemoteMethod('__updateById__locations', false);
	model.disableRemoteMethod('__deleteById__locations', false);
	model.disableRemoteMethod('__destroyById__locations', false);

	// do we need these? since it is historical data, it should not be updateable once it is uploaded?
	model.disableRemoteMethod('__updateById__scans', false);
	model.disableRemoteMethod('__updateById__coordinatesHistory', false);
	model.disableRemoteMethod('__updateById__energyUsageHistory', false);
	model.disableRemoteMethod('__updateById__powerCurveHistory', false);
	model.disableRemoteMethod('__updateById__powerUsageHistory', false);

	model.disableRemoteMethod('__delete__scans', false);
	model.disableRemoteMethod('__delete__coordinatesHistory', false);
	model.disableRemoteMethod('__delete__energyUsageHistory', false);
	model.disableRemoteMethod('__delete__powerCurveHistory', false);
	model.disableRemoteMethod('__delete__powerUsageHistory', false);

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
		buf = crypto.randomBytes(4);
		if (!item.major) {
			debug("inject major");
			item.major = buf.readUInt16BE(0);
		}
		if (!item.minor) {
			debug("inject minor");
			item.minor = buf.readUInt16BE(2);
		}
	}

	function injectUID(item, next) {
		if (!item.uid) {
			debug("inject uid");
			model.find({where: {sphereId: item.sphereId}, order: "uid DESC", limit: "1"}, function(err, instances) {
				if (err) return next(err);

				if (instances.length > 0) {
					stone = instances[0];
					item.uid = stone.uid + 1;
				} else {
					item.uid = 1;
				}
				debug("uid:", item.uid);
				next();
			})
		} else {
			next();
		}
	}

	// populate some of the elements like uid, major, minor, if not already provided
	model.observe('before save', initStone);

	model.findLocation = function(stoneAddress, cb) {
		model.find({where: {address: stoneAddress}, include: {locations: 'name'}}, function(err, stones) {
			if (stones.length > 0 && stones[0].locations.length > 0) {
				debug('found location: ' + JSON.stringify(stones[0].locations));
				cb(null, stones[0].locations);
			} else {
				error = new Error("no stone found with address: " + stoneAddress);
				return cb(error);
			}
		});
	}

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

		const loopbackContext = loopback.getCurrentContext();
		var currentUser = loopbackContext.get('currentUser');
		stl.update(ctx.args.data, ctx.instance, currentUser);

	});

	/************************************
	 **** Coordinate
	 ************************************/

	model.setCurrentCoordinate = function(stone, coordinate, next) {

		debug("setCurrentCoordinate");

		debug("stone:", stone);
		debug("coordinate:", coordinate);

		stone.coordinatesHistory.create(coordinate, function(err, coordinateInstance) {
			if (next) {
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
					error = new Error("failed to create coordinate");
					return next(error);
				}
			}
		});

	}

	model.remoteSetCurrentCoordinate = function(coordinate, stoneId, next) {
		debug("remoteSetCurrentCoordinate");

		model.findById(stoneId, function(err, stone) {
			if (err) return next(err);

			if (stone) {
				model.setCurrentCoordinate(stone, coordinate, next);
			} else {
				error = new Error("no stone found with this id");
				return next(error);
			}
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
			description: "Add current coordinate of the stone"
		}
	);

	/************************************
	 **** Energy Usage
	 ************************************/

	model.setCurrentEnergyUsage = function(stone, energyUsage, next) {

		debug("setCurrentEnergyUsage");

		debug("stone:", stone);
		debug("energyUsage:", energyUsage);

		energyUsage.sphereId = stone.sphereId;

		stone.energyUsageHistory.create(energyUsage, function(err, energyUsageInstance) {
			if (next) {
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
					error = new Error("failed to create energyUsage");
					return next(error);
				}
			}
		});

	}

	model.remoteSetCurrentEnergyUsage = function(energyUsage, stoneId, next) {
		debug("remoteSetCurrentEnergyUsage");

		model.findById(stoneId, function(err, stone) {
			if (err) return next(err);

			if (stone) {
				model.setCurrentEnergyUsage(stone, energyUsage, next);
			} else {
				error = new Error("no stone found with this id");
				return next(error);
			}
		})

	}

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

		debug("stone:", stone);
		debug("powerUsage:", powerUsage);

		powerUsage.sphereId = stone.sphereId;

		stone.powerUsageHistory.create(powerUsage, function(err, powerUsageInstance) {
			if (next) {
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
					error = new Error("failed to create powerUsage");
					return next(error);
				}
			}
		});

	}

	model.remoteSetCurrentPowerUsage = function(powerUsage, stoneId, next) {
		debug("remoteSetCurrentPowerUsage");

		model.findById(stoneId, function(err, stone) {
			if (err) return next(err);

			if (stone) {
				model.setCurrentPowerUsage(stone, powerUsage, next);
			} else {
				error = new Error("no stone found with this id");
				return next(error);
			}
		})

	}

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

		debug("stone:", stone);
		debug("powerCurve:", powerCurve);

		powerCurve.sphereId = stone.sphereId;

		stone.powerCurveHistory.create(powerCurve, function(err, powerCurveInstance) {
			if (next) {
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
					error = new Error("failed to create powerCurve");
					return next(error);
				}
			}
		});

	}

	model.remoteSetCurrentPowerCurve = function(powerCurve, stoneId, next) {
		debug("remoteSetCurrentPowerCurve");

		model.findById(stoneId, function(err, stone) {
			if (err) return next(err);

			if (stone) {
				model.setCurrentPowerCurve(stone, powerCurve, next);
			} else {
				error = new Error("no stone found with this id");
				return next(error);
			}
		})

	}

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

	function removeApplianceFromStone(stone, applianceId, next) {

		const Appliance = loopback.getModel('Appliance');
		Appliance.findById(applianceId, function(err, appliance) {
			if (err) return next(err);

			stone.applianceId = undefined;
			stone.save();

			if (!appliance) {
				// this is not necessarily a fatal error, could happen
				// if the appliance was deleted but stone still has the link
				// if a new appliance should be added we don't care if the
				// stone can't be removed from the old one because it was not
				// found
				debug("no appliance found with id");
				return next();
			} else {
				appliance.stones.remove(stone, function(err) {
					if (err) return next(err);
					next();
				});
			}
		});
	}

	function addApplianceToStone(stone, applianceId, next) {

		const Appliance = loopback.getModel('Appliance');
		Appliance.findById(applianceId, function(err, appliance) {
			if (err) return next(err);

			if (!appliance) {
				error = new Error("no appliance found with id");
				next(error);
			}
			stone.applianceId = applianceId;
			stone.save();
			appliance.stones.add(stone, function(err) {
				if (err) return next(err);
				next();
			});
		});
	}

	model.remoteSetAppliance = function(stoneId, applianceId, next) {
		debug("remoteSetAppliance");

		model.findById(stoneId, function(err, stone) {
			if (err) return next(err);

			if (stone) {
				if (stone.applianceId) {
					removeApplianceFromStone(stone, stone.applianceId, function(err) {
						if (err) return next(err);
						addApplianceToStone(stone, applianceId, next);
					})
				} else {
					addApplianceToStone(stone, applianceId, next);
				}
			} else {
				error = new Error("no stone found with this id");
				return next(error);
			}
		});

	}

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

			if (stone) {
				removeApplianceFromStone(stone, applianceId, function(err) {
					if (err) return next(err);
					next();
				});
			} else {
				error = new Error("no stone found with this id");
				return next(error);
			}
		});

	}

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

			debug("stone", stone);
			debug("owner", stone.owner());

			sphere = stone.owner();

			const SphereAccess = loopback.getModel('SphereAccess');
			SphereAccess.find({where: {and: [{sphereId: sphere.id}, {role: "admin"}]}, include: "user"}, function(err, access) {
				if (err) return next(err);

				debug("access", access);
				for (acc of access) {
					// debug("acc", acc);
					// debug("user", acc.user());
					util.sendStoneRecoveredEmail(acc.user(), stone);
				}
				next();
			})

			// if (stone) {
			// 	util.sendStoneRecoveredEmail(stone, next);
			// } else {
			// 	error = new Error("no stone found with this id");
			// 	return next(error);
			// }
			// next();
		});

	}

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
};
