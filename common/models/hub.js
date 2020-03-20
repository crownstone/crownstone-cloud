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
}