var updateDS = require('../../server/updateDS.js');

module.exports = function(model) {

	// address has to be unique to a beacon
	model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

	model.beforeRemote('**', function(ctx, unused, next) {
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		// return updateDS.getDataSource(this);
		return updateDS.getCurrentDataSource(this);
	}

};
