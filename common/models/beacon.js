var updateDS = require('../../server/updateDS.js');
var loopback = require('loopback');

module.exports = function(model) {

	// address has to be unique to a beacon
	model.validatesUniquenessOf('address', {message: 'a beacon with this address was already added!'});

	model.findLocation = function(beaconAddress, cb) {
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



	// var connector = model.app.models.Beacon.getDataSource().connector;
	// connector.observe('before execute', function(ctx, next) {
	// 	console.log("beacon before execute");
	// 	var ctx = loopback.getCurrentContext();
	// 	var currentUser = ctx && ctx.get('currentUser');
	// 	console.log("currentUser: " + JSON.stringify(currentUser));

	// });

	// model.observe('access', function(ctx, next) {
	// 	console.log("beacon observe");
	// 	console.log('Accessing %s matching %s', ctx.Model.modelName, ctx.query.where);
	// 	// console.log(ctx.options.remoteCtx.req.accessToken.userId);
	// 	updateDS.update(model.app.models.Beacon, model.app, ctx.options.remoteCtx.req.accessToken, next);
	// });

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("beacon.beforeRemote");
		// next();
	// 	// updateDS.update(model.app.models.Beacon, model.app.dataSources, next);
	// 	console.log(ctx.req.accessToken);
		// updateDS.update(model.app.models.Beacon, model.app, ctx.req.accessToken, next);
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		// return updateDS.getDataSource(this);
		return updateDS.getCurrentDataSource(this);
	}

	// model.beforeRemote('**', function(context, unused, next) {
	// 	// console.log("beacon.app.models.Beacon.settings.mongodb.collection: " + model.app.models.Beacon.settings.mongodb.collection);

	// 	var ctx = loopback.getCurrentContext();
	// 	var currentUser = ctx && ctx.get('currentUser');
	// 	console.log("currentUser: " + JSON.stringify(currentUser));
	// 	// console.log('currentUser.username: ', currentUser.username);

	// 	if (currentUser) {
	// 		console.log("realm: " + currentUser.realm)
	// 	}
	// 	// if (currentUser && currentUser.realm == "cbre") {
	// 	if (currentUser && currentUser.realm) {
	// 		var wait = false;
	// 		if (!dataSource[currentUser.realm] || attachedDataSource != dataSource[currentUser.realm]) {
	// 			if (!dataSource[currentUser.realm]) {
	// 				console.log("creating dataSource " + currentUser.realm)
	// 				url = util.format(dataSources.mongoDsRealm.url, currentUser.realm)
	// 				console.log("url: " + url)
	// 				dataSource[currentUser.realm] = loopback.createDataSource({
	// 					connector: "mongodb",
	// 					url: url
	// 				});
	// 				dataSource[currentUser.realm].on('connected', function() {
	// 					next();
	// 				});
	// 				wait = true;
	// 			}

	// 			console.log("attaching " + currentUser.realm)
	// 			model.app.models.Beacon.attachTo(dataSource[currentUser.realm]);
	// 			attachedDataSource = dataSource[currentUser.realm];

	// 			// console.log("dataSource " + JSON.stringify(dataSource));
	// 		}
	// 		if (!wait) {
	// 			next();
	// 		}
	// 		// model.app.models.Beacon.settings.mongodb.collection = "Beacon_User2";
	// 	// } else if (currentUser.realm == "user1") {
	// 	} else {
	// 		// console.log("attachedDataSource " + JSON.stringify(attachedDataSource))
	// 		// console.log("beacon.app.dataSources.mongoDs " + JSON.stringify(model.app.dataSources.mongoDs))
	// 		if (attachedDataSource && attachedDataSource != model.app.dataSources.mongoDs) {
	// 			console.log("attaching dev");
	// 			// console.log("dataSources: " + dataSources.mongoDs.username);
	// 			model.app.models.Beacon.attachTo(model.app.dataSources.mongoDs);
	// 			attachedDataSource = model.app.dataSources.mongoDs;
	// 		}
	// 		next();
	// 		// model.app.models.Beacon.settings.mongodb.collection = "Beacon";
	// 	// } else {
	// 	// 	next({error: "user realm not found"});
	// 	// 	return;
	// 	}
	// 	// next();

	// });

};
