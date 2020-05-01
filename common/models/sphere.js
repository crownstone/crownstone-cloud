"use strict";


const notificationHandler = require('../../server/modules/NotificationHandler');

const loopback = require('loopback');
const uuid = require('node-uuid');
const crypto = require('crypto');

const debug = require('debug')('loopback:crownstone');

const config = require('../../server/config.json');
const emailUtil = require('../../server/emails/util');
const ToonAPI = require('../../server/integrations/toon/Toon');
const mesh = require('../../server/middleware/mesh-access-address');

const messageUtils = require('./sharedUtil/messageUtil');
const constants = require('./sharedUtil/constants');
const firmwareUtils = require('./sharedUtil/firmwareUtil');
const Util = require('./sharedUtil/util');
const app = require('../../server/server');

let DEFAULT_TTL = 1209600; // 2 weeks in seconds
let DEFAULT_MAX_TTL = 31556926; // 1 year in seconds

const EventHandler = require('../../server/modules/EventHandler');

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
    // ADMIN:
    //   - everything
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$group:admin",
        "permission": "ALLOW"
      }
    );
    // model.settings.acls.push(
    // 	{
    // 		"principalType": "ROLE",
    // 		"principalId": "$group:admin",
    // 		"permission": "DENY",
    // 		"property": "changeOwnership"
    // 	}
    // );

    //***************************
    // MEMBER:
    //   - everything except:
    //   	- delete location(s)
    //   	- remove users
    //   	- delete sphere
    //   	- delete file(s)
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "ALLOW"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__ownedLocations"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__ownedAppliances"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__ownedStones"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__unlink__users"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__ownedLocations"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__ownedAppliances"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__ownedStones"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteById"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteFile"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "deleteAllFiles"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "ALLOW",
        "property": "downloadProfilePicOfUser"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "changeRole"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "changeOwnership"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__deleteById__messages"
      }
    );
    //***************************
    // GUEST:
    //   - read
    //***************************
    model.settings.acls.push(
      {
        "accessType": "READ",
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "downloadProfilePicOfUser"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "setMessages"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "acceptInvite"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "declineInvite"
      }
    );
    //***************************
    // HUB:
    //   - cannot create new hub
    //***************************
    let endpointsNotAllowedForHub = [
      "createHub",
      "addAdmin",
      "addMember",
      "addGuest",
      "__unlink__users",
    ]
    endpointsNotAllowedForHub.forEach((endPoint) => {
      model.settings.acls.push(
        {
          "principalType": "ROLE",
          "principalId": "$group:hub",
          "permission": "DENY",
          "property": endPoint
        }
      );
    })
  }


  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('count');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('createChangeStream');

  model.disableRemoteMethodByName('prototype.__create__floatingLocationPosition');
  model.disableRemoteMethodByName('prototype.__update__floatingLocationPosition');

  model.disableRemoteMethodByName('prototype.__create__users');
  model.disableRemoteMethodByName('prototype.__delete__users');
  model.disableRemoteMethodByName('prototype.__destroyById__users');
  model.disableRemoteMethodByName('prototype.__deleteById__users');
  model.disableRemoteMethodByName('prototype.__updateById__users');
  model.disableRemoteMethodByName('prototype.__link__users');
  model.disableRemoteMethodByName('prototype.__count__users');
  model.disableRemoteMethodByName('prototype.__get__users');

  // model.disableRemoteMethodByName('prototype.__create__scenes');
  model.disableRemoteMethodByName('prototype.__delete__scenes');
  // model.disableRemoteMethodByName('prototype.__destroyById__scenes');
  // model.disableRemoteMethodByName('prototype.__deleteById__scenes');
  model.disableRemoteMethodByName('prototype.__updateById__scenes');
  model.disableRemoteMethodByName('prototype.__findById__scenes');
  model.disableRemoteMethodByName('prototype.__link__scenes');
  model.disableRemoteMethodByName('prototype.__count__scenes');
  // model.disableRemoteMethodByName('prototype.__get__scenes');


  // model.disableRemoteMethodByName('prototype.__create__sortedLists');
  model.disableRemoteMethodByName('prototype.__delete__sortedLists');
  // model.disableRemoteMethodByName('prototype.__destroyById__sortedLists');
  // model.disableRemoteMethodByName('prototype.__deleteById__sortedLists');
  model.disableRemoteMethodByName('prototype.__updateById__sortedLists');
  model.disableRemoteMethodByName('prototype.__findById__sortedLists');
  model.disableRemoteMethodByName('prototype.__link__sortedLists');
  model.disableRemoteMethodByName('prototype.__count__sortedLists');
  // model.disableRemoteMethodByName('prototype.__get__sortedLists');

  model.disableRemoteMethodByName('prototype.__create__hubs');
  model.disableRemoteMethodByName('prototype.__delete__hubs');
  model.disableRemoteMethodByName('prototype.__destroyById__hubs');
  model.disableRemoteMethodByName('prototype.__deleteById__hubs');
  model.disableRemoteMethodByName('prototype.__updateById__hubs');
  model.disableRemoteMethodByName('prototype.__findById__hubs');
  model.disableRemoteMethodByName('prototype.__count__hubs');

  // model.disableRemoteMethodByName('prototype.__updateById__Toons');
  model.disableRemoteMethodByName('prototype.__destroyById__Toons');
  model.disableRemoteMethodByName('prototype.__deleteById__Toons');
  model.disableRemoteMethodByName('prototype.__create__Toons');
  model.disableRemoteMethodByName('prototype.__findById__Toons');
  model.disableRemoteMethodByName('prototype.__delete__Toons');
  model.disableRemoteMethodByName('prototype.__exists__Toons');
  model.disableRemoteMethodByName('prototype.__count__Toons');

  model.disableRemoteMethodByName('prototype.__delete__ownedLocations');
  model.disableRemoteMethodByName('prototype.__get__ownedStones');
  model.disableRemoteMethodByName('prototype.__delete__ownedStones');
  model.disableRemoteMethodByName('prototype.__delete__ownedAppliances');
  model.disableRemoteMethodByName('prototype.__delete__messages');

  model.disableRemoteMethodByName('prototype.__get__messages');
  model.disableRemoteMethodByName('prototype.__updateById__messages');
  model.disableRemoteMethodByName('prototype.__findById__messages');

  /************************************
   **** Model Validation
   ************************************/

  model.validatesUniquenessOf('name', {scopedTo: ['ownerId'], message: 'a sphere with this name was already added'});
  model.validatesUniquenessOf('uuid', {message: 'a sphere with this UUID was already added'});

  /************************************
   **** Verification checks
   ************************************/

  // check that the owner of a sphere can't unlink himself from the sphere, otherwise there will
  // be access problems to the sphere. And a sphere should never be without an owner.
  model.beforeRemote('*.__unlink__users', function(context, user, next) {
    let foreignKey = context.args.fk;
    let sphere = context.instance;
    const User = loopback.findModel('user');
    User.findById(foreignKey, function(err, user) {
      if (err) return next(err);
      if (!user) return next();

      if (String(user.id) === String(sphere.ownerId)) {
        let error = new Error("Can't remove owner from sphere");
        error.statusCode = error.status = 409;
        return next(error);
      }
      else {
        EventHandler.dataChange.sendSphereUserDeletedEvent(sphere, user);

        // we collect the users because we need the userIds of all users in the sphere, including the one whos is about to be deleted.
        // this promise takes care of a race condition where the user is deleted before we get his id.
        notificationHandler.collectSphereUsers(String(sphere.id))
          .then((users) => {
            let payload = {
              data: {
                sphereId: String(sphere.id),
                command: "sphereUserRemoved",
                removedUserId: String(user.id)
              },
              silent: true
            };
            // tell other people in the sphere to refresh their sphere user list.
            notificationHandler.notifyUsers( users, payload );
            next();
          })
          .catch((err) => {
            // ignoring errors, notifcations are optional.
            next();
          })
      }
    })
  });

  model.afterRemote("*.__unlink__users", function(ctx, instance, next) {
    let unlinkedUserKey = ctx.args.fk;
    let sphere = ctx.instance;

    // get the user id of the user that performed the request
    let executingUserId = ctx.ctorArgs && ctx.ctorArgs.options && ctx.ctorArgs.options.accessToken && ctx.ctorArgs.options.accessToken.userId || null;
    let executingUser = null;

    // if the user does not exist any more, ignore notifying him
    if (!unlinkedUserKey) {
      let error = new Error("User has been removed from sphere. No notification email will be sent.");
      error.statusCode = error.status = 409;
      return callback(error);
      next(error);
      return;
    }


    let findAndEmailUnlinkedUser = () => {
      return User.findById(unlinkedUserKey)
        .then((unlinkedUser) => {
          if (unlinkedUser) {
            emailUtil.sendRemovedFromSphereEmail(unlinkedUser, executingUser, sphere);
          }
          next();
        })
    };

    const User = loopback.findModel('user');
    if (executingUserId) {
      User.findById(executingUserId)
        .then((result) => {
          executingUser = result;
          return findAndEmailUnlinkedUser();
        })
        .catch((err) => { next(err); })
    }
    else {
      new Promise((resolve, reject) => { resolve(); })
        .then(() => { return findAndEmailUnlinkedUser(); })
        .catch((err) => { next(err); })
    }
  });

  // check that a sphere is not deleted as long as there are crownstones assigned
  model.observe('before delete', function(ctx, next) {
    model.findById(ctx.where.id, {include: 'ownedStones'}, function(err, sphere) {
      if (sphere) {
        if (sphere.ownedStones().length > 0) {
          let error = new Error("Can't delete sphere with crownstones still assigned to it.");
          error.statusCode = error.status = 409;
          return next(error);
        }
        EventHandler.dataChange.sendSphereDeletedEvent(sphere);
      }
      next();
    });
  });

  /************************************
   **** Cascade
   ************************************/

  // if the sphere is deleted, delete also all files stored for this sphere
  model.observe('after delete', function(ctx, next) {
    model.deleteAllFiles(ctx.where.id, ctx.options, function() {
      next();
    });
  });

  /************************************
   **** Custom
   ************************************/

  function initSphere(ctx, next) {
    debug("initSphere");
    // debug("ctx", ctx);
    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;
    const user = userId ? 'user#' + userId : '<anonymous>';

    if (ctx.isNewInstance) {
      injectUUID(ctx.instance);
      injectMeshAccessAddress(ctx.instance);
      injectUID(ctx.instance);
      injectOwner(ctx.instance, userId, next);
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

  function injectUUID(item) {
    if (!item.uuid) {
      debug("create uuid");
      item.uuid = uuid.v4();
    }
  }

  // new keys go into the SphereKeys model
  function generateEncryptionKeys(ctx) {
    const SphereKeyModel = loopback.getModel('SphereKeys');
    let sphereId = ctx.instance.id;

    return SphereKeyModel.create([
      { sphereId: sphereId, keyType: constants.KEY_TYPES.ADMIN_KEY,            key: Util.createKey(), ttl: 0 },
      { sphereId: sphereId, keyType: constants.KEY_TYPES.MEMBER_KEY,           key: Util.createKey(), ttl: 0 },
      { sphereId: sphereId, keyType: constants.KEY_TYPES.BASIC_KEY,            key: Util.createKey(), ttl: 0 },
      { sphereId: sphereId, keyType: constants.KEY_TYPES.LOCALIZATION_KEY,     key: Util.createKey(), ttl: 0 },
      { sphereId: sphereId, keyType: constants.KEY_TYPES.SERVICE_DATA_KEY,     key: Util.createKey(), ttl: 0 },
      { sphereId: sphereId, keyType: constants.KEY_TYPES.MESH_APPLICATION_KEY, key: Util.createKey(), ttl: 0 },
      { sphereId: sphereId, keyType: constants.KEY_TYPES.MESH_NETWORK_KEY,     key: Util.createKey(), ttl: 0 },
    ]);
  }

  function injectMeshAccessAddress(item) {
    if (!item.meshAccessAddress) {
      item.meshAccessAddress = mesh.generateAccessAddress();
    }
  }
  function injectUID(item) {
    if (!item.uid) {
      item.uid = crypto.randomBytes(1)[0]
    }
  }

  model.observe('before save', initSphere);
  // model.beforeRemote('create', injectOwner);
  // model.beforeRemote('upsert', injectOwner);

  function afterSave(ctx, next) {
    if (ctx.isNewInstance) {
      generateEncryptionKeys(ctx)
        .then(() => {
          EventHandler.dataChange.sendSphereCreatedEvent(ctx.instance);
          updateOwnerAccess(ctx, next);
        })
    }
    else {
      EventHandler.dataChange.sendSphereUpdatedEvent(ctx.instance);
      next();
    }
  }

  // model.afterRemote('create', updateOwnerAccess);
  model.observe('after save', afterSave);


  /************************************
   **** Membership Methods
   ************************************/

  function injectOwner(item, ownerId, next) {
    if (!item.ownerId) {
      debug("injectOwner");
      item.ownerId = ownerId;
      next();
    } else {
      next();
    }
  }

  function updateOwnerAccess(ctx, next) {
    if (ctx.isNewInstance) {
      const User = loopback.getModel('user');
      User.findById(ctx.instance.ownerId, function(err, user) {
        if (err) return next(err);
        // make the owner admin of the group
        addSphereAccess(user, ctx.instance, "admin", false, function(err, res) {
          next(err);
        });
      })
    }
    else {
      next();
    }
  }

  function addSphereAccess(user, sphere, access, invite, callback) {
    debug("addSphereAccess");

    sphere.users.add(user, {
        sphereId: sphere.id,
        userId: user.id,
        role: access,
        invitePending: invite
      },
      function(err, access) {
        callback(err);
      });
  }

  /*
   * TODO: baseUrl is now defined on app, maybe store in within another object to make sure no conflicts are resulting
   * from this.
   */
  function sendInvite(user, options, sphere, isNew, accessTokenId) {
    let baseUrl = app.__baseUrl;
    if (isNew) {
      let acceptUrl = baseUrl + '/profile-setup';
      let declineUrl = baseUrl + '/decline-invite-new';

      let userIdFromContext = options && options.accessToken && options.accessToken.userId || undefined;
      const User = loopback.findModel('user');
      User.findById(userIdFromContext)
        .then((currentUser) => {
          emailUtil.sendNewUserInviteEmail(user, currentUser, sphere, acceptUrl, declineUrl, accessTokenId);
        })
        .catch((err) => {
          console.log("ERROR DURING sendInvite", err);
        })
    }
    else {
      let acceptUrl = baseUrl + '/accept-invite';
      let declineUrl = baseUrl + '/decline-invite';

      let userIdFromContext = options && options.accessToken && options.accessToken.userId || undefined;
      const User = loopback.findModel('user');
      User.findById(userIdFromContext)
        .then((currentUser) => {
          emailUtil.sendExistingUserInviteEmail(user, currentUser, sphere, acceptUrl, declineUrl);
        })
        .catch((err) => {
          console.log("ERROR DURING sendInvite", err);
        })
    }
  }

  function addExistingUser(email, id, access, options, newUser, callback) {
    const User = loopback.getModel('user');
    model.findById(id, function(err, instance) {
      if (err) {
        callback(err, null);
      } else {
        let sphere = instance;
        if (sphere) {
          // debug("sphere:", sphere);
          // let encryptionKey = sphere[access + "EncryptionKey"];

          User.findOne({where: {email: email}}, function(err, user) {
            if (err) {
              debug("did not find user with this email");
              callback(err);
            } else {
              if (user) {
                // debug("user:", user);
                // user.invitePending = id;
                // user.save();

                addSphereAccess(user, sphere, access, true, function(err) {
                  if (err) return callback(err);
                  sendInvite(user, options, sphere, newUser);
                  callback();
                });
              } else {
                let error = new Error("User not found amongst friends");
                error.statusCode = error.status = 409;
                callback(error);
              }
            }
          });
        } else {
          debug("Sphere not found");
          let error = new Error("Sphere not found");
          error.statusCode = error.status = 409;
          callback(error);
        }
      }
    });
  }

  function createAndInviteUser(sphere, email, access, options, next) {
    debug("createAndInviteUser");
    const User = loopback.getModel('user');
    let tempPassword = crypto.randomBytes(8).toString('base64');
    // debug("tempPassword", tempPassword);
    let userData = {email: email, password: tempPassword, accountCreationPending: true};
    User.create(userData, function(err, user) {
      if (err) return next(err);

      let ttl = DEFAULT_TTL;
      user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
        if (err) return next(err);
        addSphereAccess(user, sphere, access, true, function(err) {
          if (err) return next(err);
          sendInvite(user, options, sphere, true, accessToken.id);
          next();
        });
      })
    });
  }

  function invite(sphereId, email, access, options, next) {
    model.findById(sphereId, function(err, sphere) {
      if (err) return next(err);

      // debug("sphere", sphere);

      if (sphere) {
        const User = loopback.getModel('user');
        User.findOne({where: {email: email}}, function(err, user) {
          if (err) return next(err);

          if (!user) {
            debug("create new user");
            createAndInviteUser(sphere, email, access, options, next);
          }
          else {
            // user exists, check if he is already part of the sphere
            sphere.users.exists(user.id, function(err, exists) {
              if (exists) {
                debug("user is already part of the sphere");
                let error = new Error("User is already part of the sphere");
                error.statusCode = error.status = 200;
                return next(error);
              }
              else {
                debug("add existing user");
                if (user.accountCreationPending === true) {
                  addExistingUser(email, sphereId, access, options, true, next);
                }
                else {
                  addExistingUser(email, sphereId, access, options, false, next);
                }
              }
            })
            notificationHandler.notifyUserIds(
              [user.id], { data: { command: "InvitationReceived", role: access, sphereId: sphereId }, silent: true
              });

          }
          // tell other people in the sphere to refresh their sphere user list.
          notificationHandler.notifySphereUsers(sphereId, {data: { sphereId: sphereId, command:"sphereUsersUpdated" }, silent: true });
          EventHandler.dataChange.sendSphereUserInvitedEventById(sphereId, email);
        });
      }
      else {
        debug("Sphere not found");
        let error = new Error("Sphere not found");
        error.statusCode = error.status = 409;
        callback(error);
        next(error);
      }
    });
  }


  model.pendingInvites = function(id, callback) {
    const SphereAccess = loopback.getModel('SphereAccess');
    SphereAccess.find(
      {where: {and: [{sphereId: id}, {invitePending: true}]}, include: "user"},
      function(err, objects) {
        if (err) return callback(err);

        // [06.12.16] Bug? access.user() was null and app crashed on access.user().email
        //   shouldn't happen?! But to avoid future crashes, array is first filtered for
        //   elements where access.user() returns a user object
        let pendingInvites = Array.from(objects)
          .filter(function(access) {
            return (access.user())
          })
          .map(function(access) {
            return {role: access.role, email: access.user().email};
          });
        // debug("pendingInvites", pendingInvites);

        callback(null, pendingInvites);
      }
    );
  };

  model.remoteMethod(
    'pendingInvites',
    {
      http: {path: '/:id/pendingInvites', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }}
      ],
      returns: {arg: 'users', type: ['any'], root: true},
      description: "Get pending invites of Sphere"
    }
  );

  /**
   * Find user in list of invites and resend an email if found. When the user does not exist in the database, the
   * same message "User not found in invites" will be send, so not to leak information about who is present in the
   * database. A 409 (conflict) error is returned. This is namely not a server-side error, but it is an error that
   * can be solved at the client-side.
   */
  model.resendInvite = function(id, email, options, callback) {
    model.findById(id, function(err, sphere) {
      if (err) return callback(err);

      const User = loopback.findModel('user');
      User.findOne({where: {email: email}}, function(err, user) {
        if (err) return callback(err);
        //debug("user", user);
        if (!user) {
          let error = new Error("User not found in invites");
          error.name = "Invitation error";
          error.statusCode = error.status = 409;
          return callback(error);
        }

        const SphereAccess = loopback.getModel('SphereAccess');
        SphereAccess.findOne({where: {and: [{sphereId: id}, {userId: user.id}, {invitePending: true}]}},
          function(err, access) {
            if (err)     return callback(err);
            if (!access) {
              let error = new Error("User not found in invites");
              error.name = "Invitation error";
              error.statusCode = error.status = 409;
              return callback(error);
            }

            if (user.new) {
              user.accessTokens.destroyAll(function(err, info) {
                if (err) debug("failed to remove old access token");

                let ttl = DEFAULT_TTL;
                user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
                  if (err) return callback(err);

                  sendInvite(user, options, sphere, true, accessToken.id);
                  callback();
                });
              })
            }
            else {
              sendInvite(user, options, sphere, false);
              callback();
            }
          }
        );
      });
    });
  };

  model.remoteMethod(
    'resendInvite',
    {
      http: {path: '/:id/resendInvite', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Resend invite to User of Sphere"
    }
  );

  /**
   * Again, just as in resendInvite we try not to leak information about the existence of a user. The error message
   * is always "User not found in invites".
   */
  model.removeInvite = function(id, email, callback) {
    const User = loopback.findModel('user');
    User.findOne({where: {email: email}}, function(err, user) {
      if (err) return callback(err);
      if (!user) {
        let error = new Error("User not found in invites");
        error.name = "Invitation error";
        error.statusCode = error.status = 409;
        return callback(error);
      }

      const SphereAccess = loopback.getModel('SphereAccess');
      SphereAccess.findOne(
        {where: {and: [{sphereId: id}, {userId: user.id}, {invitePending: true}]}},
        function(err, access) {
          if (err) return callback(err);
          if (!access) {
            let error = new Error("User not found in invites");
            error.name = "Invitation error";
            error.statusCode = error.status = 409;
            return callback(error);
          }

          SphereAccess.deleteById(access.id, callback);
          EventHandler.dataChange.sendSphereUserInvitationRevokedEventById(id, email);
        }
      );
    });
  };

  model.remoteMethod(
    'removeInvite',
    {
      http: {path: '/:id/removeInvite', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }}
      ],
      description: "Remove invite for user of Sphere"
    }
  );



  model.addGuest = function(email, id, options, callback) {
    // debug("email:", email);
    // debug("id:", id);
    invite(id, email, "guest", options, callback);
  };


  model.remoteMethod(
    'addGuest',
    {
      http: {path: '/:id/guests', verb: 'put'},
      accepts: [
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Add an existing user as a guest to this sphere"
    }
  );

  model.addMember = function(email, id, options, callback) {
    // debug("email:", email);
    // debug("id:", id);
    invite(id, email, "member", options, callback);
  };

  model.remoteMethod(
    'addMember',
    {
      http: {path: '/:id/members', verb: 'put'},
      accepts: [
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Add an existing user as a member to this sphere"
    }
  );

  model.addAdmin = function(email, id, options, callback) {
    // debug("email:", email);
    // debug("id:", id);
    invite(id, email, "admin", options, callback);
  };

  model.remoteMethod(
    'addAdmin',
    {
      http: {path: '/:id/admins', verb: 'put'},
      accepts: [
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Add an existing user as an admin to this sphere"
    }
  );

  function findUsersWithRole(id, access, callback) {
    let sphereObject = null;
    let allSphereUsers = null;

    // get the sphere
    model.findById(id)
      .then((sphere) => {
        if (sphere === null) { throw 'Sphere not found'; }
        sphereObject = sphere;

        // get the sphere users
        return new Promise((resolve, reject) => {
          sphereObject.users(function (err, users) {
            if (err) { return reject(err); }
            resolve(users);
          });
        });
      })
      .then((sphereUsers) => {
        if (sphereUsers.length === 0) { return []; }

        allSphereUsers = sphereUsers;
        // console.log("allSphereUsers", allSphereUsers);
        const SphereAccess = loopback.getModel('SphereAccess');
        return SphereAccess.find({where: {sphereId: id, role: access, invitePending: {neq: true}}, fields:'userId'});
      })
      .then((userIdsWithAccess) => {
        // make a map of the ids for quick reference.
        let userIdsWithAccessMap = {};
        userIdsWithAccess.forEach((userId) => {
          userIdsWithAccessMap[userId.userId] = true;
        });
        let usersWithAccess = [];
        allSphereUsers.forEach((sphereUser) => {
          if (userIdsWithAccessMap[sphereUser.id]) {
            usersWithAccess.push(sphereUser);
          }
        });

        callback(null, usersWithAccess);
      })
      .catch((err) => {
        callback(err);
      });
  }

  model.guests = function(id, callback) {
    // debug("email:", email);
    // debug("id:", id);
    findUsersWithRole(id, 'guest', callback);
  };

  model.remoteMethod(
    'guests',
    {
      http: {path: '/:id/guests', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }}
      ],
      returns: {arg: 'data', type: ['user'], root: true},
      description: "Queries guests of Sphere"
    }
  );

  model.members = function(id, callback) {
    // debug("email:", email);
    // debug("id:", id);
    findUsersWithRole(id, 'member', callback);
  };

  model.remoteMethod(
    'members',
    {
      http: {path: '/:id/members', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      returns: {arg: 'data', type: ['user'], root: true},
      description: "Queries members of Sphere"
    }
  );

  model.admins = function(id, callback) {
    // debug("email:", email);
    // debug("id:", id);
    findUsersWithRole(id, 'admin', callback);
  };

  model.remoteMethod(
    'admins',
    {
      http: {path: '/:id/admins', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      returns: {arg: 'data', type: ['user'], root: true},
      description: "Queries admins of Sphere"
    }
  );

  model.users = function(id, callback) {
    let result = {};
    findUsersWithRole(id, 'admin', function(err, admins) {
      if (err) callback(err);

      result.admins = admins;

      findUsersWithRole(id, 'member', function(err, members) {
        if (err) callback(err);

        result.members = members;

        findUsersWithRole(id, 'guest', function(err, guests) {
          if (err) callback(err);

          result.guests = guests;

          callback(null, result);
        });
      });
    });
  };

  model.remoteMethod(
    'users',
    {
      http: {path: '/:id/users', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }}
      ],
      returns: {arg: 'data', type: ['user'], root: true},
      description: "Queries users of Sphere"
    }
  );

  model.countUsers = function(id, callback) {
    model.users(id, function(err, res) {
      if (err) callback(err);

      let amountOfUsers = res.admins.length + res.members.length + res.guests.length;
      callback(null, amountOfUsers);
    })
  };

  model.remoteMethod(
    'countUsers',
    {
      http: {path: '/:id/users/count', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }}
      ],
      returns: {arg: 'count', type: 'number'},
      description: "Count users of Sphere"
    }
  );

  model.changeOwnership = function(id, email, options, callback) {
    model.findById(id, function(err, sphere) {
      if (err) return callback(err);

      const User = loopback.findModel('user');
      User.findOne({where: {email: email}}, function(err, user) {
        if (err) return callback(err);
        // debug("user", user);
        // debug("sphere", sphere);
        let currentUserId = options && options.accessToken && options.accessToken.userId;
        if (!currentUserId) {
          return callback("Can not identify user by accessToken.");
        }

        if (sphere.ownerId === currentUserId) {
          const SphereAccess = loopback.findModel("SphereAccess");
          SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
            if (err) return callback(err);

            if (objects.length === 1) {
              objects[0].role = "admin";
              objects[0].save(function(err, instance) {
                if (err) return callback(err);

                sphere.ownerId = user.id;
                sphere.save(function(err, inst) {
                  if (err) return callback(err);

                  callback(null, true);
                });
              });

            }
            else {
              let error = new Error("User is not part of sphere");
              error.name = "Membership error";
              error.statusCode = error.status = 409;
              return callback(error);
            }
          })
        } else {
          debug("Error: Authorization required!");
          let error = new Error("Authorization Required");
          error.status = 401;
          return callback(error);
        }
      });
    });
  };

  model.remoteMethod(
    'changeOwnership',
    {
      http: {path: '/:id/owner', verb: 'put'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'success', type: 'boolean', root: true},
      description: "Change owner of Group"
    }
  );

  function verifyChangeRole(sphereId, user, role, callback) {
    model.findById(sphereId, function(err, sphere) {
      if (err) return callback(err);
      if (model.checkForNullError(sphere, callback, "id: " + sphereId)) return;

      if (role === "owner") {
        callback(null, false);
      } else {
        callback(null, user.id !== sphere.ownerId)
      }
    });
  }

  model.getRole = function(id, email, callback) {
    const User = loopback.findModel('user');
    User.findOne({where: {email: email}}, function(err, user) {
      if (err) return callback(err);
      if (User.checkForNullError(user, callback, "email: " + email)) return;

      const SphereAccess = loopback.findModel("SphereAccess");
      SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
        if (err) return callback(err);
        // debug(objects);
        let roles = Array.from(objects, access => access.role);
        callback(null, roles);
      });
    });
  };

  model.remoteMethod(
    'getRole',
    {
      http: {path: '/:id/role', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }}
      ],
      returns: {arg: 'role', type: 'string', root: true},
      description: "Get role of User in Sphere"
    }
  );

  model.changeRole = function(id, email, role, callback) {

    const User = loopback.findModel('user');
    User.findOne({where: {email: email}}, function(err, user) {
      if (err) return callback(err);
      if (User.checkForNullError(user, callback, "email: " + email)) return;

      verifyChangeRole(id, user, role, function(err, success) {
        if (err) return callback(err);

        if (success) {
          EventHandler.dataChange.sendSphereUserUpdatedEventById(id, user.id);

          const SphereAccess = loopback.findModel("SphereAccess");
          SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
            if (err) return callback(err);

            if (objects.length === 1) {
              objects[0].role = role;
              objects[0].save(function(err, instance) {
                if (err) return callback(err);
                callback();
              });
            } else {
              let error = new Error("User is not part of sphere");
              error.name = "Membership error";
              error.statusCode = error.status = 409;
              return callback(error);
            }
          })
        } else {
          let error = new Error("Not allowed to change owners. Use /changeOwnership instead.");
          error.name = "Permission error";
          error.statusCode = error.status = 409;
          return callback(error);
        }
      });


    });

    // model.findById(id, {include: {relation: "users", scope: {where: {email: email}}}}, function(err, user) {
    // 	if (err) return callback(err);

    // 	const SphereAccess = loopback.findModel("SphereAccess");
    // 	SphereAccess.updateAll({userId: user.id}, {role: role}, function(err, info) {
    // 		if (err) return callback(err);
    // 		debug(info);
    // 		callback();
    // 	})
    // });
  };

  model.remoteMethod(
    'changeRole',
    {
      http: {path: '/:id/role', verb: 'put'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'role', type: 'string', required: true, http: { source : 'query' }}
      ],
      description: "Change role of User"
    }
  );


  /************************************
   **** Container Methods
   ************************************/

  model.listFiles = function(id, options, callback) {
    const Container = loopback.getModel('SphereContainer');
    Container._getFiles(id, options, callback);
  };

  model.remoteMethod(
    'listFiles',
    {
      http: {path: '/:id/files', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'files', type: 'array', root: true},
      description: "Queries files of Sphere"
    }
  );

  model.countFiles = function(id, options, callback) {
    const Container = loopback.getModel('SphereContainer');
    Container._getFiles(id, options, function(err, res) {
      if (err) return callback(err);

      callback(null, res.length);
    });
  };

  model.remoteMethod(
    'countFiles',
    {
      http: {path: '/:id/files/count', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'count', type: 'number'},
      description: "Count files of Sphere"
    }
  );

  // model.listFile = function(id, fk, callback) {
  // 	const Container = loopback.getModel('SphereContainer');
  // 	Container.getFile(id, fk, callback);
  // }

  // model.remoteMethod(
  // 	'listFile',
  // 	{
  // 		http: {path: '/:id/files/:fk', verb: 'get'},
  // 		accepts: [
  // 			{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  // 			{arg: 'fk', type: 'any', required: true, http: { source : 'path' }}
  // 		],
  // 		returns: {arg: 'file', type: 'object', root: true},
  // 		description: "Queries file by id"
  // 	}
  // );

  model.deleteFile = function(id, fk, options, callback) {
    const Container = loopback.getModel('SphereContainer');
    Container._deleteFile(id, fk, options, callback);
  };

  model.remoteMethod(
    'deleteFile',
    {
      http: {path: '/:id/files/:fk', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fk', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Delete a file by id"
    }
  );


  model.deleteAllFiles = function(id, options, callback) {
    const Container = loopback.getModel('SphereContainer');
    Container._deleteContainer(id, options, callback);
  };

  model.remoteMethod(
    'deleteAllFiles',
    {
      http: {path: '/:id/deleteAllFiles', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Delete all files of Sphere"
    }
  );

  model.downloadFile = function(id, fk, res, options, callback) {
    const Container = loopback.getModel('SphereContainer');
    Container._download(id, fk, res, options, callback);
  };

  model.remoteMethod(
    'downloadFile',
    {
      http: {path: '/:id/files/:fk', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fk', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'res', type: 'object', 'http': { source: 'res' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Download a file by id"
    }
  );

  model.uploadFile = function(id, req, options, callback) {
    const Container = loopback.getModel('SphereContainer');
    Container._upload(id, req, options, callback);
  };

  model.remoteMethod(
    'uploadFile',
    {
      http: {path: '/:id/files', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'req', type: 'object', http: { source: 'req' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'file', type: 'object', root: true},
      description: "Upload a file to Sphere"
    }
  );

  model.downloadProfilePicOfUser = function(id, email, res, options, callback) {
    model.findById(id, function(err, sphere) {
      if (err) return next(err);
      if (model.checkForNullError(sphere, callback, "id: " + id)) return;

      sphere.users({where: {email: email}}, function(err, users) {
        if (err) return callback(err);

        if (users.length === 0) {
          let error = new Error("User not found amongst friends");
          error.name = "Availability error";
          error.statusCode = error.status = 409;
          return callback(error);
        }
        let user = users[0];

        const User = loopback.getModel('user');
        User.downloadFile(user.id, user.profilePicId, res, options, callback);
      });
    })
  };

  model.remoteMethod(
    'downloadProfilePicOfUser',
    {
      http: {path: '/:id/profilePic', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'res', type: 'object', 'http': { source: 'res' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: "Download profile pic of User"
    }
  );

  model.deleteAllLocations = function(id, callback) {
    debug("deleteAllLocations");
    model.findById(id, {include: "ownedLocations"}, function(err, sphere) {
      if (err) return callback(err);
      if (model.checkForNullError(sphere, callback, "id: " + id)) return;

      sphere.ownedLocations.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllLocations',
    {
      http: {path: '/:id/deleteAllLocations', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all locations of Sphere"
    }
  );

  model.deleteAllStones = function(id, callback) {
    debug("deleteAllStones");
    model.findById(id, {include: "ownedStones"}, function(err, sphere) {
      if (err) return callback(err);
      if (model.checkForNullError(sphere, callback, "id: " + id)) return;

      sphere.ownedStones.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllStones',
    {
      http: {path: '/:id/deleteAllStones', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all stones of Sphere"
    }
  );

  model.deleteAllAppliances = function(id, callback) {
    debug("deleteAllAppliances");
    model.findById(id, {include: "ownedAppliances"}, function(err, sphere) {
      if (err) return callback(err);
      if (model.checkForNullError(sphere, callback, "id: " + id)) return;

      sphere.ownedAppliances.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllAppliances',
    {
      http: {path: '/:id/deleteAllAppliances', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all appliances of Sphere"
    }
  );

  model.deleteAllMessages = function(id, callback) {
    debug("deleteAllMessages");
    model.findById(id, {include: "messages"}, function(err, sphere) {
      if (err) return callback(err);
      if (model.checkForNullError(sphere, callback, "id: " + id)) return;

      sphere.messages.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllMessages',
    {
      http: {path: '/:id/deleteAllMessages', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all messages of Sphere"
    }
  );


  /***************************************
   **** Messages
   ***************************************/


  model.afterRemote('setMessages', function(ctx, instance, next) {
    if (instance && (instance.everyoneInSphere || instance.everyoneInSphereIncludingOwner)) {
      // notify!
      // get users in the sphere.
      let sphereObject;
      model.findById(instance.sphereId)
        .then((sphere) => {
          if (sphere === null) {
            throw {statusCode: 404, message: 'Sphere not found'};
          }
          sphereObject = sphere;
          return new Promise((resolve, reject) => {
            sphereObject.users(function (err, users) {
              if (err) { return reject(err); }
              resolve(users);
            });
          });
        })
        .then((users) => {
          let notifyUsers = [];
          // filter out the owner if he is not one of the recipients.
          if (instance.everyoneInSphere && instance.everyoneInSphereIncludingOwner === false) {
            for (let i = 0; i < users.length; i++) {
              if (String(users[i].id) !== String(instance.ownerId)) {
                notifyUsers.push({id:users[i].id});
              }
            }
          }
          else {
            notifyUsers = users;
          }
          messageUtils.notifyWithUserObjects(instance, notifyUsers);
        })
        .then(() => {
          next();
        })
        .catch((err) => {
          next(err);
        })
    }
    else {
      next();
    }
  });

  model.remoteMethod(
    'getAllMyMessages',
    {
      http: {path: '/:id/myMessages', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Get all the messages you have access to.",
      returns: {arg: 'data', type: ['Message'], root: true},
    }
  );

  model.remoteMethod(
    'getMyActiveMessages',
    {
      http: {path: '/:id/myActiveMessages', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Get all messages you have access to that are still waiting to be delivered to someone.",
      returns: {arg: 'data', type: ['Message'], root: true},
    }
  );

  model.remoteMethod(
    'getMyNewMessages',
    {
      http: {path: '/:id/myNewMessages', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Get all messages in this sphere that have not been delivered to you yet.",
      returns: {arg: 'data', type: ['Message'], root: true},
    }
  );

  model.remoteMethod(
    'getMyNewMessagesInLocation',
    {
      http: {path: '/:id/myNewMessagesInLocation/:fk', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'fk', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Get all messages that are hidden in this location (or in no location at all) that have not been delivered to you yet.",
      returns: {arg: 'data', type: ['Message'], root: true},

    }
  );

  const FILTER_TYPES = { NEW:'new', NEW_IN_LOCATION: 'newInLocation', ACTIVE:'active', ALL:'all'};

  // messages that User has sent: ownerId === userId
  // messages that User is one of the recipients of
  // messages that are for everyoneInSphere
  model.getAllMyMessages = function(id, options, next) {
    let userId = options.accessToken.userId;
    _getMessagesWithFilter(id, userId, FILTER_TYPES.ALL, next);
  };

  // messages that User has sent: ownerId === userId
  // messages that User is one of the recipients of
  // messages that are for everyoneInSphere
  // AND where something still has to be delivered.
  model.getMyActiveMessages = function(id, options, next) {
    let userId = options.accessToken.userId;
    _getMessagesWithFilter(id, userId, FILTER_TYPES.ACTIVE, next);
  };

  // messages that User is one of the recipients of
  // messages that are for everyoneInSphere
  // AND they are not delivered yet
  model.getMyNewMessages = function(id, options, next) {
    let userId = options.accessToken.userId;
    _getMessagesWithFilter(id, userId, FILTER_TYPES.NEW, next);
  };


  // messages that User is one of the recipients of
  // messages that are for everyoneInSphere
  // AND they are not delivered yet
  // AND THEIR FK is this room
  model.getMyNewMessagesInLocation = function(id, fk, options, next) {
    let userId = options.accessToken.userId;
    _getMessagesWithFilter(id, userId, FILTER_TYPES.NEW_IN_LOCATION, next, fk);
  };


  /**
   * This searches for all messages in the sphere that belong to the user.
   * @param sphereId
   * @param userId
   * @param filterType
   * @param next
   * @param locationId
   * @private
   */
  const _getMessagesWithFilter = function(sphereId, userId, filterType, next, locationId) {
    // cast to string in case this is an IdObject
    let userIdString = String(userId);

    let whereFilter = {};
    switch (filterType) {
      case FILTER_TYPES.ALL:
        whereFilter = {};
        break;
      case FILTER_TYPES.ACTIVE:
      case FILTER_TYPES.NEW:
        whereFilter = {deliveredAll: false};
        break;
      case FILTER_TYPES.NEW_IN_LOCATION:
        whereFilter = {and:[{or: [{triggerLocationId: locationId},{triggerLocationId: undefined}]}, {deliveredAll: false}]};
        break;
    }


    // filter for messages where user is the recipient off.
    let filter = {
      include: {
        relation: 'messages',
        scope: {
          where: whereFilter,
          include: [
            {relation: 'recipients', scope: {fields: {id: true}}},
            {relation: 'delivered',  scope: {fields: {userId: true, timestamp: true}}},
            {relation: 'read',       scope: {fields: {userId: true, timestamp: true}}},
          ],
        }
      }};

    let myMessages = [];
    let myMessageIdList = {};
    let insertMessage = (message, delivered, recipients) => {
      // no duplicates
      if (myMessageIdList[message.id] !== undefined) { return; }

      myMessageIdList[message.id] = true;
      myMessages.push({
        triggerLocationId: message.triggerLocationId,
        triggerEvent: message.triggerEvent,
        content: message.content,
        everyoneInSphere: message.everyoneInSphere,
        everyoneInSphereIncludingOwner: message.everyoneInSphereIncludingOwner,
        id: message.id,
        ownerId: message.ownerId,
        sphereId: message.sphereId,
        recipients: recipients,
        delivered: delivered,
        read: message.read(),
      });
    };

    let isDeliveredToUser = (deliveredList) => {
      // check if this message has already been delivered to us.
      for (let i = 0; i < deliveredList.length; i++) {
        if (String(deliveredList[i].userId) === userIdString) { return true; }
      }
      return false;
    };

    let doesUserHaveAccessToMessage = (message, recipients) => {
      let userIsSender = String(message.ownerId) === userIdString;

      if (userIsSender || message.everyoneInSphereIncludingOwner || message.everyoneInSphere) {
        return true;
      }

      // is user in the list of recipients?
      for (let i = 0; i < recipients.length; i++) {
        if (String(recipients[i].id) === userIdString) { return true; }
      }

      return false;
    };

    model.findById(sphereId, filter)
      .then((sphere) => {
        if (!sphere) {
          throw "Sphere with id" + sphereId + " does not exist."
        }

        let messages = sphere.messages();
        for (let i = 0; i < messages.length; i++) {
          let message = messages[i];

          let userIsSender = String(message.ownerId) === userIdString;

          // if we are looking for all my messages, the ones i sent are part of this.
          if (filterType === FILTER_TYPES.ALL) {
            insertMessage(message, message.delivered(), message.recipients());
            continue;
          }


          let recipients = message.recipients();
          let userHasAccess = doesUserHaveAccessToMessage(message, recipients);
          if (!userHasAccess) {
            // next!
            continue;
          }

          let deliveredList = message.delivered();

          switch (filterType) {
            case FILTER_TYPES.ACTIVE:
              // if the user is the owner, any outstanding messages also count. This means the everyoneInSphere ones.
              if (userIsSender) {
                insertMessage(message, deliveredList, recipients);
                continue;
              }
              else {
                // if the user is not the sender, it is only active for him if it has not been delivered yet.
                let alreadyDelivered = isDeliveredToUser(deliveredList);
                // if not already delivered, add to the list
                if (!alreadyDelivered) {
                  insertMessage(message, deliveredList, recipients);
                  continue;
                }
              }
              break;
            case FILTER_TYPES.NEW:
              // same as new in location since the difference is in the where filter up top.
            case FILTER_TYPES.NEW_IN_LOCATION:
              // if the user is not the sender, it is only active for him if it has not been delivered yet.
              let alreadyDelivered = isDeliveredToUser(deliveredList);
              // if not already delivered, add to the list
              if (!alreadyDelivered) {
                insertMessage(message, deliveredList, recipients);
                continue;
              }
              break;
          }
        }

        next(null, myMessages)
      })
      .catch((err) => { next(err); })
  };


  model.setFloatingLocationPosition = function(data, sphereId, next) {
    model.findById(sphereId)
      .then((sphere) => {
        if (!sphere) { throw "Sphere with id" + sphereId + " does not exist."; }

        sphere.floatingLocationPosition(function(err, pos)  {
          if (err) { return next(err); }
          if (pos == null) {
            sphere.floatingLocationPosition.create(data, function(err, newPos) {
              if (err) { return next(err); }
              next(null, newPos)
            })
          }
          else {
            sphere.floatingLocationPosition.update(data, function(err, newPos) {
              if (err) { return next(err); }
              next(null, newPos)
            })
          }
        })
      })
      .catch((err) => {
        next(err);
      })
  };

  model.remoteMethod(
    'setFloatingLocationPosition',
    {
      http: {path: '/:id/floatingLocationPosition', verb: 'post'},
      accepts: [
        {arg: 'data', type: 'Position', required: true, http: { source : 'body' }},
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      returns: {arg: 'role', type: 'Position', root: true},
      description: "Set the position of the floating location"
    }
  );


  model.createToon = function(id, data, next) {
    let sphereInstance;
    let tokens;
    model.findById(id)
      .then((sphere) => {
        if (!sphere) {
          throw "Sphere with id" + id + " does not exist.";
        }
        sphereInstance = sphere;
        return ToonAPI.getAccessToken(data.refreshToken)
      })
      .then((receivedTokens) => {
        tokens = receivedTokens;
        return ToonAPI.getSchedule(tokens, data.toonAgreementId);
      })
      .then((schedule) => {
        data.refreshToken            = tokens.refreshToken;
        data.refreshTokenTTL         = tokens.refreshTokenTTL;
        data.refreshTokenUpdatedAt   = tokens.refreshTokenUpdatedAt;
        data.refreshTokenUpdatedFrom = tokens.refreshTokenUpdatedFrom + "_createToon";
        data.schedule = JSON.stringify(schedule);
        data.updatedScheduleTime = new Date().valueOf();
        return sphereInstance.Toons.create(data);
      })
      .then((toon) => {
        next(null, toon)
      })
      .catch((err) => {
        next(err);
      })
  }


  model.remoteMethod(
    'createToon',
    {
      http: {path: '/:id/Toons', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'data', type: 'Toon', required: true, http: { source : 'body' }},
      ],
      returns: {arg: 'role', type: 'Toon', root: true},
      description: "Create a new Toon integration for this Sphere"
    }
  );


  model.deleteAllToons = function(sphereId, next) {
    const ToonModel = loopback.getModel('Toon');
    ToonModel.find({where: {sphereId: sphereId}})
      .then((Toons) => {
        if (Toons.length == 0) {
          return; // we don't have to do anything.
        }

        let promises = [];
        for (let i = 0; i < Toons.length; i++) {
          let toon = Toons[i];
          promises.push(
            ToonAPI.getAccessToken(toon.refreshToken, toon.id).then((tokens) => { return ToonAPI.revokeToken(tokens.accessToken) }).catch(() => {})
          );
        }

        return Promise.all(promises);
      })
      .then(() => {
        return ToonModel.destroyAll({sphereId: sphereId})
      })
      .then(() => {
        next(null)
      })
      .catch((err) => {
        next(err);
      })
  }


  model.remoteMethod(
    'deleteAllToons',
    {
      http: {path: '/:id/Toons', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all Toons in this Sphere and have their tokens revoked their tokens"
    }
  );

  model.presentPeople = function(id, ignoreDeviceId, callback) {
    const sphereAccessModel = loopback.getModel("SphereAccess");
    const locationMapModel  = loopback.getModel("DeviceLocationMap");
    const sphereMapModel    = loopback.getModel("DeviceSphereMap");

    const PRESENCE_TIMEOUT = 20*60000; // 20 minutes;

    let locationMapResult = null;
    let userIds = [];
    let userMap = {};
    let threshold = new Date().valueOf() - PRESENCE_TIMEOUT;
    sphereAccessModel.find({where: {and: [{sphereId: id}, {invitePending: false}]}, fields: {userId: true}})
      .then((users) => {
        for (let i = 0; i < users.length; i++) {
          userIds.push(users[i].userId);
          userMap[users[i].userId] = {present:false, locations: []};
        }
        return locationMapModel.find({where: {and: [{sphereId: id}, {userId: {inq: userIds}}, {updatedAt: {gt: new Date(threshold)}}]}});
      })
      .then((result) => {
        locationMapResult = result;
        return sphereMapModel.find({where: {and: [{sphereId: id}, {userId: {inq: userIds}}, {updatedAt: {gt: new Date(threshold)}}]}})
      })
      .then((sphereMapResult) => {
        for (let i = 0; i < locationMapResult.length; i++) {
          let locationData = locationMapResult[i];
          if (locationData.deviceId === ignoreDeviceId) {
            continue;
          }

          if (userMap[locationData.userId] !== undefined) {
            userMap[locationData.userId].present = true;
            userMap[locationData.userId].locations.push(locationData.locationId);
          }
        }

        for (let i = 0; i < sphereMapResult.length; i++) {
          let sphereData = sphereMapResult[i];
          if (sphereData.deviceId === ignoreDeviceId) {
            continue;
          }

          if (userMap[sphereData.userId] !== undefined) {
            userMap[sphereData.userId].present = true;
          }
        }

        let result = [];
        for (let i = 0; i < userIds.length; i++) {
          if (userMap[userIds[i]].present === true) {
            result.push({ userId: userIds[i], locations: userMap[userIds[i]].locations})
          }
        };

        callback(null, result);
      })

      .catch((err) => {
        callback(err);
      })
  };

  model.remoteMethod(
    'presentPeople',
    {
      http: {path: '/:id/presentPeople', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'ignoreDeviceId', type: 'string', required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: ['object'], root: true},
      description: "Get an overview of the people that are currently in this Sphere. You can optionally provide a ignoreDeviceId, which is the device that will not be taken into account when determining the locations of the users."
    }
  );

  model.acceptInvite = function(id, options, callback) {
    const sphereAccessModel = loopback.getModel("SphereAccess");
    let userIdFromContext = options && options.accessToken && options.accessToken.userId || undefined;
    sphereAccessModel.updateAll({sphereId: id, userId: userIdFromContext, invitePending: true}, {invitePending: false},
      function (err, info) {
        if (err) { callback(err);};

        if (info.count == 0) {
          callback({statusCode: 404, message: "No pending invitation found!"});
        }
        else {
          // tell other people in the sphere to refresh their sphere user list.
          notificationHandler.notifySphereUsers(id, {data: { sphereId: id, command:"sphereUsersUpdated" }, silent: true });
          callback(null);
        }
      });
  };

  model.declineInvite = function(id, options, callback) {
    const sphereAccessModel = loopback.getModel("SphereAccess");
    let userIdFromContext = options && options.accessToken && options.accessToken.userId || undefined;
    sphereAccessModel.destroyAll({sphereId: id, userId: userIdFromContext, invitePending: true},
      function (err, info) {
        if (err) {callback(err);}

        if (info.count == 0) {
          callback({statusCode: 404, message: "No pending invitation found!"});
        }
        else {
          // tell other people in the sphere to refresh their sphere user list.
          notificationHandler.notifySphereUsers(id, {data: { sphereId: id, command:"sphereUsersUpdated" }, silent: true });
          callback(null);
        }
      })
  };

  model.remoteMethod(
    'acceptInvite',
    {
      http: {path: '/:id/inviteAccept', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Accept an invite for this sphere."
    }
  );

  model.remoteMethod(
    'declineInvite',
    {
      http: {path: '/:id/inviteDecline', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "decline an invite for this sphere."
    }
  );

  model.createHub = function(id, token, name, options, callback) {
    const hubModel = loopback.getModel("Hub");
    // TODO: check token length, at least 128 characters
    hubModel.create({
      sphereId: id,
      token: token,
      name: name
    })
      .then(()     => { callback(null); })
      .catch((err) => { callback(err);  })
  };


  model.remoteMethod(
    'createHub',
    {
      http: {path: '/:id/hub', verb: 'post'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: 'token', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'name',  type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Add a hub to this sphere."
    }
  );

  let CACHED_IP = null;

  model.beforeRemote('setHubLocalIP', function(context, user, next) {
    let ip = context.req.headers['x-forwarded-for'] || context.req.ip || context.req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
      ip = ip.substr(7)
    }
    CACHED_IP = ip || null;
    next()
  });


  model.setHubLocalIP = function(id, token, localIpAddress, options, callback) {
    let externalIp = CACHED_IP;
    CACHED_IP = null;
    if (!externalIp) {
      return callback("No External IP obtained...");
    }
    const hubModel = loopback.getModel("Hub");
    hubModel.findOne({where:{token: token, sphereId: id}})
      .then((result) => {
        if (!result) { throw "No hub found."}

        result.localIPAddress = localIpAddress;
        result.externalIPAddress = externalIp;

        return result.save();
      })
      .then(() => {
        callback();
      })
      .catch((err) => { callback(err); })
  }

  model.remoteMethod(
    'setHubLocalIP',
    {
      http: {path: '/:id/hubIpAddress', verb: 'put'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: 'token', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'localIpAddress',  type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Tell the sphere the local Ip address of the hub."
    }
  );


  model.remoteMethod(
    'getHubAddresses',
    {
      http: {path: '/:id/hubIpAddresses', verb: 'get'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: ['object'], root: true},
      description: "Get the local ip address of the hubs in this sphere."
    }
  );



  model.getOwnedStones = function(id, filter, options, callback) {
    model.findById(id, function(err, sphere) {
      if (err) return next(err);
      if (model.checkForNullError(sphere, callback, "id: " + id)) return;

      if (filter && filter.include && Array.isArray(filter.include) && filter.include.indexOf("abilities") !== -1) {
        let abilitiesBlocked = false;
        Util.deviceIsMinimalVersion(options, "4.1.0")
          .then((allowAbilities) => {
            abilitiesBlocked = !allowAbilities;
            if (allowAbilities === false) {
              if (filter.include.length === 1) {
                filter = {};
              }
              else {
                let positionOfAbilityFilter = filter.include.indexOf("abilities");
                filter.include.splice(positionOfAbilityFilter, 1);
              }
            }

            return sphere.ownedStones(filter)
          })
          .then((ownedStones) => {
            if (abilitiesBlocked) {
              let result = [];
              if (ownedStones.length > 0) {
                for (let i = 0; i < ownedStones.length; i++) {
                  result.push({...ownedStones[i].__data, abilities:[]})
                }
                return callback(null, result);
              }
              callback(null, ownedStones)
            }
          })
          .catch((err) => {
            callback(err);
          })
      }
      else {
        sphere.ownedStones(filter)
          .then((result) => {
            callback(null, result);
          })
      }
    })

  }

  model.remoteMethod(
    'getOwnedStones',
    {
      http: {path: '/:id/ownedStones', verb: 'get'},
      accepts: [
        {arg: 'id',    type: 'any', required: true, http: { source : 'path' }},
        {arg: 'filter',    type: 'any', required: false, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: ['Stone'], root: true},
      description: "Queries ownedStones of Sphere."
    }
  );
};
