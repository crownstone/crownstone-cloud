var updateDS = require('../../server/updateDS.js');

module.exports = function(model) {

	model.validatesUniquenessOf('customId', {message: 'a person with this custom Id was already added!'});

	model.beforeRemote('**', function(ctx, unused, next) {
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		// return updateDS.getDataSource(this);
		return updateDS.getCurrentDataSource(this);
	}

};
