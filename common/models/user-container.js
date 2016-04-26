const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
var loopback = require('loopback');

const DEBUG = true;

module.exports = function(model) {

	model.disableRemoteMethod('getContainers', true);

	var getContainerName = function(id) {
		if (typeof id === 'object') {
			return new String(id).valueOf()
		// } else if (typeof id === 'string') {
		// 	return id;
		} else {
			return id;
		}
	}

	var checkAccess = function(containerName, cb) {

		var currentUser = model.app.accessUtils.getCurrentUser();

		if (containerName !== getContainerName(currentUser.id)) {
			cb("Access denied");
		} else {
			cb();
		}
	}

	// model.beforeRemote('**', function(ctx, instance, next) {
	// 	debug("method.name: ", ctx.method.name);
	// 	next();
	// });

	model.beforeRemote('**', function(ctx, instance, next) {
		checkAccess(ctx.args.containerName, next);
	});

	model._deleteContainer = function (id, next) {

		var containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.deleteContainer(containerName, next);
		})
	}

	model._getFiles = function (id, next) {

		var containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.getFiles(containerName, next);
		})
	}

	model._getFile = function (id, fileId, next) {

		var containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.getFile(containerName, fileId, next);
		})
	}

	model._deleteFile = function (id, fileId, next) {

		var containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.deleteFile(containerName, fileId, next);
		})
	}

	model._upload = function (id, req, next) {

		var containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.upload(containerName, req, next);
		})
	}

	model._download = function (id, fileId, res, next) {

		var containerName = getContainerName(id);
		// checkAccess(containerName, function(err) {
		// 	if (err) return next(err);

			model.download(containerName, fileId, res, next);
		// })
	}

};
