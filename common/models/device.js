var updateDS = require('../../server/middleware/updateDS.js');

module.exports = function(model) {

	// address has to be unique to a beacon
	model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("device.beforeRemote");
		updateDS.update(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		// console.log("device:");
		return updateDS.getDataSource(this);
	}

};
