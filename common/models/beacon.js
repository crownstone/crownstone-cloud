module.exports = function(Beacon) {

	// address has to be unique to a beacon
	Beacon.validatesUniquenessOf('address', {message: 'a beacon with this address was already added!'});

	Beacon.findLocation = function(beaconAddress, cb) {
			Beacon.find({where: {address: beaconAddress}, include: {locations: 'name'}}, function(err, beacons) {
				console.log('found: ' + JSON.stringify(beacons[0].locations));
				cb(null, beacons[0].locations);
			});
	}

	Beacon.remoteMethod(
		'findLocation',
		{
			http: {path: '/findLocation', verb: 'get'},
			accepts: {arg: 'address', type: 'string', http: { source : 'query' }},
			returns: {arg: 'location', type: 'object'}
		}
	);
};
