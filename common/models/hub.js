let loopback = require('loopback');
const idUtil = require('./sharedUtil/idUtil');
const debug = require('debug')('loopback:crownstone');
const util = require('./sharedUtil/util')
const constants = require('./sharedUtil/constants')

const uid = require("uid2")

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    });

    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "ALLOW",
      "property": "login"
    });

    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$group:admin",
      "permission": "ALLOW"
    });

    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$group:hub",
      "permission": "ALLOW"
    });
  }

  model.disableRemoteMethodByName('prototype.__get__accessTokens');
  model.disableRemoteMethodByName('prototype.__count__accessTokens');
  model.disableRemoteMethodByName('prototype.__exists__accessTokens');
  model.disableRemoteMethodByName('prototype.__link__accessTokens');
  model.disableRemoteMethodByName('prototype.__unlink__accessTokens');
  model.disableRemoteMethodByName('prototype.__findById__accessTokens');
  model.disableRemoteMethodByName('prototype.__updateById__accessTokens');
  model.disableRemoteMethodByName('prototype.__unlink__accessTokens');
  model.disableRemoteMethodByName('prototype.__deleteById__accessTokens');
  model.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  model.disableRemoteMethodByName('prototype.__create__accessTokens');
  model.disableRemoteMethodByName('prototype.__delete__accessTokens');

  model.disableRemoteMethodByName('prototype.__get__location');
  model.disableRemoteMethodByName('prototype.__get__linkedStone');
  model.disableRemoteMethodByName('prototype.__get__sphere');

  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('createChangeStream');

  model.observe('after save', afterSave);

  function afterSave(ctx, next) {
    if (ctx.isNewInstance) {
      enforceUniqueness(ctx, (err) => {
        if (err) {
          return next(err);
        }
        next()
      })
    }
    else {
      next();
    }
  }

  function enforceUniqueness(ctx, next) {
    // debug("ctx", ctx);
    let item = ctx.instance;
    if (item) {
      // double check if the address is indeed unique in this sphere.
      model.find({where: {and: [{sphereId: item.sphereId}, {token: item.token}]}, order: "createdAt ASC"})
        .then((results) => {
          if (results.length > 1) {
            // delete all but the first one
            for (let i = 1; i < results.length; i++) {
              model.destroyById(results[i].id).catch((err) => {});
            }
            let err = {
              "statusCode": 422,
              "name": "ValidationError",
              "message": "The `Hub` instance is not valid. Details: `token` a hub with this address was already added! (value: \"string\")."
            };
            return next(err);
          }
          else {
            next();
          }
        })
        .catch((err) => {
          next(err);
        })
    } else {
      next();
    }
  }

  model.login = function(id, token, callback) {
    const CrownstoneAccessToken = loopback.getModel("CrownstoneAccessToken");
    model.findById(id)
      .then((result) => {
        if (!result) { throw util.unauthorizedError() }

        if (result.token === token) {
          return CrownstoneAccessToken.create({
            id: uid(64),
            userId: id,
            principalType: 'Hub'
          })
        }
        else {
          throw util.unauthorizedError()
        }
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((err) => {
        callback(err);
      })

  };


  model.remoteMethod(
    'login',
    {
      http: {path: '/:id/login', verb: 'post'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: 'token', type: 'string', required: true, http: { source : 'query' }}
      ],
      returns: {arg: 'token', type: 'CrownstoneAccessToken', root: true},
      description: "Add a hub to this sphere."
    }
  );

  model.setHubLocalIP = function(hubId, localIpAddress, httpPort, httpsPort, options, callback) {
    let externalIp = CACHED_IP;
    CACHED_IP = null;

    if (!externalIp) {
      return callback("No External IP obtained...");
    }

    if (options && options.accessToken && options.accessToken.principalType === 'Hub') {
      let tokenHubId = options.accessToken.userId;
      if (String(hubId) != String(tokenHubId)) { return callback(util.unauthorizedError()); }
      const hubModel = loopback.getModel("Hub");
      hubModel.findById(hubId)
        .then((result) => {
          if (!result) { throw "No hub found."}

          result.httpPort  = httpPort  || result.httpPort;
          result.httpsPort = httpsPort || result.httpsPort;
          result.localIPAddress = localIpAddress;
          result.externalIPAddress = externalIp;
          result.lastSeen = new Date();

          return result.save();
        })
        .then(() => {
          callback();
        })
        .catch((err) => { callback(err); })
    }
    else {
      callback(util.unauthorizedError());
    }
  }

  let CACHED_IP = null;

  model.beforeRemote('setHubLocalIP', function(context, user, next) {
    let ip = context.req.headers['x-forwarded-for'] || context.req.ip || context.req.connection.remoteAddress;

    if (ip.substr(0, 7) == "::ffff:") {
      ip = ip.substr(7)
    }
    CACHED_IP = ip || null;
    next()
  });

  model.remoteMethod(
    'setHubLocalIP',
    {
      http: {path: '/:id/localIP', verb: 'put'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: 'localIpAddress',  type: 'string', required: true, http: { source : 'query' }},
        {arg: 'httpPort',  type: 'string', required: false, http: { source : 'query' }},
        {arg: 'httpsPort', type: 'string', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Set the local IP address of the hub."
    }
  );

  model.getHubToken = function(id, options, next) {
    model.findById(id)
      .then((result) => {
        if (result) {
          next(null, result.token);
        }
      })
      .catch((err) => { next(err) })
  }

  model.remoteMethod(
    'getHubToken',
    {
      http: {path: '/:id/token', verb: 'get'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'token', type: 'string', root: true},
      description: "Obtain the token this hub uses to login"
    }
  );

  model.getUartKey = function(id, options, next) {
    let Stone     = loopback.getModel("Stone");
    let StoneKeys = loopback.getModel("StoneKeys");
    let sphereId;
    let linkedStoneId;
    model.findById(id)
      .then((result) => {
        if (!result) { throw "Not Available" }

        linkedStoneId = result.linkedStoneId;
        sphereId = result.sphereId;

        if (!linkedStoneId) {
          throw "No linked stone"
        }
        return Stone.find({where:{sphereId: sphereId, id: linkedStoneId}})
      })
      .then((stones) => {
        if (stones.length === 0) { throw util.customError(404, "STONE_NOT_FOUND", "Stone not available"); }

        let stoneId = stones[0].id;
        return StoneKeys.find({where:{stoneId: stoneId, sphereId, keyType: constants.KEY_TYPES.DEVICE_UART_KEY}})
      })
      .then((keyResult) => {
        if (keyResult.length === 0) { throw util.customError(404, "KEY_NOT_FOUND", "Key not available") }
        next(null, keyResult[0].key);
      })
      .catch((err) => { next(err) })
  }

  model.remoteMethod(
    'getUartKey',
    {
      http: {path: '/:id/uartKey', verb: 'get'},
      accepts: [
        {arg: 'id',      type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'uartKey', type: 'string', root: true},
      description: "Obtain the uartKey to talk to the linked Crownstone module"
    }
  );

}
