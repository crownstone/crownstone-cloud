"use strict";

let loopback = require('loopback');

const debug = require('debug')('loopback:crownstone');

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    });

    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "ALLOW",
      "property": "*"
    });
  }

  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('destroyById');
  model.disableRemoteMethodByName('deleteById');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('findById');
  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('prototype.patchAttributes');

  model.disableRemoteMethodByName('replaceOrCreate');           // disable PUT	    api/model/
  model.disableRemoteMethodByName('prototype.__get__owner');    // disable get owner

  // odd endpoints which we do not use.
  model.disableRemoteMethodByName('upsert');                    // disable POST     api/model/upsertWithWhere
  model.disableRemoteMethodByName('upsertWithWhere');           // disable POST     api/model/upsertWithWhere
  model.disableRemoteMethodByName('exists');                    // disable GET	    api/model/:id/exists
  model.disableRemoteMethodByName('findOne');                   // disable GET	    api/model/findOne
  model.disableRemoteMethodByName('count');                     // disable GET	    api/model/count
  model.disableRemoteMethodByName('createChangeStream');        // disable POST	    api/model/change-stream
  model.disableRemoteMethodByName('updateAll');                 // disable POST	    api/model/update
  model.disableRemoteMethodByName('replaceOrCreate');           // disable POST	    api/model/replaceOrCreate


  model.getChanges = function(filter, options, callback) {

    if (options && options.accessToken) {
      let userId = options.accessToken.userId;
      // get get all sphereIds the user has access to.
      const sphereAccess = loopback.getModel("SphereAccess");
      sphereAccess.find({where: {userId: userId}, fields: {sphereId: true}})
        .then((results) => {
          let possibleIds = [];
          for (let i = 0; i < results.length; i++) {
            possibleIds.push(results[i].sphereId);
          }

          let sphereFilter = [{sphereId: {inq: possibleIds}}];
          if (filter && filter.where) {
            if (filter.where.and) {
              for (let j = 0; j < filter.where.and.length; j++) {
                sphereFilter.push(filter.where.and[j]);
              }
            }
            else {
              sphereFilter.push(filter.where);
            }
          }

          return model.find({where: {and: sphereFilter}, limit:10})
        })
        .then((result) => {
          callback(null, result);
        })
        .catch((err) => {
          callback(err);
        })
    }
  };


  model.remoteMethod(
    'getChanges',
    {
      http: {path: '/', verb: 'GET'},
      accepts: [
        {arg: 'filter', type: 'object', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: '[Stone]', root: true},
      description: 'This searches the change history of all deleted items. It is limited to returning a maximum of 10 items.'
    }
  );

};
