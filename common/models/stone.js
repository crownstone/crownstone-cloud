module.exports = function(model) {

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

	model.findLocation = function(ctx, stoneAddress, cb) {
		model.find({where: {address: stoneAddress}, include: {locations: 'name'}}, function(err, stones) {
			if (stones.length > 0 && stones[0].locations.length > 0) {
				console.log('found: ' + JSON.stringify(stones[0].locations));
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
			accepts: {arg: 'address', type: 'string', http: { source : 'query' }},
			returns: {arg: 'location', type: 'object'}
		}
	);

};