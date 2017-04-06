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
  Role.registerResolver('lib-user', function(role, context, cb) {

    function reject() {
      process.nextTick(function() {
        cb(null, false);
      });
    }
    // if (context.modelName !== 'Device') {
    //   // the target model is not project
    //   return reject();
    // }
    var userId = context.accessToken.userId;
    if (!userId) {
      return reject(); // do not allow anonymous users
    }

    app.models.user.findById(userId, function(err, user) {
      if (err) {
        reject(err);
      } else {
        cb(null, user.role === 'lib-user');
      }
    });
  });

  Role.registerResolver('$group:admin',  function(role, context, callback) { verifyRole(app, {admin: true},  context, callback); });
  Role.registerResolver('$group:member', function(role, context, callback) { verifyRole(app, {admin: true, member: true}, context, callback); });
  Role.registerResolver('$group:guest',  function(role, context, callback) { verifyRole(app, {admin: true, member: true, guest: true},  context, callback); });
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
function verifyRole(app, accessMap, context, callback) {
  // check if user is logged in
  let userId = context.accessToken.userId;

  // do not allow anonymous users
  if (!userId) {
    // reject async, see explanation on top of file.
    return process.nextTick(function() {
      callback(null, false);
    });
  }

  // check if the model has a sphereId
  getSphereId(app, context)
    .then((result) => {
      if (result !== undefined) {
        return app.models.SphereAccess.findOne({where:{userId: userId, sphereId: result.sphereId}});
      }
      else { throw "No Sphere Id"; }
    })
    // check if and what kind of access the user has to this sphere.
    .then((access) => {
      if (access && access.role && accessMap[access.role] === true) {
        callback(null, true);
      }
      else { throw "No Access"; }
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
            return resolve(null);
          }
        })
        .catch((err) => {
          reject(err);
        })
    }
  })
}