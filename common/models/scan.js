var updateDS = require('../../server/updateDS.js');
var loopback = require('loopback');

module.exports = function(model) {

	// var connector = model.app.models.Scan.getDataSource().connector;
	// connector.observe('before execute', function(ctx, next) {
	// 	console.log("scan before execute");
	// 	var ctx = loopback.getCurrentContext();
	// 	var currentUser = ctx && ctx.get('currentUser');
	// 	console.log("currentUser: " + JSON.stringify(currentUser));
	// });
	//
	// model.afterInitialize = function() {
	// 	console.log("Scan.afterInitialize");
	// }

	// model.beforeValidate = function(next, modelInstance) {
	// 	console.log("Scan.beforeValidate");
	// 	next();
	// };

	// model.beforeCreate = function(next, modelInstance) {
	// 	console.log("Scan.beforeCreate");
	// 	next();
	// };

	// model.beforeSave = function(next, modelInstance) {
	// 	console.log("Scan.beforeSave");
	// 	next();
	// };

	// model.beforeUpdate = function(next, modelInstance) {
	// 	console.log("Scan.beforeUpdate");
	// 	next();
	// };

	// model.beforeDestroy = function(next, modelInstance) {
	// 	console.log("Scan.beforeDestroy");
	// 	next();
	// };

	model.beforeRemote('**', function(ctx, unused, next) {
		updateDS.updateDS(ctx.req.accessToken, model.app, next);
	});

	model.getDataSource = function() {
		// return updateDS.getDataSource(this);
		return updateDS.getCurrentDataSource(this);
	}

	// model.getDataSource = function() {
	// 	console.log("Scan.getDataSource");
	// 	// return updateDS.getDataSource(this);
	// 	return updateDS.getCurrentDataSource(this);
	// }

	// model.beforeRemote('**', function(ctx, unused, next) {
	// 	console.log("scan beforeRemote");
	// 	console.log(ctx.req.accessToken);
	// 	next();
	// 	// updateDS.update(model.app.models.Scan, model.app, ctx.req.accessToken, next);
	// });

	model.observe('access', function(ctx, next) {
		console.log("scan observe access");
		console.log('Accessing %s matching %s', ctx.Model.modelName, ctx.query.where);
		console.log(ctx.options.remoteCtx.req.accessToken);
		next();
		// updateDS.update(model.app.models.Scan, model.app, ctx.options.remoteCtx.req.accessToken, next);
	});

	// model.beforeRemote('**', function(context, unused, next) {
	// 	updateDS.update(model.app.models.Scan, model.app.dataSources, next);
	// });

};
