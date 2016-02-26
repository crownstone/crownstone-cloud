var updateDS = require('../../server/middleware/updateDS.js');

module.exports = function(model) {

	model.beforeRemote('**', function(ctx, unused, next) {
		console.log("location before remote");
		next();
	});

	model.getDataSource = function() {
		// console.log("location:");
		return updateDS.getDataSource(this);
	}

};
