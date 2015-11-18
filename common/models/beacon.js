module.exports = function(Beacon) {

	// address has to be unique to a beacon
	Beacon.validatesUniquenessOf('address', {message: 'a beacon with this address was already added!'});

	Beacon.findLocation = function(beaconAddress, cb) {
			Beacon.find({where: {address: beaconAddress}, include: {locations: 'name'}}, function(err, beacons) {
				if (beacons.length > 0 && beacons[0].locations.length > 0) {
					console.log('found: ' + JSON.stringify(beacons[0].locations));
					cb(null, beacons[0].locations);
				} else {
					cb({message: "no beacon found with address: " + beaconAddress}, null);
				}
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
