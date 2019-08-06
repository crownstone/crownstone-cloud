"use strict";

const loopback = require('loopback');
const app = require('../../../server/server');

const accessTypes = {
  admin: 'admin',
  installer: 'installer',
  viewer: 'viewer'
}

module.exports = function(model) {


  if (app.get('acl_enabled')) {

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
    //   - create new Project
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
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$project:viewer",
        "permission": "ALLOW",
        "property": "__findById__subProjects"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$project:viewer",
        "permission": "ALLOW",
        "property": "getInstallers"
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
        "permission": "__findById__subProjects"
      }
    );
  }




  /************************************
   **** Model Validation
   ************************************/

  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('destroyById');
  // model.disableRemoteMethodByName('find');


  // odd endpoints which we do not use.
  //
  model.disableRemoteMethodByName('prototype.__head__subProjects');
  model.disableRemoteMethodByName('prototype.__create__subProjects');
  model.disableRemoteMethodByName('prototype.__count__subProjects');
  model.disableRemoteMethodByName('prototype.__link__subProjects');
  // model.disableRemoteMethodByName('prototype.__findById__subProjects');
  model.disableRemoteMethodByName('prototype.__updateById__subProjects');
  model.disableRemoteMethodByName('prototype.__unlink__subProjects');
  model.disableRemoteMethodByName('prototype.__delete__subProjects');
  model.disableRemoteMethodByName('prototype.__destroyById__subProjects');


  model.observe('before save', injectOwner);
  model.observe('after save', afterSave);
  function afterSave(ctx, next) {
    if (ctx.isNewInstance) {
      const projectAccessModel = loopback.getModel("ProjectAccess");
      const projectId = ctx.instance.id;
      const token = ctx.options && ctx.options.accessToken;
      const userId = token && token.userId;
      projectAccessModel.create({projectId: projectId, userId: userId, role: accessTypes.admin})
        .then(() => { next(); })
    }
    else {
      next();
    }
  }

  function injectOwner(ctx, next) {
    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;

    if (ctx.isNewInstance) {
      if (!ctx.instance.ownerId) {
        ctx.instance.ownerId = userId;
      }
      next();
    }
    else {
      // disallow changing the owner when updating the sphere
      // so always overwrite the ownerId with the current ownerId
      if (ctx.data && ctx.currentInstance) {
        ctx.data.ownerId = ctx.currentInstance.ownerId;
      }
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


  const getUsers = function(id, options, type, callback) {
    let projectAccessModel = loopback.getModel("ProjectAccess");
    let userModel = loopback.getModel("user");

    projectAccessModel.find({where: {and: [{projectId: id}, {role: type}]}})
      .then((result) => {
        let userIds = [];
        for (let i = 0; i < result.length; i++) {
          userIds.push(result[i].userId);
        }

        return userModel.find({where: {inq: userIds}})
      })
      .then((users) => {
        let userResult = [];
        for (let i = 0; i < users.length; i++) {
          userResult.push({id:users[i].userId, email: users[i].email});
        }
        return userResult;
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((err) => {
        callback(err);
      })
  }

  const addUser = function(id, email, options, type, callback) {
    let projectAccessModel = loopback.getModel("ProjectAccess");
    let userModel = loopback.getModel("user");
    let userId;

    userModel.findOne({where: {email: email}})
      .then((result) => {
        if (!result) { throw "Invalid email address."}
        userId = result.id;

        return projectAccessModel.find({where: {and: [{projectId: id}, {userId: userId}]}})
      })
      .then((projectAccessResults) => {
        if (projectAccessResults.length !== 0) {
          throw "User already in project as " + projectAccessResults[0].role;
        }
        return projectAccessModel.create({projectId: id, userId: userId, role: type})
      })
      .then((result) => {
        callback(null, result);
      })
      .catch((err) => {
        callback(err);
      })
  }

  const removeUser = function(id, fk, options, type, callback) {
    let projectAccessModel = loopback.getModel("ProjectAccess");

    projectAccessModel.find({where: {and: [{projectId: id}, {userId: fk}]}})
      .then((projectAccessResults) => {
        if (projectAccessResults.length === 0    ) { throw "User not in project with that role."; }
        if (projectAccessResults[0].role === type) { throw "User not in project with that role."; }

        return projectAccessModel.destroyById(projectAccessResults[0].id);
      })
      .then(() => {
        callback(null);
      })
      .catch((err) => {
        callback(err);
      })
  }


  model.getViewers = function(id, options, callback) {
    getUsers(id, options, accessTypes.viewer, callback);
  }
  model.getInstallers = function(id, options, callback) {
    getUsers(id, options, accessTypes.installer, callback);
  }
  model.addViewer = function(id, email, options, callback) {
    addUser(id, email, options, accessTypes.viewer, callback)
  }
  model.addInstaller = function(id, email, options, callback) {
    addUser(id, email, options, accessTypes.installer, callback)
  }
  model.removeViewer = function(id, fk, options, callback) {
    removeUser(id, fk, options, accessTypes.viewer, callback);
  }
  model.removeInstaller = function(id, fk, options, callback) {
    removeUser(id, fk, options, accessTypes.installer, callback);
  }


  model.remoteMethod(
    'getViewers',
    {
      http: {path: '/:id/viewers', verb: 'get'},
      accepts: [
        {arg: 'id',      type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "List users with viewing permissions of this project."
    }
  );

  model.remoteMethod(
    'addViewer',
    {
      http: {path: '/:id/viewer', verb: 'post'},
      accepts: [
        {arg: 'id',      type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email',   type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Add an user with viewing permissions to the project."
    }
  );

  model.remoteMethod(
    'removeViewer',
    {
      http: {path: '/:id/viewer/:fk', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fk', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Revoke viewing permissions from user."
    }
  );

  model.remoteMethod(
    'getInstallers',
    {
      http: {path: '/:id/installers', verb: 'get'},
      accepts: [
        {arg: 'id',      type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "List users with installer permissions of this project."
    }
  );

  model.remoteMethod(
    'addInstaller',
    {
      http: {path: '/:id/installer', verb: 'post'},
      accepts: [
        {arg: 'id',      type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email',   type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Add an user with installer permissions to the project."
    }
  );

  model.remoteMethod(
    'removeInstaller',
    {
      http: {path: '/:id/installer/:fk', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fk', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Revoke installer permissions from user."
    }
  );
};
