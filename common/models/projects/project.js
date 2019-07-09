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
    // OWNER:
    //   - everything
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$owner",
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




  /************************************
   **** Model Validation
   ************************************/

  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('replaceById');

  model.disableRemoteMethodByName('prototype.__head__viewers');
  model.disableRemoteMethodByName('prototype.__create__viewers');
  model.disableRemoteMethodByName('prototype.__count__viewers');
  model.disableRemoteMethodByName('prototype.__delete__viewers');
  model.disableRemoteMethodByName('prototype.__destroyById__viewers');
  model.disableRemoteMethodByName('prototype.__deleteById__viewers');
  model.disableRemoteMethodByName('prototype.__updateById__viewers');
  model.disableRemoteMethodByName('prototype.__removeById__viewers');
  model.disableRemoteMethodByName('prototype.__exists__viewers');
  model.disableRemoteMethodByName('prototype.__findById__viewers');

  //
  model.disableRemoteMethodByName('prototype.__head__installers');
  model.disableRemoteMethodByName('prototype.__create__installers');
  model.disableRemoteMethodByName('prototype.__count__installers');
  model.disableRemoteMethodByName('prototype.__delete__installers');
  model.disableRemoteMethodByName('prototype.__destroyById__installers');
  model.disableRemoteMethodByName('prototype.__deleteById__installers');
  model.disableRemoteMethodByName('prototype.__updateById__installers');
  model.disableRemoteMethodByName('prototype.__removeById__installers');
  model.disableRemoteMethodByName('prototype.__exists__installers');
  model.disableRemoteMethodByName('prototype.__findById__installers');
  // model.disableRemoteMethodByName('prototype.__get__installers');
  //
  model.disableRemoteMethodByName('prototype.__head__subProjects');
  model.disableRemoteMethodByName('prototype.__create__subProjects');
  model.disableRemoteMethodByName('prototype.__count__subProjects');
  model.disableRemoteMethodByName('prototype.__link__subProjects');
  model.disableRemoteMethodByName('prototype.__unlink__subProjects');
  model.disableRemoteMethodByName('prototype.__delete__subProjects');
  model.disableRemoteMethodByName('prototype.__deleteById__subProjects');


  model.observe('before save', injectOwner);

  function injectOwner(ctx, next) {
    console.log("X")

    console.log(ctx.isNewInstance)
    console.log(ctx.instance)

    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;
    if (!ctx.instance.ownerId) {
      ctx.instance.ownerId = userId;
      next();
    }
    else {
      next();
    }
  }

  model.createSubproject = function(projectId, name, userEmail, totalNumberOfRequiredCrownstones, numberOfSwitchcraft, options, callback) {
    let userIdFromContext = options && options.accessToken && options.accessToken.userId || undefined;
    let SphereModel = loopback.getModel("Sphere");
    let SphereKeyModel = loopback.getModel("SphereKeys");
    let SubProjectModel = loopback.getModel("SubProject");

    let sphere;
    let keys;
    let project;
    let uid;

    model.findById(projectId, {}, (err, projectResult) => {
      if (err) { return callback(err); }
      project = projectResult;

      // create a sphere for this project.
      SphereModel.create({name: name, ownerId: userIdFromContext})
        .then((sphereResult) => {
          sphere = sphereResult;
          // get keys
          return SphereKeyModel.find({where:{sphereId: sphere.id}})
        })
        .then((sphereKeys) => {
          let allKeys = {};
          sphereKeys.forEach((key) => {
            if (key.ttl === 0) {
              allKeys[key.keyType] = key.key;
            }
          })
          keys = allKeys;

          // generate short uid and check for uniqueness
          return checkSubProjectUidUniqueness();
        })
        .then((uidUnique) => {
          uid = uidUnique;

          return SubProjectModel.create({
            name: name,
            userEmail: userEmail,
            sphereKeys: JSON.stringify(keys),
            projectId: projectId,
            sphereId: sphere.id,
            shortId: uid,
            totalNumberOfCrownstones: totalNumberOfRequiredCrownstones,
            numberOfSwitchcraft: numberOfSwitchcraft,
          })
        })
        .then((result) => {
          callback(null, result);
        })
        .catch((err) => {
          callback(err);
        })
    })
  }


  const checkSubProjectUidUniqueness = function(projectId) {
    let SubProjectModel = loopback.getModel("SubProject");
    let uid = Math.floor((Math.random()*1e12+1e5) % 1e6);
    return SubProjectModel.find({where: {and: [{projectId: projectId}, {uid: uid}]}})
      .then((result) => {
        if (result.length != 0) {
          return checkSubProjectUidUniqueness(projectId)
        }
        return uid;
      })

  }

  model.remoteMethod(
    'createSubproject',
    {
      http: {path: '/:id/subProject', verb: 'post'},
      accepts: [
        {arg: 'id',                               type: 'any', required: true, http: { source : 'path' }},
        {arg: 'name',                             type: 'string', required: true, http: { source : 'query' }},
        {arg: 'userEmail',                        type: 'string', required: true, http: { source : 'query' }},
        {arg: 'totalNumberOfRequiredCrownstones', type: 'number', required: true, http: { source : 'query' }},
        {arg: 'numberOfSwitchcraft',              type: 'number', required: true, http: { source : 'query' }},
        {arg: "options",                          type: "object", http: "optionsFromRequest"},
      ],
      description: "Create a subproject."
    }
  );

  model.remoteMethod(
    'deleteSubproject',
    {
      http: {path: '/:id/subProject', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Create a subproject."
    }
  );









};
