"use strict";

const loopback = require('loopback');
const app = require('../../../server/server');


module.exports = function(model) {

  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$everyone",
        "permission": "DENY"
      }
    );

    //***************************
    // AUTHENTICATED:
    //   - create new sphere
    //***************************
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$authenticated",
        "permission": "ALLOW",
        "property": "create"
      }
    );

    //***************************
    // ADMIN:
    //   - everything
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:admin",
        "permission": "ALLOW"
      }
    );

    //***************************
    // Viewer:
    //   - TODO
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:viewer",
        "permission": "DENY"
      }
    );

    //***************************
    // Installer:
    //   - TODO
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:installer",
        "permission": "DENY"
      }
    );
  }


  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('replaceOrCreate');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('exists');
  model.disableRemoteMethodByName('findById');
  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('destroyById');
  model.disableRemoteMethodByName('deleteById');
  model.disableRemoteMethodByName('count');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('createChangeStream');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('replaceOrCreate');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('prototype.patchAttributes');
  model.disableRemoteMethodByName('patchById');
  model.disableRemoteMethodByName('upsertWithWhere');
  model.disableRemoteMethodByName('prototype.__get__owner');


  model.createSubproject = function(projectId, options, callback) {

  }

  model.remoteMethod(
    'prepare',
    {
      http: {path: '/:id/setPreparedCrownstones', verb: 'put'},
      accepts: [
        {arg: 'id',                          type: 'any', required: true, http: { source : 'path'  }},
        {arg: 'numberOfPreparedCrownstones', type: 'any', required: true, http: { source : 'query' }},
        {arg: "options",                     type: "object", http: "optionsFromRequest"},
      ],
      description: "Create a subproject."
    }
  );

  model.remoteMethod(
    'preparedCrownstone',
    {
      http: {path: '/:id/submitFailedCrownstone', verb: 'put'},
      accepts: [
        {arg: 'id',                        type: 'any', required: true, http: { source : 'path' }},
        {arg: 'numberOfFailedCrownstones', type: 'any', required: true, http: { source : 'query' }},
        {arg: "options",                   type: "object", http: "optionsFromRequest"},
      ],
      description: "Create a subproject."
    }
  );

  model.remoteMethod(
    'requestSetupData',
    {
      http: {path: '/:id/requestSetupData', verb: 'get'},
      accepts: [
        {arg: 'id',                type: 'any', required: true, http: { source : 'path' }},
        {arg: 'installationToken', type: 'any', required: true, http: { source : 'query' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      description: "Create a subproject."
    }
  );

  model.remoteMethod(
    'markAsFinished',
    {
      http: {path: '/:id/markAsFinished', verb: 'post'},
      accepts: [
        {arg: 'id',                type: 'any', required: true, http: { source : 'path' }},
        {arg: 'areYouSure',        type: 'any', required: true, http: { source : 'path' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      description: "Finalize and deliver the subproject after installation."
    }
  );


  model.getInfo = function(id, options, callback) {
    callback()
  }

  model.remoteMethod(
    'getInfo',
    {
      http: {path: '/:id', verb: 'get'},
      accepts: [
        {arg: 'id',                type: 'any', required: true, http: { source : 'path' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      description: "Get information on this subproject."
    }
  );




};
