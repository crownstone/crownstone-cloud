// "use strict";

const config = require('../../server/config');
const path = require('path');
const loopback = require('loopback');
const app = require('../../server/server');
const debug = require('debug')('loopback:crownstone');

const constants = require('./sharedUtil/constants');

const Util = require('./sharedUtil/util');
const emailUtil = require('../../server/emails/util');
const idUtil = require('./sharedUtil/idUtil');

module.exports = function(model) {

  ///// put the acls by default, since the base model user
  ///// already has the ACLs set anyway
  // let app = require('../../server/server');
  // if (app.get('acl_enabled')) {

  //***************************
  // GENERAL:
  //   - nothing
  //   - download user profile pic
  //***************************
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
    "property": "resendVerification"
  });
  //***************************
  // AUTHENTICATED:
  //   - create new user
  //   - request own user info
  //***************************
  model.settings.acls.push({
    "principalType": "ROLE",
    "principalId": "$authenticated",
    "permission": "ALLOW",
    "property": "create"
  });
  model.settings.acls.push({
    "principalType": "ROLE",
    "principalId": "$authenticated",
    "permission": "ALLOW",
    "property": "me"
  });
  model.settings.acls.push({
    "principalType": "ROLE",
    "principalId": "$authenticated",
    "permission": "ALLOW",
    "property": "getUserId"
  });
  //***************************
  // OWNER:
  //   - anything on the the users own item
  //***************************
  model.settings.acls.push({
    "accessType": "*",
    "principalType": "ROLE",
    "principalId": "$owner",
    "permission": "ALLOW"
  });
  // }

  /************************************
   **** Disable Remote Methods
   ************************************/

  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('exists');
  model.disableRemoteMethodByName('createChangeStream');

  model.disableRemoteMethodByName('prototype.__get__accessTokens');
  model.disableRemoteMethodByName('prototype.__create__accessTokens');
  model.disableRemoteMethodByName('prototype.__delete__accessTokens');
  model.disableRemoteMethodByName('prototype.__count__accessTokens');
  model.disableRemoteMethodByName('prototype.__findById__accessTokens');
  model.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  model.disableRemoteMethodByName('prototype.__updateById__accessTokens');

  model.disableRemoteMethodByName('prototype.__delete__spheres');
  model.disableRemoteMethodByName('prototype.__updateById__spheres');
  model.disableRemoteMethodByName('prototype.__destroyById__spheres');
  model.disableRemoteMethodByName('prototype.__link__spheres');
  model.disableRemoteMethodByName('prototype.__count__spheres');
  model.disableRemoteMethodByName('prototype.__exists__spheres');
  model.disableRemoteMethodByName('prototype.__findById__spheres');
  model.disableRemoteMethodByName('prototype.__get__spheres');

  model.disableRemoteMethodByName('prototype.__delete__hooks');
  model.disableRemoteMethodByName('prototype.__updateById__hooks');
  model.disableRemoteMethodByName('prototype.__destroyById__hooks');
  model.disableRemoteMethodByName('prototype.__link__hooks');
  model.disableRemoteMethodByName('prototype.__count__hooks');
  model.disableRemoteMethodByName('prototype.__findById__hooks');
  model.disableRemoteMethodByName('prototype.__get__hooks');
  model.disableRemoteMethodByName('prototype.__create__hooks');
  model.disableRemoteMethodByName('prototype.__get__hooks');

  model.disableRemoteMethodByName('prototype.__delete__devices');

  model.disableRemoteMethodByName('prototype.__get__installations');
  model.disableRemoteMethodByName('prototype.__findById__installations');
  model.disableRemoteMethodByName('prototype.__exists__installations');
  model.disableRemoteMethodByName('prototype.__create__installations');
  model.disableRemoteMethodByName('prototype.__delete__installations');
  model.disableRemoteMethodByName('prototype.__deleteById__installations');
  model.disableRemoteMethodByName('prototype.__destroyById__installations');
  model.disableRemoteMethodByName('prototype.__updateById__installations');
  model.disableRemoteMethodByName('prototype.__link__installations');
  model.disableRemoteMethodByName('prototype.__unlink__installations');
  model.disableRemoteMethodByName('prototype.__count__installations');

  model.disableRemoteMethodByName('prototype.__get__messages');
  model.disableRemoteMethodByName('prototype.__findById__messages');
  model.disableRemoteMethodByName('prototype.__exists__messages');
  model.disableRemoteMethodByName('prototype.__create__messages');
  model.disableRemoteMethodByName('prototype.__delete__messages');
  model.disableRemoteMethodByName('prototype.__deleteById__messages');
  model.disableRemoteMethodByName('prototype.__destroyById__messages');
  model.disableRemoteMethodByName('prototype.__updateById__messages');
  model.disableRemoteMethodByName('prototype.__link__messages');
  model.disableRemoteMethodByName('prototype.__unlink__messages');
  model.disableRemoteMethodByName('prototype.__count__messages');

  model.disableRemoteMethodByName('prototype.__get__ownedMessages');
  model.disableRemoteMethodByName('prototype.__findById__ownedMessages');
  model.disableRemoteMethodByName('prototype.__exists__ownedMessages');
  model.disableRemoteMethodByName('prototype.__create__ownedMessages');
  model.disableRemoteMethodByName('prototype.__delete__ownedMessages');
  model.disableRemoteMethodByName('prototype.__deleteById__ownedMessages');
  model.disableRemoteMethodByName('prototype.__destroyById__ownedMessages');
  model.disableRemoteMethodByName('prototype.__updateById__ownedMessages');
  model.disableRemoteMethodByName('prototype.__link__ownedMessages');
  model.disableRemoteMethodByName('prototype.__unlink__ownedMessages');
  model.disableRemoteMethodByName('prototype.__count__ownedMessages');



  /************************************
   **** Model Validation
   ************************************/

  // reserved user roles for special liberties
  // model.validatesExclusionOf('role', {in: ['superuser', 'admin', 'lib-user'], allowNull: true});

  // const regex = /^(?=.*\d).{8,}$/; // Password must be at least 8 characters long and include at least one numeric digit.
  // const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,}$/; // Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, one numeric digit, and no spaces.
  // const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)(?=.*[!@#$%^&amp;*()_+}{&quot;:;'?/&gt;.&lt;,]).{8,}$/; // Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, one numeric digit, no spaces, and one special character
  // model.validatesFormatOf('password', {with: regex, message: 'Invalid format. Password needs to be at least 8 characters long and include at least 1 digit'})

  /************************************
   **** Verification checks
   ************************************/

  // check that the owner of a sphere can't unlink himself from the sphere, otherwise there will
  // be access problems to the sphere. And a sphere should never be without an owner.
  model.beforeRemote('*.__unlink__spheres', function(context, user, next) {

    const Sphere = loopback.findModel('Sphere');
    Sphere.findById(context.args.fk, function(err, sphere) {
      if (err) return next(err);
      if (!sphere) return next();

      if (String(sphere.ownerId) === String(context.instance.id)) {
        let error = new Error("can't exit from sphere where user with id is the owner");
        return next(error);
      } else {
        next();
      }
    })
  });

  // check that a user is not deleted as long as he is owner of a sphere
  model.observe('before delete', function(context, next) {
    const Sphere = loopback.findModel('Sphere');
    Sphere.find({where:{ownerId: context.where.id}}, function(err, spheres) {
      if (err) return next(err);
      if (spheres.length > 0) {
        let error = new Error("Can't delete user as long as he is owner of a sphere");
        next(error);
      } else {
        next();
      }
    });
  });

  model.afterRemoteError('confirm', function(ctx, next) {
    // debug('confirmation failed!', ctx.error);
    // debug(ctx.res)

    // ctx.req.args.uid

    ctx.res.render('response', {
      title: 'Verification failed',
      content: ctx.error,
      redirectTo: '/resend-verification',
      redirectToLinkText: 'Resend verification'
    });
    // next(null);
    // next();
  });

  /************************************
   **** Cascade
   ************************************/

  // if the sphere is deleted, delete also all files stored for this sphere
  model.observe('after delete', function(ctx, next) {
    model.deleteAllFiles(ctx.where.id, ctx.options, next);
  });

  /************************************
   **** Custom functions
   ************************************/

  /**
   * TODO: If the email bounces, the user is not notified. If the user registers again the user will get the message
   * "Email already exists".
   *
   */
  model.sendVerification = function(user, tokenGenerator, language, callback) {
    console.log("New account. Send email to verify user.");
    let options = emailUtil.getVerificationEmailOptions(user, language);
    options.generateVerificationToken = tokenGenerator;
    options.verifyHref = app.__baseUrl + '/api/users/confirm?uid=' + user.id + '&redirect=/verified';
    debug("sending verification");
    user.verify(options, callback);
  };

  model.onCreate = function(context, user, callback) {
    if (model.settings.emailVerificationRequired) {
      let language = "en_us";
      if (context && context.req && context.req.body && context.req.body.language && context.req.body.language == "nl_nl") {
        language = "nl_nl"
      }
      model.sendVerification(user, null, language, function(err, response) {
        if (err) return callback(err);
        callback();
      })
    } else {
      callback();
    }
  };


  //send verification email after registration
  model.afterRemote('create', function(ctx, user, next) {
    model.onCreate(ctx, user, next);
  });

  //send password reset link when requested
  model.on('resetPasswordRequest', function(info) {
    let email = info.email;
    console.log("Send password request to " + email);

    let baseUrl = app.__baseUrl;
    let url = baseUrl + '/reset-password';
    let token = info.accessToken.id;
    emailUtil.sendResetPasswordRequest(url, token, email);
  });

  model.resendVerification = function(email, callback) {
    model.findOne({where: {email: email}}, function(err, user) {
      //console.log("Resend to user", user);
      if (err) return callback(err);
      if (model.checkForNullError(user, callback, "email: " + email)) return;

      if (!user.emailVerified) {
        if (user.verificationToken) {
          model.sendVerification(user,
            function(user, tokenProvider) { tokenProvider(null, user.verificationToken); },
            "en_us",
            function(err, response) { callback(err); }
          );
        } else {
          model.sendVerification(user, null, "en_us",function(err, response) { callback(err); });
        }
      }
      else {
        let err = new Error("user already verified");
        err.statusCode = 400;
        err.code = 'ALREADY_VERIFIED';
        callback(err);
      }
    })
  };

  model.remoteMethod(
    'resendVerification',
    {
      http: {path: '/resendVerification', verb: 'post'},
      accepts: {arg: 'email', type: 'string', required: true, 'http': {source: 'query'}},
      description: "Resend verification email"
    }
  );

  model.me = function(options, callback) {
    // debug("me");
    let errorMessage = "Could not find user.";
    if (options && options.accessToken && options.accessToken.userId) {
      model.findById(options.accessToken.userId)
        .then((user) => {
          if (user === null) {
            throw errorMessage;
          }
          else {
            callback(null, user);
          }
        })
        .catch((err) => {
          callback(err);
        });
    }
    else {
      callback(errorMessage);
    }
  };

  model.remoteMethod(
    'me',
    {
      http: {path: '/me', verb: 'get'},
      accepts: [
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'user', root: true},
      description: "Return instance of authenticated User"
    }
  );

  model.getUserId = function(options, callback) {
    // debug("me");
    let errorMessage = "Could not find user.";
    if (options && options.accessToken && options.accessToken.userId) {
      callback(null, options.accessToken.userId)
    }
    else {
      callback(errorMessage);
    }
  };

  model.remoteMethod(
    'getUserId',
    {
      http: {path: '/userId', verb: 'get'},
      accepts: [
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'string', root: true},
      description: "Return userId of authenticated User"
    }
  );


  model.spheres = function(id, filter, callback) {
    // we filter out the spheres to which we have not yet finalized the invite.
    const SphereAccess = loopback.getModel('SphereAccess');
    SphereAccess.find({where: {and: [{userId: id}, {invitePending: {neq: true}}]}, fields: "sphereId"})
      .then((sphereIds) => {
        let idArray = [];
        for (let i = 0; i < sphereIds.length; i++) {
          idArray.push(sphereIds[i].sphereId)
        }
        let query = {where: {id: {inq: idArray}}};
        if (filter && typeof filter === 'object' && filter.include) {
          query.include = filter.include;
        }
        let sphereModel = loopback.getModel('Sphere');
        return sphereModel.find(query)
      })
      .then((spheres) => {
        callback(null, spheres)
      })
      .catch((err) => {
        callback(err);
      })
  };

  model.remoteMethod(
    'spheres',
    {
      http: {path: '/:id/spheres', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'filter', type: 'any', required: false, http: { source : 'query' }}
      ],
      returns: {arg: 'data', type: ['Sphere'], root: true},
      description: "Queries spheres of user"
    }
  );

  // model.countSpheres = function(id, callback) {
  //   model.spheres(id, function(err, res) {
  //     if (err) callback(err);
  //     callback(null, res.length);
  //   })
  // };
  //
  // model.remoteMethod(
  //   'countSpheres',
  //   {
  //     http: {path: '/:id/spheres/count', verb: 'get'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }}
  //     ],
  //     returns: {arg: 'count', type: 'number'},
  //     description: "Count spheres of user"
  //   }
  // );

  // model.notifyDevices = function(message, id, callback) {
  //   // debug("notifyDevices:", message);
  //
  //
  // };
  //
  // model.remoteMethod(
  //   'notifyDevices',
  //   {
  //     http: {path: '/:id/notifyDevices', verb: 'post'},
  //     accepts: [
  //       {arg: 'message', type: 'string', 'http': {source: 'query'}},
  //       {arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
  //     ],
  //     description: "Push notification to all Devices of user"
  //   }
  // );

  /************************************
   **** Container Methods
   ************************************/
  //
  // model.listFiles = function(id, options, callback) {
  //   const Container = loopback.getModel('UserContainer');
  //   Container._getFiles(id, options, callback);
  // };
  //
  // model.remoteMethod(
  //   'listFiles',
  //   {
  //     http: {path: '/:id/files', verb: 'get'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: "options", type: "object", http: "optionsFromRequest"},
  //     ],
  //     returns: {arg: 'files', type: 'array', root: true},
  //     description: "Queries files of User"
  //   }
  // );
  //
  // model.countFiles = function(id, options, callback) {
  //   const Container = loopback.getModel('UserContainer');
  //   Container._getFiles(id, options, function(err, res) {
  //     if (err) return callback(err);
  //
  //     callback(null, res.length);
  //   });
  // };

  // model.remoteMethod(
  //   'countFiles',
  //   {
  //     http: {path: '/:id/files/count', verb: 'get'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: "options", type: "object", http: "optionsFromRequest"},
  //     ],
  //     returns: {arg: 'count', type: 'number'},
  //     description: "Count files of User"
  //   }
  // );


  model.deleteFile = function(id, fk, options, callback) {
    const Container = loopback.getModel('UserContainer');
    Container._deleteFile(id, fk, options, callback);
  };

  // model.remoteMethod(
  //   'deleteFile',
  //   {
  //     http: {path: '/:id/files/:fk', verb: 'delete'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'fk', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: "options", type: "object", http: "optionsFromRequest"},
  //     ],
  //     description: "Delete a file by id"
  //   }
  // );

  model.downloadFile = function(id, fk, res, options, callback) {
    const Container = loopback.getModel('UserContainer');
    Container._download(id, fk, res, options, function(err, file) {
      if (err) return callback(err);
      callback(null, file);
    });
  };
  //
  // model.remoteMethod(
  //   'downloadFile',
  //   {
  //     http: {path: '/:id/files/:fk', verb: 'get'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'fk', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'res', type: 'object', 'http': { source: 'res' }},
  //       {arg: 'options', type: 'object', http: 'optionsFromRequest'},
  //     ],
  //     description: "Download a file by id"
  //   }
  // );
  //
  model.uploadFile = function(id, req, options, callback) {
    const Container = loopback.getModel('UserContainer');
    Container._upload(id, req, options, callback);
  };
  //
  // model.remoteMethod(
  //   'uploadFile',
  //   {
  //     http: {path: '/:id/files', verb: 'post'},
  //     accepts: [
  //       {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
  //       {arg: 'req', type: 'object', http: { source: 'req' }},
  //       {arg: 'options', type: 'object', http: 'optionsFromRequest'},
  //     ],
  //     returns: {arg: 'file', type: 'object', root: true},
  //     description: "Upload a file to User"
  //   }
  // );

  model.uploadProfilePic = function(id, req, options, callback) {
    // debug("uploadProfilePic");

    let upload = function(user, req) {
      // upload the file
      model.uploadFile(user.id, req, options, function(err, file) {
        if (err) return callback(err);

        // and set the id as profilePicId
        user.profilePicId = String(file._id);
        user.save();

        callback(null, file);
      });
    };

    // get the user instance
    model.findById(id, function(err, user) {
      if (err) return callback(err);
      if (model.checkForNullError(user, callback, "id: " + id)) return;

      // if there is already a profile picture uploaded, delete the old one first
      if (user.profilePicId) {
        model.deleteFile(user.id, user.profilePicId, options, function(err, file) {
          if (err) return callback(err);
          upload(user, req);
        });
      }
      else {
        upload(user, req);
      }
    });
  };

  model.remoteMethod(
    'uploadProfilePic',
    {
      http: {path: '/:id/profilePic', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'req', type: 'object', http: { source: 'req' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'file', type: 'object', root: true},
      description: "Upload profile pic to User"
    }
  );

  model.downloadProfilePicById = function(id, res, options, callback) {
    // debug("downloadProfilePicById");

    model.findById(id, function(err, user) {
      if (err) return callback(err);
      if (model.checkForNullError(user, callback, "id: " + id)) return;
      model.downloadFile(id, user.profilePicId, res, options, callback);
    });
  };

  model.remoteMethod(
    'downloadProfilePicById',
    {
      http: {path: '/:id/profilePic', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'res', type: 'object', 'http': { source: 'res' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: "Download profile pic of User"
    }
  );

  model.deleteProfilePicById = function(id, options, callback) {
    // debug("downloadProfilePicById");
    model.findById(id, function(err, user) {
      if (err) return callback(err);
      if (model.checkForNullError(user, callback, "id: " + id)) return;
      if (idUtil.verifyMongoId(user.profilePicId) === false) {
        // remove the profile pic
        user.profilePicId = null;
        user.save()
          .then(() => {
            callback();
          })
      }
      else {
        model.deleteFile(id, user.profilePicId, options, (err, result) => {
          if (err) { return callback(err); }

          // remove the profile pic
          user.profilePicId = null;
          user.save()
            .then(() => {
              callback();
            })
            .catch((err) => {
              callback(err);
            })
        })
      }
    });
  };

  model.remoteMethod(
    'deleteProfilePicById',
    {
      http: {path: '/:id/profilePic', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: "Delete profile pic of User"
    }
  );

  /************************************
   **** Keys Methods
   ************************************/

  const getSphereKeys = function(sphereId, accessMap, container) {
    const SphereKeyModel = loopback.getModel('SphereKeys');
    let containerIndex   = container.length - 1;
    return SphereKeyModel.find({where:{sphereId: sphereId}})
      .then((sphereKeys) => {
        for (let i = 0; i < sphereKeys.length; i++) {
          let key = sphereKeys[i];
          if (accessMap === "*" || accessMap[key.keyType] === true) {
            container[containerIndex].sphereKeys.push({id: key.id, keyType: key.keyType, key: key.key, ttl: key.ttl, createdAt: key.createdAt});
          }
        }
      })
  }

  const getKeysForUser = function(sphereId, role, container, stoneId) {
    const StoneKeyModel = loopback.getModel('StoneKeys');
    let containerIndex  = container.length - 1;
    let accessMap = {};
    switch (role) {
      case "admin":
        // gets netkey, appkey, servicedatakey, adminkey, memberkey, basickey and all stone keys.
        return getSphereKeys(sphereId, "*", container)
          .then(() => {
            if (stoneId) {
              return StoneKeyModel.find({where: {and: [{sphereId: sphereId}, {stoneId: stoneId}]}});
            }
            return StoneKeyModel.find({where: {sphereId: sphereId}});
          })
          .then((stoneKeys) => {
            // This is a self-repair mechanism. If a user requests a specific stone's key, we ensure there is a uart key.
            let hasUartKey = false;
            for (let i = 0; i < stoneKeys.length; i++) {
              let key = stoneKeys[i];
              if (key.keyType === constants.KEY_TYPES.DEVICE_UART_KEY) {
                hasUartKey = true; break;
              }
            }
            if (stoneId && hasUartKey === false) {
              return StoneKeyModel.create([{sphereId: sphereId, stoneId: stoneId, keyType: constants.KEY_TYPES.DEVICE_UART_KEY, key: Util.createKey(), ttl: 0}])
                .then(() => { return StoneKeyModel.find({where: {and: [{sphereId: sphereId}, {stoneId: stoneId}]}}); })
            }
            else {
              return stoneKeys
            }
          })
          .then((stoneKeys) => {
            for (let i = 0; i < stoneKeys.length; i++) {
              let key = stoneKeys[i];
              if (container[containerIndex].stoneKeys[key.stoneId] === undefined) {
                container[containerIndex].stoneKeys[key.stoneId] = [];
              }
              container[containerIndex].stoneKeys[key.stoneId].push({id: key.id, keyType: key.keyType, key: key.key, ttl: key.ttl, createdAt: key.createdAt});
            }
          })
      case "member":
        // gets servicedatakey, memberkey, basickey.
        accessMap[constants.KEY_TYPES.MEMBER_KEY] = true;
        accessMap[constants.KEY_TYPES.BASIC_KEY] = true;
        accessMap[constants.KEY_TYPES.LOCALIZATION_KEY] = true;
        accessMap[constants.KEY_TYPES.SERVICE_DATA_KEY] = true;
        return getSphereKeys(sphereId, accessMap, container);
      case "guest":
        // gets servicedatakey and basickey.
        accessMap[constants.KEY_TYPES.LOCALIZATION_KEY] = true;
        accessMap[constants.KEY_TYPES.SERVICE_DATA_KEY] = true;
        accessMap[constants.KEY_TYPES.BASIC_KEY] = true;
        return getSphereKeys(sphereId, accessMap, container);
    }
  }

  model.getEncryptionKeysV2 = function(id, sphereId, stoneId, callback) {
    const SphereAccess = loopback.getModel('SphereAccess');
    let queryArray = [{userId: id}, {invitePending: {neq: true}}];
    if (sphereId) { queryArray.push({sphereId: sphereId}) }

    let result = [];
    SphereAccess.find({where: {and: queryArray}})
      .then((accessInSpheres) => {
        let keyPromises = [];
        accessInSpheres.forEach((sphereAccess) => {
          result.push({
            sphereId: sphereAccess.sphereId,
            sphereAuthorizationToken: sphereAccess.sphereAuthorizationToken,
            sphereKeys: [],
            stoneKeys: {}
          });
          if (sphereAccess && sphereAccess.role) {
            keyPromises.push(getKeysForUser(sphereAccess.sphereId, sphereAccess.role, result, stoneId));
          }
        })
        return Promise.all(keyPromises);
      })
      .then(() => {
        callback(null, result);
      })
      .catch((err) => {
        callback(err);
      })
  };


  model.getEncryptionKeys = function(id, callback) {
    const SphereAccess = loopback.getModel('SphereAccess');
    let queryArray = [{userId: id}, {invitePending: {neq: true}}];
    let result = [];
    SphereAccess.find({where: {and: queryArray}})
      .then((accessInSpheres) => {
        let keyPromises = [];
        accessInSpheres.forEach((sphereAccess) => {
          result.push({sphereId: sphereAccess.sphereId, sphereKeys: [], stoneKeys: {}});
          if (sphereAccess && sphereAccess.role) {
            keyPromises.push(getKeysForUser(sphereAccess.sphereId, sphereAccess.role, result));
          }
        })
        return Promise.all(keyPromises);
      })
      .then(() => {
        let keyResult = [];
        result.forEach((sphereData) => {

          let keys = {};
          sphereData.sphereKeys.forEach((keyData) => {
            if (keyData.ttl !== 0) { return };

            switch (keyData.keyType) {
              case constants.KEY_TYPES.ADMIN_KEY:
                keys['admin'] = keyData.key; return;
              case constants.KEY_TYPES.MEMBER_KEY:
                keys['member'] = keyData.key; return;
              case constants.KEY_TYPES.BASIC_KEY:
                keys['guest'] = keyData.key; return;
            }
          })


          keyResult.push({
            sphereId: sphereData.sphereId,
            keys: keys
          })
        })

        callback(null, keyResult);
      })
      .catch((err) => {
        callback(err);
      })




    //
    //
    //
    // const SphereAccess = loopback.getModel('SphereAccess');
    // SphereAccess.find({where: {and: [{userId: id}, {invitePending: {neq: true}}]}, include: "sphere"}, function(err, objects) {
    //   let keys = Array.from(objects, function(access) {
    //     let sphere = { sphereId: access.sphereId, keys: {}};
    //     let sphereData = access.sphere();
    //     // console.log('sphereData',sphere, access);
    //     switch (access.role) {
    //       case "admin":
    //         sphere.keys.admin  = sphereData.adminEncryptionKey;
    //       case "member":
    //         sphere.keys.member = sphereData.memberEncryptionKey;
    //       case "guest":
    //         sphere.keys.guest  = sphereData.guestEncryptionKey;
    //     }
    //     return sphere
    //   });
    //
    //   callback(null, keys);
    // });
  };

  model.remoteMethod(
    'getEncryptionKeys',
    {
      http: {path: '/:id/keys', verb: 'get'},
      accepts: {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      returns: {arg: 'data', type: ['object'], root: true},
      description: "LEGACY: Returns encryption keys per Sphere of User"
    }
  );

  model.remoteMethod(
    'getEncryptionKeysV2',
    {
      http: {path: '/:id/keysV2', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'sphereId', type: 'any', required: false, http: { source : 'query' }},
        {arg: 'stoneId', type: 'any', required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: ['object'], root: true},
      description: "Returns encryption keys available to this User. TTL is in seconds since createdAt. TTL 0 means does not expire."
    }
  );

  /************************************
   **** Delete ALL functions
   ************************************/

  model.deleteAllDevices = function(id, callback) {
    debug("deleteAllDevices");
    model.findById(id, {include: "devices"}, function(err, user) {
      if (err) return callback(err);
      if (model.checkForNullError(user, callback, "id: " + id)) return;

      user.devices.destroyAll(function(err) {
        callback(err);
      });
    })
  };

  model.remoteMethod(
    'deleteAllDevices',
    {
      http: {path: '/:id/deleteAllDevices', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all devices of User"
    }
  );

  model.deleteAllFiles = function(id, options, callback) {
    debug("deleteAllFiles");
    const Container = loopback.getModel('UserContainer');
    Container._deleteContainer(id, options, callback);
  };

  model.remoteMethod(
    'deleteAllFiles',
    {
      http: {path: '/:id/deleteAllFiles', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: "Delete all files of User"
    }
  );

  model.deleteAllSpheres = function(id, callback) {
    debug("deleteAllSpheres");

    // get a reference to the sphere model which we need to query for stones.
    const sphereModel = loopback.getModel("Sphere");
    let completed = false;
    // get all spheres from the user
    model.findById(id, {include: "spheres"})
      .then((user) => {
        let userSpheres = user.spheres();
        if (model.checkForNullError(user, callback, "id: " + id)) {
          return;
        }

        if (userSpheres.length === 0) {
          completed = true;
          return callback();
        }

        let promisesPerSphere = [];
        let spheresWithStones = 0;
        let sphereObjectWithStones = {}; // used for error message.
        for (let i = 0; i < userSpheres.length; i++) {
          let sphere = user.spheres()[i];
          promisesPerSphere.push(sphereModel.findById(sphere.id, {include: "ownedStones"})
            .then((sphereData) => {
              let ownedStones = sphereData.ownedStones();
              if (ownedStones.length > 0) {
                spheresWithStones += 1;
                sphereObjectWithStones = sphere;
              }
            })
          );
        }
        return Promise.all(promisesPerSphere).then(() => {
          if (spheresWithStones > 0) {
            throw new Error('Stones detected in sphere ' + sphereObjectWithStones.name + ' (' + sphereObjectWithStones.id + '). Can not delete all Spheres until they all have their stones removed.')
          }
          return userSpheres;
        })
      })
      .then((userSpheres) => {
        if (!completed) {
          let removalPromises = [];
          userSpheres.forEach((sphere) => {
            removalPromises.push(sphere.destroy());
          });
          return Promise.all(removalPromises)
        }
      })
      .then(() => {
        if (!completed) {
          return callback();
        }
      })
      .catch((err) => {
        if (!completed) {
          return callback(err);
        }
      });


    // user.spheres.destroyAll(function(err) {
    // 	callback(err);
    // });
  };

  model.remoteMethod(
    'deleteAllSpheres',
    {
      http: {path: '/:id/deleteAllSpheres', verb: 'delete'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      description: "Delete all spheres of User"
    }
  );


  model.currentLocation = function(id, callback) {
    const deviceModel   = loopback.getModel("Device");
    const sphereModel   = loopback.getModel("Sphere");
    const locationModel = loopback.getModel("Location");
    const sphereMapModel   = loopback.getModel("DeviceSphereMap");
    const locationMapModel = loopback.getModel("DeviceLocationMap");

    let sphereIds = [];
    let locationIds = [];
    let sphereMap = {};
    let locationMap = {};
    let deviceResults = [];
    let deviceMap = {};


    const PRESENCE_TIMEOUT = 20*60000; // 20 minutes;
    let threshold = new Date().valueOf() - PRESENCE_TIMEOUT;

    deviceModel.find({where: {ownerId: id}, fields: ["id","name"]})
      .then((results) => {
        if (results.length === 0) {
          callback(null, [])
          return;
        }
        else {
          deviceResults = results;
          let deviceIds = [];
          for (let i = 0; i < results.length; i++) {
            deviceIds.push(results[i].id);
          }

          return sphereMapModel.find({where: {and: [{deviceId: {inq: deviceIds}}, {updatedAt: {gt: new Date(threshold)}}]}})
            .then((sphereMapResults) => {
              for ( let i = 0; i < sphereMapResults.length; i++ ) {
                sphereIds.push(sphereMapResults[i].sphereId);
                if (deviceMap[sphereMapResults[i].deviceId] === undefined) {
                  deviceMap[sphereMapResults[i].deviceId] = {};
                }
                deviceMap[sphereMapResults[i].deviceId][sphereMapResults[i].sphereId] = [];
              }
              return locationMapModel.find({where: {and: [{deviceId: {inq: deviceIds}}, {updatedAt: {gt: new Date(threshold)}}]}});
            })
            .then((locationMapResults) => {
              for (let i = 0; i < locationMapResults.length; i++) {
                if (deviceMap[locationMapResults[i].deviceId] !== undefined) {
                  locationIds.push(locationMapResults[i].locationId);
                  if (deviceMap[locationMapResults[i].deviceId][locationMapResults[i].sphereId] === undefined) {
                    deviceMap[locationMapResults[i].deviceId][locationMapResults[i].sphereId] = []
                  }
                  deviceMap[locationMapResults[i].deviceId][locationMapResults[i].sphereId].push(locationMapResults[i].locationId);
                }
              }

              return sphereModel.find({where: {id: {inq: sphereIds}}, fields: ["id", "name"]})
            })
            .then((sphereResults) => {
              sphereResults.forEach((sphereRes) => {
                sphereMap[sphereRes.id] = sphereRes;
              })

              if (locationIds.length > 0) {
                return locationModel.find({where: {id: {inq: locationIds}}, fields: ["id", "name", "sphereId"]});
              }
              return [];
            })
            .then((locationResults) => {
              locationResults.forEach((locationRes) => {
                locationMap[locationRes.id] = locationRes;
              })
            })
            .then(() => { // construct the return data.
              let returnData = [];
              deviceResults.forEach((deviceRes) => {
                let deviceId = deviceRes.id;
                if (deviceMap[deviceId] === undefined) {
                  return;
                }

                let data = {
                  deviceId: deviceId,
                  deviceName: deviceRes.name,
                  inSpheres: []
                };

                let sphereIds = Object.keys(deviceMap[deviceId]);
                // console.log("sphereMap", sphereMap, "sphereIds", sphereIds, "deviceRes",deviceRes)
                sphereIds.forEach((sphereId) => {
                  if (sphereMap[sphereId] === undefined) { return; }

                  let sphereData = {
                    sphereId: sphereId,
                    sphereName: sphereMap[sphereId].name,
                    inLocation: {}
                  }

                  deviceMap[deviceId][sphereId].forEach((locationId) => {
                    sphereData.inLocation = {
                      locationId: locationId,
                      locationName: locationMap[locationId].name
                    };
                  })

                  data.inSpheres.push(sphereData);
                })

                returnData.push(data);
              })

              callback(null, returnData);
            })
        }
      })
      .catch((err) => {
        callback(err);
      })
  };

  model.remoteMethod(
    'currentLocation',
    {
      http: {path: '/:id/currentLocation', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      returns: {arg: 'data', type: ['object'], root: true},
      description: "Get the current location data of this user."
    }
  );



  model.pendingInvites = function(id, callback) {
    const SphereAccess = loopback.getModel('SphereAccess');
    let roleIndex = {};

    SphereAccess.find({where: {and: [{userId: id}, {invitePending: true}]}})
      .then((sphereAccessResults) => {
        let idArray = [];
        for (let i = 0; i < sphereAccessResults.length; i++) {
          idArray.push(sphereAccessResults[i].sphereId);
          roleIndex[sphereAccessResults[i].sphereId] = sphereAccessResults[i].role;
        }
        let query = {where: {id: {inq: idArray}}};
        let sphereModel = loopback.getModel('Sphere');
        return sphereModel.find(query)
      })
      .then((spheres) => {
        let results = [];
        for (let i = 0; i < spheres.length; i++) {
          let entry = spheres[i];
          entry['role'] = roleIndex[entry.id];
          results.push(entry);
        }

        callback(null, results)
      })
      .catch((err) => {
        callback(err);
      })
  };

  model.remoteMethod(
    'pendingInvites',
    {
      http: {path: '/:id/pendingInvites', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }}
      ],
      returns: {arg: 'Spheres', type: ['any'], root: true},
      description: "Get your pending invites to spheres. This includes a 'role' field with the access level you are invited for."
    }
  );

};

