var loopback = require('loopback');
// var dataSources = require('./datasources.json');
// var config = require('./config.json');
var util = require('util');

attachedDataSource = undefined;
dataSourceMap = {};

module.exports = {
	// attachedDataSource : undefined,
	// var dataSource = undefined;
	// dataSource : {},

	// updateDefaultDS : function(ctx, obj, model, next) {
	// 	// attachedDataSource = app.dataSources["mongoDs"];
	// 	updateDataSource3(undefined, model, function() {
	// 		// attachedDataSource.attach(model);
	// 		// console.log(model);
	// 		// obj.dataSource = attachedDataSource;
	// 		setTimeout(function() {
	// 			next();
	// 		}, 1000);
	// 	});
	// 	// model.attachTo(attachedDataSource);
	// },

	updateDefaultDS : function(ctx, obj, model, next) {
		// attachedDataSource = app.dataSources["mongoDs"];
		updateDataSource2(undefined, model.app, next);
		// updateDataSource2(undefined, model.app, function() {
		// 	attachedDataSource.attach(model);
		// 	// console.log(model);
		// 	obj.dataSource = attachedDataSource;
		// 	setTimeout(function() {
		// 		next();
		// 	}, 1000);
		// });
		// model.attachTo(attachedDataSource);
	},

	updateDS : function(accessToken, app, next) {

		if (accessToken) {

			app.models.user.findById(accessToken.userId, function(err, user) {
				if (user) {
					updateDataSource2(user, app, next);
				} else {
					updateDataSource2(undefined, app, next);
				}
			});
		} else {
			updateDataSource2(undefined, app, next);
		}

	},

	updateUserDS : function(user, app, next) {
		updateDataSource2(user, app, next);
	},

	// update : function(obj, app, accessToken, next) {
	// 	// next();
	// 	// return;

	// 	if (accessToken) {
	// 		console.log("2");
	// 		app.models.user.findById(accessToken.userId, function(err, user) {
	// 			if (user) {
	// 				updateDataSource(obj, app, user, next);
	// 			} else {
	// 				updateDataSource(obj, app, undefined, next);
	// 			}
	// 		});
	// 	} else {
	// 		console.log("3");
	// 		updateDataSource(obj, app, undefined, next);
	// 	}

	// },

	getCurrentDataSource : function(model) {
		// console.log("beacon.getDataSource");
		// var ctx = loopback.getCurrentContext();
		// console.log("ctx " + ctx);
		// console.log(ctx);
		console.log("attachedDataSource ", attachedDataSource ? attachedDataSource.settings.name : attachedDataSource);
		if (attachedDataSource != null) {
			// console.log("attaching");
			attachedDataSource.attach(model);
		// } else {
		// 	console.log("use db");
		// 	attachedDataSource = model.app.dataSources["db"];
		}
		return attachedDataSource;
	},

	// getDataSource : function(model) {
	// 	// console.log("getDataSource");
	// 	// console.log("attachedDataSource: " + attachedDataSource);

	// 	var ctx = loopback.getCurrentContext();
	// 	var currentUser = ctx && ctx.active && ctx.active.currentUser;
	// 	// var currentUser = ctx && ctx.get('currentUser');
	// 	console.log("user: " + JSON.stringify(currentUser));
	// 	console.log("ctx " + ctx);
	// 	console.log(ctx);

	// 	// if (currentUser) {
	// 		if (currentUser && currentUser.realm) {
	// 			// var wait = false;
	// 			if (!dataSourceMap[currentUser.realm] || attachedDataSource != dataSourceMap[currentUser.realm]) {
	// 				if (!dataSourceMap[currentUser.realm]) {
	// 					console.log("creating dataSource " + currentUser.realm)
	// 					// url = util.format(dataSources.mongoDsRealm.url, currentUser.realm)
	// 					// url = util.format(dataSources.mongoDsRealm.url, currentUser.realm)
	// 					url = util.format(model.app.get('mongo_url'), currentUser.realm)
	// 					console.log("url: " + url)
	// 					dataSourceMap[currentUser.realm] = loopback.createDataSource({
	// 						connector: "mongodb",
	// 						url: url,
	// 						server: {
 //      							sslValidate: false
 //    						}
	// 					});
	// 					// dataSourceMap[currentUser.realm].on('connected', function() {
	// 					// 	next();
	// 					// });
	// 					// wait = true;
	// 				}

	// 				console.log("attaching " + currentUser.realm)
	// 				attachedDataSource = dataSourceMap[currentUser.realm];
	// 				attachedDataSource.attach(model);
	// 				return attachedDataSource;
	// 			}
	// 			// if (!wait) {
	// 			// 	next();
	// 			// }
	// 		} else {
	// 			if (attachedDataSource != model.app.dataSources.mongoDs) {
	// 				console.log("attaching dev");
	// 				attachedDataSource = model.app.dataSources.mongoDs;
	// 				attachedDataSource.attach(model);
	// 				return attachedDataSource;
	// 			}
	// 			// next();
	// 		}
	// 	// }

	// 	// console.log("return last attached");
	// 	attachedDataSource.attach(model);
	// 	return attachedDataSource;
	// }
}

// var updateDataSource = function(obj, app, user, next) {

// 		// var ctx = loopback.getCurrentContext();
// 		// var user = ctx && ctx.get('user');
// 		// console.log("user: " + JSON.stringify(user));
// 		// console.log('user.username: ', user.username);
// 		//
// 		// console.log(dataSourceMap)

// 		// console.log("attachedDataSource " + attachedDataSource);

// 		if (user) {
// 			console.log("realm: " + user.realm)
// 		}
// 		// if (user && user.realm == "cbre") {
// 		if (user && user.realm) {
// 			var wait = false;
// 			if (!dataSourceMap[user.realm] || attachedDataSource != dataSourceMap[user.realm]) {
// 			// if (!dataSourceMap[user.realm] || attachedDataSource != user.realm) {
// 				if (!dataSourceMap[user.realm]) {
// 					console.log("creating dataSource " + user.realm)
// 					// url = util.format(dataSources.mongoDsRealm.url, user.realm)
// 					url = util.format(app.get('mongo_url'), user.realm)
// 					console.log("url: " + url)
// 					dataSourceMap[user.realm] = loopback.createDataSource({
// 						connector: "mongodb",
// 						url: url,
// 						server: {
//   							sslValidate: false
// 						}
// 					});
// 					dataSourceMap[user.realm].on('connected', function() {
// 						next();
// 					});
// 					wait = true;
// 				}

// 				console.log("attaching " + user.realm)
// 				obj.attachTo(dataSourceMap[user.realm]);
// 				// attachedDataSource = user.realm;
// 				attachedDataSource = dataSourceMap[user.realm];

// 				// console.log("dataSource " + JSON.stringify(dataSource));
// 			}
// 			if (!wait) {
// 				next();
// 			}
// 			// beacon.app.models.Beacon.settings.mongodb.collection = "Beacon_User2";
// 		// } else if (user.realm == "user1") {
// 		} else {
// 			// console.log("attachedDataSource " + JSON.stringify(attachedDataSource))
// 			// console.log("beacon.app.dataSources.mongoDs " + JSON.stringify(beacon.app.dataSources.mongoDs))

// 			// if (module.exports.attachedDataS && module.exports.attachedDataS != beacon.app.dataSources.mongoDs) {
// 			if (attachedDataSource != app.dataSources.mongoDs) {
// 				console.log("attaching dev");
// 				// console.log("dataSources: " + dataSources.mongoDs.username);
// 				obj.attachTo(app.dataSources.mongoDs);
// 				// module.exports.attachedDataS = beacon.app.dataSources.mongoDs;
// 				attachedDataSource = app.dataSources.mongoDs;
// 			}
// 			next();

// 			// beacon.app.models.Beacon.settings.mongodb.collection = "Beacon";
// 		// } else {
// 		// 	next({error: "user realm not found"});
// 		// 	return;
// 		}
// 	}

var updateDataSource2 = function(user, app, next) {

		// var ctx = loopback.getCurrentContext();
		// var user = ctx && ctx.get('user');
		// console.log("user: " + JSON.stringify(user));
		// console.log('user.username: ', user.username);
		//
		// console.log(dataSourceMap)

		// console.log("attachedDataSource " + attachedDataSource);

		if (user) {
			console.log("realm: " + user.realm)
		}
		// if (user && user.realm == "cbre") {
		if (user && user.realm) {
			var wait = false;
			if (!dataSourceMap[user.realm] || attachedDataSource != dataSourceMap[user.realm]) {
			// if (!dataSourceMap[user.realm] || attachedDataSource != user.realm) {
				if (!dataSourceMap[user.realm]) {
					console.log("creating dataSource " + user.realm)
					// url = util.format(dataSources.mongoDsRealm.url, user.realm)
					url = util.format(app.get('mongo_url'), user.realm)
					console.log("url: " + url)
					dataSourceMap[user.realm] = loopback.createDataSource({
						connector: "mongodb",
						name: user.realm,
						url: url,
						server: {
  							sslValidate: false
						}
					});
					dataSourceMap[user.realm].on('connected', function() {
						next();
					});
					wait = true;
				}

				console.log("attaching " + user.realm)
				// obj.attachTo(dataSourceMap[user.realm]);
				// attachedDataSource = user.realm;
				attachedDataSource = dataSourceMap[user.realm];

				// console.log("dataSource " + JSON.stringify(dataSource));
			}
			if (!wait) {
				next();
			}
			// beacon.app.models.Beacon.settings.mongodb.collection = "Beacon_User2";
		// } else if (user.realm == "user1") {
		} else {
			// console.log("attachedDataSource " + JSON.stringify(attachedDataSource))
			// console.log("beacon.app.dataSources.mongoDs " + JSON.stringify(beacon.app.dataSources.mongoDs))

			// if (module.exports.attachedDataS && module.exports.attachedDataS != beacon.app.dataSources.mongoDs) {
			if (attachedDataSource != app.dataSources.mongoDs) {
				console.log("attaching dev");
				// console.log("dataSources: " + dataSources.mongoDs.username);
				// obj.attachTo(app.dataSources.mongoDs);
				// module.exports.attachedDataS = beacon.app.dataSources.mongoDs;
				attachedDataSource = app.dataSources.mongoDs;
			}
			next();

			// beacon.app.models.Beacon.settings.mongodb.collection = "Beacon";
		// } else {
		// 	next({error: "user realm not found"});
		// 	return;
		}
	}


var updateDataSource3 = function(user, model, next) {

		// var ctx = loopback.getCurrentContext();
		// var user = ctx && ctx.get('user');
		// console.log("user: " + JSON.stringify(user));
		// console.log('user.username: ', user.username);
		//
		// console.log(dataSourceMap)

		// console.log("attachedDataSource " + attachedDataSource);

		connector = model.getDataSource().connector;

		if (user) {
			console.log("realm: " + user.realm)
		}
		// if (user && user.realm == "cbre") {
		if (user && user.realm) {

			console.log("using " + user.realm);
			url = util.format(model.app.get('mongo_url'), user.realm)
			connector.url = url;

			// var wait = false;
			// if (!dataSourceMap[user.realm] || attachedDataSource != dataSourceMap[user.realm]) {
			// // if (!dataSourceMap[user.realm] || attachedDataSource != user.realm) {
			// 	if (!dataSourceMap[user.realm]) {
			// 		console.log("creating dataSource " + user.realm)
			// 		// url = util.format(dataSources.mongoDsRealm.url, user.realm)
			// 		url = util.format(app.get('mongo_url'), user.realm)
			// 		console.log("url: " + url)
			// 		dataSourceMap[user.realm] = loopback.createDataSource({
			// 			connector: "mongodb",
			// 			url: url,
			// 			server: {
  	// 						sslValidate: false
			// 			}
			// 		});
			// 		dataSourceMap[user.realm].on('connected', function() {
			// 			next();
			// 		});
			// 		wait = true;
			// 	}

			// 	console.log("attaching " + user.realm)
			// 	// obj.attachTo(dataSourceMap[user.realm]);
			// 	// attachedDataSource = user.realm;
			// 	attachedDataSource = dataSourceMap[user.realm];

			// 	// console.log("dataSource " + JSON.stringify(dataSource));
			// }
			// if (!wait) {
				next();
			// }
			// beacon.app.models.Beacon.settings.mongodb.collection = "Beacon_User2";
		// } else if (user.realm == "user1") {
		} else {
			console.log("using dev");
			connector.settings.url = util.format(model.app.get('mongo_url'), "dev");
			connector.disconnect(function() {
				connector.db = undefined;
				connector.connect(function() {
					next();
				});
			});
			// console.log("attachedDataSource " + JSON.stringify(attachedDataSource))
			// console.log("beacon.app.dataSources.mongoDs " + JSON.stringify(beacon.app.dataSources.mongoDs))

			// if (module.exports.attachedDataS && module.exports.attachedDataS != beacon.app.dataSources.mongoDs) {
			// if (attachedDataSource != app.dataSources.mongoDs) {
				// console.log("attaching dev");
				// console.log("dataSources: " + dataSources.mongoDs.username);
				// obj.attachTo(app.dataSources.mongoDs);
				// module.exports.attachedDataS = beacon.app.dataSources.mongoDs;
			// 	attachedDataSource = app.dataSources.mongoDs;
			// }

			// beacon.app.models.Beacon.settings.mongodb.collection = "Beacon";
		// } else {
		// 	next({error: "user realm not found"});
		// 	return;
		}
	}
