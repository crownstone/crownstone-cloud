var updateDS = require('../../server/middleware/updateDS.js');
var loopback = require('loopback');

module.exports = function(model) {

	// address has to be unique to a beacon
	model.validatesUniquenessOf('address', {message: 'a beacon with this address was already added!'});

	model.findLocation = function(ctx, beaconAddress, cb) {
		model.find({where: {address: beaconAddress}, include: {locations: 'name'}}, function(err, beacons) {
			if (beacons.length > 0 && beacons[0].locations.length > 0) {
				console.log('found: ' + JSON.stringify(beacons[0].locations));
				cb(null, beacons[0].locations);
			} else {
				cb({message: "no beacon found with address: " + beaconAddress}, null);
			}
		});
	}

	model.remoteMethod(
		'findLocation',
		{
			http: {path: '/findLocation', verb: 'get'},
			accepts: {arg: 'address', type: 'string', http: { source : 'query' }},
			returns: {arg: 'location', type: 'object'}
		}
	);

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("beacon.beforeRemote");
		next();
	});

	model.afterRemote('**', function (ctx, unused, next) {
		console.log("beacon.afterRemote");
		next();
	});

	model.getDataSource = function() {
		// console.log("beacon:");
		return updateDS.getDataSource(this);
	}

};
