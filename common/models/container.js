const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
var loopback = require('loopback');

const DEBUG = true;

module.exports = function(model) {

	var userGroups = null;

	var retreiveUserGroups = function(next) {
		if (DEBUG) {
			userGroups = null;
		} else {
			userGroups = [];
		}
		var currentUser = model.app.accessUtils.getCurrentUser();
		// debug("currentUser:", currentUser);
		if (currentUser) {
			if (currentUser.username !== 'superuser') {
				debug("getUserGroups");
				// model.app.accessUtils.getUserGroups(currentUser.getId())
				// 	.then(userGroups => {
				// 		debug("groups:", groups);
		  //       userGroups = Array.from(userGroups, group => group[model.app.accessUtils.options.foreignKey]);
				// 		debug("userGroups:", userGroups);
		  //       // filter[this.options.foreignKey] = { inq: userGroups };
		  //       // return filter;
		  //     });
		  	groups = model.app.accessUtils.getCurrentUserGroups();
				userGroups = Array.from(groups, group => new String(group[model.app.accessUtils.options.foreignKey]).valueOf());
		  	debug("userGroups:", userGroups);
		  }
		  next();
		// } else if (DEBUG) {

		// 	const user = loopback.getModel('user');
		// 	user.find({where: {email: "dominik@dobots.nl"}}, function(err, res) {
		// 		if (err) {
		// 			debug("fatal error");
		// 		} else {
		// 			currentUser = res[0];
		// 			model.app.accessUtils.getUserGroups(currentUser.id, false, function(err, res) {
		// 				if (err) return next(err);
		// 				// debug("res:", res);
		// 				userGroups = Array.from(res, group => new String(group[model.app.accessUtils.options.foreignKey]).valueOf());
		// 				debug("userGroups:", userGroups);

		// 				next();
		// 			});
		// 		}
		// 	})
		} else {
			next();
		}
	}

	var checkAccess = function(id, cb) {

		retreiveUserGroups(function() {
			if (userGroups && userGroups.indexOf(ctx.args.containerName) < 0) {
				cb("Access denied")
			} else {
				cb();
			}
		});
	}

	model.beforeRemote('**', function(ctx, instance, next) {
		debug("method.name: ", ctx.method.name);
		next();
	});

	model.beforeRemote('getContainers', function(ctx, instance, next) {
		retreiveUserGroups(next);
	});

	model.afterRemote('getContainers', function(ctx, instance, next) {
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		// // instance = ["yabadaba"];
		// // ctx.instance = ["yabadaba"];
		// // ctx.result = ["yabadaba"];
		// debug("userGroups:", userGroups);
		// instance.forEach(i => debug(i, userGroups.indexOf(i)))
		// result = instance.filter(res => userGroups.indexOf(res) >= 0)
		// ctx.result = result;
		// // debug("ctx:", ctx);
		// debug("result:", result)

		if (userGroups || !DEBUG) {
			ctx.result = instance.filter(res => userGroups.indexOf(res) >= 0)
		}
		next();
	});

	model.beforeRemote('**', function(ctx, instance, next) {
		if (ctx.method.name === 'getContainers') return next();

		checkAccess(ctx.args.containerName, next);
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		// next();
	});

	model._deleteContainer = function (containerName, next) {

		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.deleteContainer(containerName, next);
		})
	}

	model._getFiles = function (containerName, next) {

		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.getFiles(containerName, next);
		})
	}

	model._getFile = function (containerName, fileId, next) {

		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.getFile(containerName, fileId, next);
		})
	}

	model._deleteFile = function (containerName, fileId, next) {

		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.deleteFile(containerName, fileId, next);
		})
	}

	model._upload = function (containerName, req, next) {

		checkAccess(containerName, function(err) {
			if (err) return next(err);

			model.upload(containerName, req, next);
		})
	}

	model._download = function (containerName, fileId, res, cb) {

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

	// 	if (currentUser.username === 'superuser') {
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
