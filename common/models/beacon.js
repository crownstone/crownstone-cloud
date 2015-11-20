var loopback = require('loopback');
var dataSources = require('../../server/datasources.json');

module.exports = function(beacon) {

	// address has to be unique to a beacon
	beacon.validatesUniquenessOf('address', {message: 'a beacon with this address was already added!'});

	beacon.findLocation = function(beaconAddress, cb) {
			beacon.find({where: {address: beaconAddress}, include: {locations: 'name'}}, function(err, beacons) {
				if (beacons.length > 0 && beacons[0].locations.length > 0) {
					console.log('found: ' + JSON.stringify(beacons[0].locations));
					cb(null, beacons[0].locations);
				} else {
					cb({message: "no beacon found with address: " + beaconAddress}, null);
				}
			});
	}

	beacon.remoteMethod(
		'findLocation',
		{
			http: {path: '/findLocation', verb: 'get'},
			accepts: {arg: 'address', type: 'string', http: { source : 'query' }},
			returns: {arg: 'location', type: 'object'}
		}
	);

	var attachedDataSource = undefined;
	var dataSource = undefined;


	beacon.beforeRemote('**', function(context, unused, next) {
		console.log("beacon.app.models.Beacon.settings.mongodb.collection: " + beacon.app.models.Beacon.settings.mongodb.collection);

		var ctx = loopback.getCurrentContext();
		var currentUser = ctx && ctx.get('currentUser');
		console.log("currentUser: " + JSON.stringify(currentUser));
		// console.log('currentUser.username: ', currentUser.username);

		console.log("realm: " + currentUser.realm)
		if (currentUser.realm == "user2") {
			// var wait = false;
			// if (!dataSource || attachedDataSource != dataSource) {
			// 	if (!dataSource) {
			// 		dataSource = loopback.createDataSource({
			// 			connector: "mongodb",
			// 			"host": "ds047484.mongolab.com",
			// 			"port": 47484,
			// 			"database": "crownstone-cloud-2",
			// 			"username": dataSources.mongoDs.username,
			// 			"password": dataSources.mongoDs.password,
			// 		});
			// 		dataSource.on('connected', function() {
			// 			next();
			// 		});
			// 		wait = true;
			// 	}

			// 	console.log("attaching datasource 2")
			// 	beacon.app.models.Beacon.attachTo(dataSource);
			// 	attachedDataSource = dataSource;
			// }
			// if (!wait) {
			// 	next();
			// }
			beacon.app.models.Beacon.settings.mongodb.collection = "Beacon_User2";
		// } else if (currentUser.realm == "user1") {
		} else {
			// if (attachedDataSource != beacon.app.dataSources.mongoDs) {
			// 	console.log("attaching datasource 1");
			// 	console.log("dataSources: " + dataSources.mongoDs.username);
			// 	beacon.app.models.Beacon.attachTo(beacon.app.dataSources.mongoDs);
			// 	attachedDataSource = beacon.app.dataSources.mongoDs;
			// }
			// next();
			beacon.app.models.Beacon.settings.mongodb.collection = "Beacon";
		// } else {
		// 	next({error: "user realm not found"});
		// 	return;
		}
		next();

	});

};
