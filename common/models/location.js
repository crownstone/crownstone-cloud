var updateDS = require('../../server/updateDS.js');

module.exports = function(model) {

	// model.beforeRemote('**', function(context, unused, next) {

	// 	// var ctx = loopback.getCurrentContext();
	// 	// var currentUser = ctx && ctx.get('currentUser');

	// 	// console.log("currentUser: " + JSON.stringify(currentUser));
	// 	// console.log("realm: " + currentUser.realm)

	// 	// if (currentUser.realm == "user2") {
	// 	// 	model.app.models.Location.settings.mongodb.collection = "Location_User2";
	// 	// } else {
	// 	// 	model.app.models.Location.settings.mongodb.collection = "Location";
	// 	// }
	// 	next();

	// });
	//
	model.observe('access', function(ctx, next) {
		console.log("location access", ctx);
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
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		console.log("location:");
		// return updateDS.getDataSource(this);
		return updateDS.getCurrentDataSource(this);
	}

};
