const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
var loopback = require('loopback');

const DEBUG = true;

module.exports = function(model) {

	var userSpheres = null;

	var getContainerName = function(id) {
		if (typeof id === 'object') {
			return new String(id).valueOf()
		// } else if (typeof id === 'string') {
		// 	return id;
		} else {
			return id;
		}
	}

	var retreiveUserSpheres = function(next) {
		if (DEBUG) {
			userSpheres = null;
		} else {
			userSpheres = [];
		}
		var currentUser = model.app.accessUtils.getCurrentUser();
		// debug("currentUser:", currentUser);
		if (currentUser) {
			if (currentUser.role !== 'superuser') {
				debug("getUserSpheres");
					// model.app.accessUtils.getUserSpheres(currentUser.getId())
					// 	.then(userSpheres => {
					// 		debug("spheres:", spheres);
				//       userSpheres = Array.from(userSpheres, sphere => sphere[model.app.accessUtils.options.foreignKey]);
					// 		debug("userSpheres:", userSpheres);
				//       // filter[this.options.foreignKey] = { inq: userSpheres };
				//       // return filter;
				//     });
				spheres = model.app.accessUtils.getCurrentUserSpheres();
				userSpheres = Array.from(spheres, sphere => new String(sphere[model.app.accessUtils.options.foreignKey]).valueOf());
				debug("userSpheres:", userSpheres);
			}
			next();
			// } else if (DEBUG) {

			// 	const user = loopback.getModel('user');
			// 	user.find({where: {email: "dominik@dobots.nl"}}, function(err, res) {
			// 		if (err) {
			// 			debug("fatal error");
			// 		} else {
			// 			currentUser = res[0];
			// 			model.app.accessUtils.getUserSpheres(currentUser.id, false, function(err, res) {
			// 				if (err) return next(err);
			// 				// debug("res:", res);
			// 				userSpheres = Array.from(res, sphere => new String(sphere[model.app.accessUtils.options.foreignKey]).valueOf());
			// 				debug("userSpheres:", userSpheres);

			// 				next();
			// 			});
			// 		}
			// 	})
		} else {
			next();
		}
	}

	var checkAccess = function(id, cb) {

		var containerName = getContainerName(id);
		retreiveUserSpheres(function() {
			// debug("id", id);
			// debug("userSpheres.indexOf(id)", userSpheres.indexOf(containerName));
			if (userSpheres && userSpheres.indexOf(containerName) < 0) {
				debug("Access denied");
				cb("Access denied");
			} else {
				debug("Access ok");
				cb();
			}
		});
	}

	model.beforeRemote('**', function(ctx, instance, next) {
		debug("method.name: ", ctx.method.name);
		next();
	});

	model.beforeRemote('getContainers', function(ctx, instance, next) {
		retreiveUserSpheres(next);
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
			var containerName = getContainerName(id);
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

			debug("getFiles", containerName);
			model.getFiles(containerName, function(err, succ) {
				debug("err", err);
				debug("succ", succ);
				next(err, succ);
			});
		})
	}

	model._getFile = function (id, fileId, next) {

		var containerName = getContainerName(id);
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.getFile(containerName, fileId, function(err, succ) {
				debug("err", err);
				debug("succ", succ);
				next(err, succ);
			});
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
		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.download(containerName, fileId, res, next);
		})
	}

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
