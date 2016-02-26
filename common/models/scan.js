var updateDS = require('../../server/middleware/updateDS.js');
var loopback = require('loopback');

module.exports = function(model) {

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("scan.beforeRemote");
		updateDS.update(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		return updateDS.getDataSource(this);
	}

};
