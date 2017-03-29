"use strict";

const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
const loopback = require('loopback');


module.exports = function(model) {

	let checkAccess = function(sphereId, requestOptions, callback) {
    let userIdFromToken = requestOptions && requestOptions.accessToken && requestOptions.accessToken.userId || undefined;

    if (userIdFromToken) {
      debug("getUserSpheres");
      let sphereAccessModel = loopback.getModel('SphereAccess');
      sphereAccessModel.findOne({where:{userId: userIdFromToken, sphereId: sphereId}})
				.then((sphereAccessMatch) => {
						if (sphereAccessMatch === null) {
              debug("Access denied");
              callback("Access denied");
						}
						else {
              debug("Access ok");
              callback();
						}
				})
				.catch((err) => {
      		callback(err);
      	})
    }
    else {
      debug("Access denied");
      callback("Access denied");
		}
	};

	// model.beforeRemote('**', function(ctx, instance, next) {
	// 	debug("method.name: ", ctx.method.name);
	// 	next();
	// });

	model.beforeRemote('getContainers', function(ctx, instance, next) {
		// retrieveUserSpheres(ctx, instance, next);
		next()
	});

	model.afterRemote('getContainers', function(ctx, instance, next) {
		// if (userSpheres || !DEBUG) {
		// 	let containerName = getContainerName(id);
		// 	ctx.result = instance.filter(res => userSpheres.indexOf(containerName) >= 0)
		// }
		// debug("after remote get containers");
		next();
	});

	model.beforeRemote('**', function(ctx, instance, next) {
		if (ctx.method.name === 'getContainers') return next();

		checkAccess(ctx.args.containerName, ctx.options, next);
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		// next();
	});

	model._deleteContainer = function (id, options, next) {
		checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.deleteContainer(id, next);
		})
	};

	model._getFiles = function (id, options, next) {
		checkAccess(id, options, function(err) {
			if (err) return next(err);

			debug("getFiles", id);
			model.getFiles(id, function(err, succ) {
				// debug("err", err);
				// debug("succ", succ);
				next(err, succ);
			});
		})
	};

	model._deleteFile = function (id, fileId, options, next) {

    checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.deleteFile(id, fileId, options, next);
		})
	};

	model._upload = function (id, req, options, next) {

    checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.upload(id, req, next);
		})
	};

	model._download = function (id, fileId, res, options, next) {

    checkAccess(id, options, function(err) {
			if (err) return next(err);

			model.download(id, fileId, res, next);
		})
	};

};
