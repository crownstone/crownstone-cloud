var loopback = require('loopback');

module.exports = function(location) {

	location.beforeRemote('**', function(context, unused, next) {

		var ctx = loopback.getCurrentContext();
		var currentUser = ctx && ctx.get('currentUser');

		console.log("currentUser: " + JSON.stringify(currentUser));
		console.log("realm: " + currentUser.realm)

		if (currentUser.realm == "user2") {
			location.app.models.Location.settings.mongodb.collection = "Location_User2";
		} else {
			location.app.models.Location.settings.mongodb.collection = "Location";
		}
		next();

	});

};
