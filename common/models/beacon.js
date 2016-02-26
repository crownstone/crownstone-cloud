var updateDS = require('../../server/updateDS.js');
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



	// var connector = model.app.models.Beacon.getDataSource().connector;
	// connector.observe('before execute', function(ctx, next) {
	// 	console.log("beacon before execute");
	// 	var ctx = loopback.getCurrentContext();
	// 	var currentUser = ctx && ctx.get('currentUser');
	// 	console.log("currentUser: " + JSON.stringify(currentUser));

	// });

	// model.afterInitialize = function() {
	// 	console.log("afterInitialize");
	// 	model.getDataSource().connector.observe('before execute', function(ctx, next) {
	// 		console.log("before execute");
	// 		console.log(ctx);
	// 		next();
	// 	});
	// }
	//

	model.updateDS = function(accessToken, next) {
		console.log("updating data source");
		updateDS.updateDS(accessToken, model.app, next);
	}

	model.observe('beforeAccess', function(ctx, next) {
		console.log("beacon beforeAccess", ctx.options);
		// console.log(ctx);
		updateDS.updateDefaultDS(ctx, this, model, next);
	});

	model.observe('access', function(ctx, next) {
		console.log("beacon access", ctx.options);
		// console.log(ctx.options.remoteCtx)
		// console.log(ctx.options.remoteCtx.req.accessToken)
	// 	console.log('Accessing %s matching %s', ctx.Model.modelName, ctx.query.where);
		// console.log(ctx.options.remoteCtx);
	// 	updateDS.update(model.app.models.Beacon, model.app, ctx.options.remoteCtx.req.accessToken, next);
		// updateDS.updateDefaultDS(ctx, this, model, function() {
		// 	// connector = model.getDataSource().connector.url;

		// 	// console.log("con: ", ctx.connector);
		// 	next(null, ctx)
		// });
		next();
	});

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("beacon.beforeRemote");
		console.log("accessToken: ", ctx.req.accessToken);
		// next();
	// 	// updateDS.update(model.app.models.Beacon, model.app.dataSources, next);
	// 	console.log(ctx.req.accessToken);
		// updateDS.update(model.app.models.Beacon, model.app, ctx.req.accessToken, next);
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.afterRemote('**', function (ctx, unused, next) {
		console.log("beacon.afterRemote");
		next();
	});

	model.getDataSource = function() {
		// console.log("beacon.getDataSource");
		// var ctx = loopback.getCurrentContext();
		// console.log("ctx " + ctx);
		// console.log(ctx);
		// return updateDS.getDataSource(this);
		console.log("location:");
		return updateDS.getCurrentDataSource(this);
		// if (!DS) {
		// 	DS = model.app.dataSources["db"];
		// }
		// return DS;
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
