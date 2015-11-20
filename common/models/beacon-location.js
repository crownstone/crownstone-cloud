var loopback = require('loopback');

module.exports = function(beaconLocation) {

	beaconLocation.beforeRemote('**', function(context, unused, next) {

		var ctx = loopback.getCurrentContext();
		var currentUser = ctx && ctx.get('currentUser');

		console.log("currentUser: " + JSON.stringify(currentUser));
		console.log("realm: " + currentUser.realm)

		if (currentUser.realm == "user2") {
			beaconLocation.app.models.BeaconLocation.settings.mongodb.collection = "BeaconLocation_User2";
		} else {
			beaconLocation.app.models.BeaconLocation.settings.mongodb.collection = "BeaconLocation";
		}
		next();

	});

};
