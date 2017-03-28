// "use strict";

const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
let loopback = require('loopback');

const DEBUG = true;

module.exports = function(model) {

	let userSpheres = null;

	let getContainerName = function(id) {
		if (typeof id === 'object') {
			return new String(id).valueOf();
		// } else if (typeof id === 'string') {
		// 	return id;
		} else {
			return id;
		}
	};

	let retrieveUserSpheres = function(next) {
		if (DEBUG) {
			userSpheres = null;
		} else {
			userSpheres = [];
		}
		let currentUser = model.app.accessUtils.getCurrentUser();
		// debug("currentUser:", currentUser);
		if (currentUser) {
			if (currentUser.role !== 'superuser') {
				debug("getUserSpheres");
				let spheres = model.app.accessUtils.getCurrentUserGroups();
				userSpheres = Array.from(spheres, sphere => new String(sphere[model.app.accessUtils.options.foreignKey]).valueOf());
			}
			next();
		} else {
			next();
		}
	};

	let checkAccess = function(id, callback) {

		let containerName = getContainerName(id);
		retrieveUserSpheres(function() {
			// debug("id", id);
			// debug("userSpheres.indexOf(id)", userSpheres.indexOf(containerName));
			if (userSpheres && userSpheres.indexOf(containerName) < 0) {
				debug("Access denied");
				callback("Access denied");
			} else {
				debug("Access ok");
				callback();
			}
		});
	};

	// model.beforeRemote('**', function(ctx, instance, next) {
	// 	debug("method.name: ", ctx.method.name);
	// 	next();
	// });

	model.beforeRemote('getContainers', function(ctx, instance, next) {
		retrieveUserSpheres(ctx, instance, next);
	});

	model.afterRemote('getContainers', function(ctx, instance, next) {
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		// // instance = ["yabadaba"];
		// // ctx.instance = ["yabadaba"];
		// // ctx.result = ["yabadaba"];
		// debug("userSpheres:", userSpheres);
		// instance.forEach(i => debug(i, userSpheres.indexOf(i)))
		// result = instance.filter(res => userSpheres.indexOf(res) >= 0)
		// ctx.result = result;
		// // debug("ctx:", ctx);
		// debug("result:", result)

		if (userSpheres || !DEBUG) {
			let containerName = getContainerName(id);
			ctx.result = instance.filter(res => userSpheres.indexOf(containerName) >= 0)
		}
		// debug("after remote get containers");
		next();
	});

	model.beforeRemote('**', function(ctx, instance, next) {
		if (ctx.method.name === 'getContainers') return next();

		checkAccess(ctx.args.containerName, next);
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		// next();
	});

	model._deleteContainer = function (id, next) {
		console.log("HERE")
		let containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.deleteContainer(containerName, next);
		})
	};

	model._getFiles = function (id, next) {

		let containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			debug("getFiles", containerName);
			model.getFiles(containerName, function(err, succ) {
				// debug("err", err);
				// debug("succ", succ);
				next(err, succ);
			});
		})
	};

	model._getFile = function (id, fileId, next) {

		let containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.getFile(containerName, fileId, function(err, succ) {
				// debug("err", err);
				// debug("succ", succ);
				next(err, succ);
			});
		})
	};

	model._deleteFile = function (id, fileId, next) {

		let containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.deleteFile(containerName, fileId, next);
		})
	};

	model._upload = function (id, req, next) {

		let containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.upload(containerName, req, next);
		})
	};

	model._download = function (id, fileId, res, next) {

		let containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.download(containerName, fileId, res, next);
		})
	};

	// model.observe('access', (ctx, next) => {
	// 	const currentUser = accessUtils.getCurrentUser();

	// 	if (currentUser) {
	// 	// Do noinvoice if options.skipAccess has been set.
	// 	if (ctx.options.skipAccess) {
	// 		debug('skipAccess: true - skipping access filters');
	// 		return next();
	// 	}

	// 	// Do noinvoice if the request is being made against a single model instance.
	// 	if (_get(ctx.query, 'where.id')) {
	// 		debug('looking up by Id - skipping access filters');
	// 		return next();
	// 	}

	// 	if (currentUser.role === 'superuser') {
	// 		debug('skipping access filters for superuser');
	// 		return next();
	// 	}

	// 	debug('%s observe access: query=%s, options=%o, hookState=%o',
	// 		Model.modelName, JSON.stringify(ctx.query, null, 4), ctx.options, ctx.hookState);

	// 	return this.buildFilter(currentUser.getId())
	// 		.then(filter => {
	// 		debug('filter: %o', filter);
	// 		const where = ctx.query.where ? {
	// 			and: [ ctx.query.where, filter ]
	// 		} : filter;

	// 		ctx.query.where = where;
	// 		debug('where query modified to: %s', JSON.stringify(ctx.query, null, 4));
	// 		});
	// 	}
	// 	return next();
	// });

};
