var updateDS = require('../../server/middleware/updateDS.js');

module.exports = function(model) {

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("beacon-location.beforeRemote");
		// next();
		updateDS.update(ctx.req.accessToken, model.app, next);
	});

	model.afterRemote('**', function (ctx, unused, next) {
		console.log("beacon-location.afterRemote");
		next();
	});

	model.getDataSource = function() {
		// console.log("beacon location:");
		return updateDS.getDataSource(this);
	}


};
