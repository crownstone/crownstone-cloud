var stl = require('../../server/middleware/stoneScanToLocation');
var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL:
		//   - nothing
		//***************************
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$everyone",
				"permission": "DENY"
			}
		);
		//***************************
		// OWNER:
		//   - everything
		//***************************
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$group:owner",
				"permission": "ALLOW"
			}
		);
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
				"accessType": "*",
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
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:guest",
				"permission": "ALLOW",
				"property": "updateAttributes"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:guest",
				"permission": "ALLOW",
				"property": "findLocation"
			}
		);
	}


	// address has to be unique to a stone
	model.validatesUniquenessOf('address', {message: 'a stone with this address was already added!'});

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

	// do we need these? since it is historical data, it should not be updateable once it is uploaded?
	model.disableRemoteMethod('__updateById__scans', false);
	model.disableRemoteMethod('__updateById__powerUsageHistory', false);
	model.disableRemoteMethod('__updateById__energyUsageHistory', false);
	model.disableRemoteMethod('__updateById__coordinatesHistory', false);
	model.disableRemoteMethod('__updateById__powerCurveHistory', false);


	model.findLocation = function(ctx, stoneAddress, cb) {
		model.find({where: {address: stoneAddress}, include: {locations: 'name'}}, function(err, stones) {
			if (stones.length > 0 && stones[0].locations.length > 0) {
				debug('found location: ' + JSON.stringify(stones[0].locations));
				cb(null, stones[0].locations);
			} else {
				cb({message: "no stone found with address: " + stoneAddress}, null);
			}
		});
	}

	model.remoteMethod(
		'findLocation',
		{
			http: {path: '/findLocation', verb: 'get'},
			accepts: {arg: 'address', type: 'string'},
			returns: {arg: 'location', type: 'object'}
		}
	);

	// model.beforeRemote('*.__create__scans', function(ctx, instance, next) {
	// 	// console.log("ctx: ", ctx);
	// 	// console.log("instance: ", ctx.instance);

	// 	if (ctx.args.data) {
	// 		ctx.args.data.groupId = ctx.instance.groupId;
	// 	}
	// 	next();
	// });

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
					next({"message": "failed to create coordinate"});
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
				return next({"message":"no stone found with this id"})
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

		energyUsage.groupId = stone.groupId;

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
					next({"message": "failed to create energyUsage"});
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
				return next({"message":"no stone found with this id"})
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

		powerUsage.groupId = stone.groupId;

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
					next({"message": "failed to create powerUsage"});
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
				return next({"message":"no stone found with this id"})
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

		powerCurve.groupId = stone.groupId;

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
					next({"message": "failed to create powerCurve"});
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
				return next({"message":"no stone found with this id"})
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



};
