// "use strict";

const debug = require('debug')('loopback:crownstone');
const Util = require('./sharedUtil/util');

module.exports = function(model) {

	// make sure role is actually part of the defined sphere roles. do not accept
	// any other role
	// let roles = ['admin', 'member', 'guest', 'hub'];
	// model.validatesInclusionOf('role', {in: roles});

  model.observe('before delete', function(ctx, next) {
    let query = ctx.where;
    let sphereId = query.sphereId;
    let userId = query.userId;

    let currentRole = null;
    model.find({where: {and: [{userId: userId}, {sphereId: sphereId}]}})
      .then((results) => {
        if (results.length === 1) {
          currentRole = results[0].role;

          // user is not an admin, anything is allowed
          if (currentRole !== 'admin') { return }

          // user is currently an admin. check if user can change.
          return model.find({where: {sphereId: sphereId}})
            .then((allItemsInSphere) => {
              let adminCount = 0;
              let totalUsers = 0;
              for (let item of allItemsInSphere) {
                if (item.role !== 'hub' && item.invitePending === false) { totalUsers++; }
                if (item.role === 'admin') { adminCount++; }
              }

              // There must always be at least 1 admin
              if (adminCount > 1) {
                // great!
                return
              }
              else if (totalUsers === 1) {
                throw Util.customError(401, "ONLY_USER_IN_SPHERE", "Trying to remove the only user from the sphere. Remove the sphere if there are no more users in it.");
              }
              else {
                throw Util.customError(401, "ONE_ADMIN_REQUIRED", "There must always be an admin in a sphere. You cannot remove this user from the sphere.");
              }
            })
        }
      })
      .then(() => {
        next();
      })
      .catch((err) => {
        next(err)
      })
  });
};
