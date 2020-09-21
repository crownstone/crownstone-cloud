let loopback = require('loopback');
const idUtil = require('./sharedUtil/idUtil');
const debug = require('debug')('loopback:crownstone');
const util = require('./sharedUtil/util')

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
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "ALLOW",
      "property": "setHubLocalIP"
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

  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('createChangeStream');

  model.validatesUniquenessOf('token', {scopedTo: ['sphereId'], message: 'a hub with this token was already added!'});

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

  model.setHubLocalIP = function(hubId, localIpAddress, options, callback) {
    let externalIp = CACHED_IP;
    CACHED_IP = null;

    if (!externalIp) {
      return callback("No External IP obtained...");
    }

    if (options && options.accessToken && options.accessToken.principalType === 'Hub') {
      let tokenHubId = options.accessToken.userId;
      if (hubId !== tokenHubId) { return callback(util.unauthorizedError()); }
      const hubModel = loopback.getModel("Hub");
      hubModel.findById(hubId)
        .then((result) => {
          if (!result) { throw "No hub found."}

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
      http: {path: '/localIP', verb: 'put'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: 'localIpAddress',  type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Set the local IP address of the hub."
    }
  );


}
