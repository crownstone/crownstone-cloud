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

	model.beforeRemote('**', function(ctx, unused, next) {
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		// return updateDS.getDataSource(this);
		return updateDS.getCurrentDataSource(this);
	}

};
