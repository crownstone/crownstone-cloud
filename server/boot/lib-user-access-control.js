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
  Role.registerResolver('lib-user', function(role, context, callback) { isLibUser(app, role, context, callback); });
  Role.registerResolver('$owner', function(role, context, callback) { isUserOwner(app, role, context, callback); });

  Role.registerResolver('$group:admin',  function(role, context, callback) { verifyRoleInSphere(app, { admin:  true },  context, callback); });
  Role.registerResolver('$group:member', function(role, context, callback) { verifyRoleInSphere(app, { member: true },  context, callback); });
  Role.registerResolver('$group:guest',  function(role, context, callback) { verifyRoleInSphere(app, { guest:  true },  context, callback); }); // legacy
  Role.registerResolver('$group:hub',    function(role, context, callback) { verifyRoleInSphere(app, { hub:  true },    context, callback); });
  // Role.registerResolver('$group:basic',  function(role, context, callback) { verifyRoleInSphere(app, { basic:  true },  context, callback); });
  Role.registerResolver('$device:owner', function(role, context, callback) { verifyDeviceOwner( app, context, callback); });
};

function isUserOwner(app, role, context, callback) {
  let userId        = context.accessToken.userId;
  let principalType = context.accessToken.principalType;

  // the hub does not OWN anything. Only users OWN things.
  if (principalType === 'Hub') {
    return callback(null, false);
  }
  else {
    if (!context.modelId) { return callback(null, false); }

    context.model.findById(context.modelId,{fields:{id: true, ownerId:true}})
      .then((result) => {
        if (!result) { throw "no data"; }
        // only the user model has no owner, but uses the id to refer to the user.
        if (result.ownerId === undefined && context.modelName !== 'user') {
          throw "no owner"
        }
        else if (result.ownerId === undefined) {
          callback(null, String(userId) === String(result.id));
        }
        else {
          callback(null, String(userId) === String(result.ownerId));
        }
      })
      .catch((err) => {
        callback(null, false);
      })
  }



}

function isLibUser(app, role, context, callback) {
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
  let userId        = context.accessToken.userId;
  let principalType = context.accessToken.principalType;

  // do not allow anonymous users
  if (!userId) {
    // reject async, see explanation on top of file.
    return process.nextTick(function() {
      callback(null, false);
    });
  }

  // in case of get/X we have to get the sphere for each i suppose...
  if (context.modelId === undefined) {
    if (context.accessType === 'READ' && (context.modelName === 'Stone' || context.modelName === 'Location' || context.modelName === 'Hub')) {
      return callback(null, true);
    }
    else {
      return callback(null, false);
    }
  }

  // check for principalType to differentiate between hub and user
  if (principalType === 'Hub') {
    let sphereId = null;
    getSphereId(app, context)
      .then((sphereIdResult) => {
        if (sphereIdResult) {
          sphereId = sphereIdResult;
          return app.models.Hub.findById(userId);
        }
        else { throw "No Sphere Id"; }
      })
      .then((hub) => {
        if (!hub) { throw "No Hub" }

        if (sphereId == hub.sphereId) {
          if (accessMap.hub === true) {
            callback(null, true);
          }
          else {
            callback(null, false);
          }
        }
        else {
          callback(null, false);
        }
      })
      .catch((err) => {
        callback(err, false);
      })
  }
  else {
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
