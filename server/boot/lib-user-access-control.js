"use strict";

/**
 * A note about process.nextTick()
    In the code here, we wrap some callback invocations in process.nextTick(()=> cb(...)), but not others. Why?
    In asynchronous functions like this one that take a callback & pass results to it at a later time,
    it’s important to ensure we always call the callback “at a later time” and never call it right away (synchronously).
    We call the callback from a function passed to process.nextTick in places where it would otherwise be called
    synchronously. Calls from the findById or count callbacks are already guaranteed to happen at a later time
    as they access the database, an asynchronous operation, so we don’t need to wrap those calls in process.nextTick.
 * @param app
 */

module.exports = function(app) {
  let Role = app.models.Role;
  Role.registerResolver('lib-user', function(role, context, callback) {
    function reject() {
      process.nextTick(function() {
        callback(null, false);
      });
    }

    let userId = context.accessToken.userId;
    if (!userId) {
      return reject(); // do not allow anonymous users
    }

    app.models.user.findById(userId, function(err, user) {
      if (err) {
        reject(err);
      }
      else {
        if (user && user.role) {
          callback(null, user.role === 'lib-user');
        }
        else {
          callback(null, false);
        }
      }
    });
  });

  Role.registerResolver('$group:admin',  function(role, context, callback) { verifyRoleInSphere(app, { admin:  true },  context, callback); });
  Role.registerResolver('$group:member', function(role, context, callback) { verifyRoleInSphere(app, { member: true },  context, callback); });
  Role.registerResolver('$group:guest',  function(role, context, callback) { verifyRoleInSphere(app, { guest:  true },  context, callback); }); // legacy
  Role.registerResolver('$project:installer',  function(role, context, callback) { verifyInstallerInProject(app,  context, callback); });
  Role.registerResolver('$project:viewer',     function(role, context, callback) { verifyViewerInProject(   app,  context, callback); });
  // Role.registerResolver('$group:basic',  function(role, context, callback) { verifyRoleInSphere(app, { basic:  true },  context, callback); });
  Role.registerResolver('$device:owner', function(role, context, callback) { verifyDeviceOwner( app, context, callback); });
};


/**
 * Verify if a user has access to this sphere element. If the model has a sphereId, we will look in the sphereAccess to find
 * the user permission in that sphere and match it to the accessLevel. Since an admin also has guest privileges, we allow
 * @param app
 * @param accessMap
 * @param context
 * @param callback
 * @returns {*}
 */
function verifyDeviceOwner(app, context, callback) {
  // check if user is logged in
  let userId = context.accessToken.userId;

  // do not allow anonymous users
  if (!userId) {
    // reject async, see explanation on top of file.
    return process.nextTick(function() {
      callback(null, false);
    });
  }

  if (context.modelName !== 'AppInstallation') { callback(null, false); }

  app.models.AppInstallation.findById(context.modelId, { include: 'device' })
    .then((installation) => {
      if (installation && installation.device && String(installation.device().ownerId) === String(userId)) {
        callback(null, true);
      }
      else {
        callback(null, false);
      }
    })
    .catch((err) => {
      callback(err, false);
    })
}



/**
 * Verify if a user has access to this Project element. If the model has a sphereId, we will look in the sphereAccess to find
 * the user permission in that sphere and match it to the accessLevel. Since an admin also has guest privileges, we allow
 * @param app
 * @param accessMap
 * @param context
 * @param callback
 * @returns {*}
 */
function verifyViewerInProject(app, context, callback) {
  // check if user is logged in
  let userId = context.accessToken.userId;

  // do not allow anonymous users
  if (!userId) {
    // reject async, see explanation on top of file.
    return process.nextTick(function() { callback(null, false); });
  }

  // check if the model has a sphereId
  getProjectId(app, context)
    .then((result) => {
      if (context.modelName === "Project" && !result) { return true; }

      if (!result) { throw "No Project Id"; }
      return app.models.ProjectViewer.findOne({where:{and: [{userId: userId}, {projectId: result}]}});
    })
    .then((access) => {
      if (access) { callback(null, true);  }
      else        { callback(null, false); }
    })
    .catch((err) => {
      callback(err, false);
    })
}


/**
 * Verify if a user has access to this Project element. If the model has a sphereId, we will look in the sphereAccess to find
 * the user permission in that sphere and match it to the accessLevel. Since an admin also has guest privileges, we allow
 * @param app
 * @param accessMap
 * @param context
 * @param callback
 * @returns {*}
 */
function verifyInstallerInProject(app, context, callback) {
  // check if user is logged in
  let userId = context.accessToken.userId;

  // do not allow anonymous users
  if (!userId) {
    // reject async, see explanation on top of file.
    return process.nextTick(function() { callback(null, false); });
  }

  // check if the model has a sphereId
  getProjectId(app, context)
    .then((result) => {
      if (context.modelName === "Project" && !result) { return true; }

      if (!result) { throw "No Project Id"; }
      return app.models.ProjectInstaller.findOne({where:{and: [{userId: userId}, {projectId: result}]}});
    })
    .then((access) => {
      if (access) { callback(null, true);  }
      else        { callback(null, false); }
    })
    .catch((err) => {
      callback(err, false);
    })
}



/**
 * Verify if a user has access to this sphere element. If the model has a sphereId, we will look in the sphereAccess to find
 * the user permission in that sphere and match it to the accessLevel. Since an admin also has guest privileges, we allow
 * @param app
 * @param accessMap
 * @param context
 * @param callback
 * @returns {*}
 */
function verifyRoleInSphere(app, accessMap, context, callback) {
  // check if user is logged in
  let userId = context.accessToken.userId;

  // do not allow anonymous users
  if (!userId) {
    // reject async, see explanation on top of file.
    return process.nextTick(function() {
      callback(null, false);
    });
  }

  // in case of get/X we have to get the sphere for each i suppose...
  if (context.modelId === undefined) {
    if (context.accessType === 'READ' && (context.modelName === 'Stone' || context.modelName === 'Location' || context.modelName === 'Appliance')) {
      return callback(null, true);
    }
    else {
      return callback(null, false);
    }
  }

  // check if the model has a sphereId
  getSphereId(app, context)
    .then((result) => {
      if (result) {
        return app.models.SphereAccess.findOne({where:{and: [{userId: userId}, {sphereId: result}]}});
      }
      else { throw "No Sphere Id"; }
    })
    // check if and what kind of access the user has to this sphere.
    .then((access) => {
      if (access && access.role && accessMap[access.role] === true) {
        callback(null, true);
      }
      else {
        callback(null, false);
      }
    })
    .catch((err) => {
      callback(err, false);
    })
}

function getSphereId(app, context) {
  return new Promise((resolve, reject) => {
    if (context.modelName === 'Sphere') {
      return resolve(context.modelId);
    }
    else {
      app.models[context.modelName].findById(context.modelId)
        .then((result) => {
          if (result && result.sphereId !== undefined) {
            return resolve(result.sphereId);
          }
          else {
            return reject({statusCode:404, message:"Could not find element with id: " + context.modelId});
          }
        })
        .catch((err) => {
          reject(err);
        })
    }
  })
}




function getProjectId(app, context) {
  return new Promise((resolve, reject) => {
    if (context.modelName === 'Project') {
      return resolve(context.modelId);
    }
    else {
      app.models[context.modelName].findById(context.modelId)
        .then((result) => {
          if (result && result.projectId !== undefined) {
            return resolve(result.projectId);
          }
          else {
            return reject({statusCode:404, message:"Could not find element with id: " + context.modelId});
          }
        })
        .catch((err) => {
          reject(err);
        })
    }
  })
}
