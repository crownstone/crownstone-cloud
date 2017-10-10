"use strict";

const debug = require('debug')('loopback:dobots');
const createPromiseCallback = require('loopback-datasource-juggler/lib/utils').createPromiseCallback;
const _defaults = require('lodash').defaults;
const _get = require('lodash').get;
const Promise = require("bluebird");
let loopback = require('loopback');
const mongodb = require('mongodb');
const idUtil = require('./sharedUtil/idUtil');

module.exports = function(model) {

  model.disableRemoteMethodByName('getContainers');

  let checkAccess = function(requestId, requestOptions, callback) {
    let userIdFromToken = requestOptions && requestOptions.accessToken && requestOptions.accessToken.userId || undefined;

    if (String(userIdFromToken) !== String(requestId)) {
      callback("Access denied");
    }
    else {
      callback();
    }
  };

  // model.beforeRemote('**', function(ctx, instance, next) {
  // 	debug("method.name: ", ctx.method.name);
  // 	next();
  // });

  model.beforeRemote('**', function(ctx, instance, next) {
    checkAccess(ctx.args.containerName, ctx.options, next);
  });

  model._deleteContainer = function (id, options,  next) {
    if (!idUtil.verifyMongoId(id))     { return next({statusCode:400, message:"Invalid id provided."}); }

    checkAccess(id, options, function(err) {
      if (err) return next(err);
      // we cast the IDs to string to avoid having mongo ObjectId objects as input
      model.deleteContainer(String(id), next);
    })
  };

  model._getFiles = function (id, options, next) {
    if (!idUtil.verifyMongoId(id))     { return next({statusCode:400, message:"Invalid id provided."}); }

    checkAccess(id, options, function(err) {
      if (err) return next(err);
      // we cast the IDs to string to avoid having mongo ObjectId objects as input
      model.getFiles(String(id), next);
    })
  };

  model._deleteFile = function (id, fileId, options, next) {
    if (!idUtil.verifyMongoId(id))     { return next({statusCode:400, message:"Invalid id provided."}); }
    if (!idUtil.verifyMongoId(fileId)) { return next({statusCode:400, message:"Invalid file ID."});     }

    checkAccess(id, options, function(err) {
      if (err) return next(err);
      // we cast the IDs to string to avoid having mongo ObjectId objects as input
      model.deleteFile(String(id), fileId, next);
    })
  };

  model._upload = function (id, req, options, next) {
    if (!idUtil.verifyMongoId(id))     { return next({statusCode:400, message:"Invalid id provided."}); }

    checkAccess(id, options, function(err) {
      if (err) return next(err);
      // we cast the IDs to string to avoid having mongo ObjectId objects as input
      model.upload(String(id), req, next);
    })
  };

  model._download = function (id, fileId, res, options, next) {
    if (!fileId) {
      return next({statusCode:404, message:"No profile picture."});
    }

    if (!idUtil.verifyMongoId(id))     { return next({statusCode:400, message:"Invalid id provided."}); }
    if (!idUtil.verifyMongoId(fileId)) { return next({statusCode:400, message:"Invalid file ID."});     }

    // we cast the IDs to string to avoid having mongo ObjectId objects as input
    model.download(String(id), fileId, res, next);
  }

};


