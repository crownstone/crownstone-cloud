"use strict";

let loopback = require('loopback');
const messageUtils = require('./sharedUtil/messageUtil');
const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

  let app = require('../../server/server');
  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');

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
    //***************************
    // OWNER:
    //   - everything
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$owner",
      "permission": "ALLOW"
    });
    //***************************
    // ADMIN:
    //   - allow delivered write
    //   - allow read write
    //   - allow get
    //***************************
    model.settings.acls.push({
      "accessType": "READ",
      "principalType": "ROLE",
      "principalId": "$group:admin",
      "permission": "ALLOW"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:admin",
      "permission": "ALLOW",
      "property": "__create__read"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:admin",
      "permission": "ALLOW",
      "property": "__create__delivered"
    });

    //***************************
    // MEMBER:
    //   - allow delivered write
    //   - allow read write
    //   - allow get
    //***************************
    model.settings.acls.push({
      "accessType": "READ",
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "ALLOW"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "ALLOW",
      "property": "markRead"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "ALLOW",
      "property": "markDelivered"
    });

    //***************************
    // GUEST:
    //   - everything except:
    //   	- delete messages
    //    - change recipients
    //***************************
    model.settings.acls.push({
      "accessType": "READ",
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "ALLOW"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "ALLOW",
      "property": "markRead"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "ALLOW",
      "property": "markDelivered"
    });
    //***************************
    // LIB-USER:
    //   - nothing
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "lib-user",
      "permission": "DENY"
    });
  }


  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('destroyById');
  model.disableRemoteMethodByName('deleteById');
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('prototype.patchAttributes');

  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__triggerLocation');

  model.disableRemoteMethodByName('prototype.__create__delivered');
  model.disableRemoteMethodByName('prototype.__delete__delivered');
  model.disableRemoteMethodByName('prototype.__updateById__delivered');
  model.disableRemoteMethodByName('prototype.__deleteById__delivered');
  model.disableRemoteMethodByName('prototype.__destroyById__delivered');
  model.disableRemoteMethodByName('prototype.__findById__delivered');
  model.disableRemoteMethodByName('prototype.__count__delivered');

  model.disableRemoteMethodByName('prototype.__create__read');
  model.disableRemoteMethodByName('prototype.__delete__read');
  model.disableRemoteMethodByName('prototype.__updateById__read');
  model.disableRemoteMethodByName('prototype.__deleteById__read');
  model.disableRemoteMethodByName('prototype.__destroyById__read');
  model.disableRemoteMethodByName('prototype.__findById__read');
  model.disableRemoteMethodByName('prototype.__count__read');

  model.disableRemoteMethodByName('prototype.__unlink__recipients');
  model.disableRemoteMethodByName('prototype.__delete__recipients');
  model.disableRemoteMethodByName('prototype.__find__recipients');
  model.disableRemoteMethodByName('prototype.__updateById__recipients');
  model.disableRemoteMethodByName('prototype.__deleteById__recipients');
  model.disableRemoteMethodByName('prototype.__destroyById__recipients');
  model.disableRemoteMethodByName('prototype.__findById__recipients');
  model.disableRemoteMethodByName('prototype.__count__recipients');
  model.disableRemoteMethodByName('prototype.__exists__recipients');
  model.disableRemoteMethodByName('prototype.__create__recipients');
  model.disableRemoteMethodByName('prototype.__get__recipients');


  const injectOwner = function(ctx, next) {
    let item;
    if (ctx.isNewInstance) {
      item = ctx.instance;
    } else {
      item = ctx.data;

      if (!item) {
        debug("ctx.data is NULL!!");
        item = ctx.instance;
      }
    }

    if (item.triggerEvent !== 'enter' && item.triggerEvent !== 'exit') {
      return next(new Error("Trigger event must be either enter or exit."))
    }


    if (!item.ownerId) {
      const token = ctx.options && ctx.options.accessToken;
      const userId = token && token.userId;

      if (!userId) {
        return next(new Error("Not logged in!"));
      }
      item.ownerId = userId;
      next();
    }
    else {
      next();
    }
  };

  model.observe('before save', injectOwner);


  model.afterRemote('*.__link__recipients', function(ctx, instance, next) {
    model.findById(instance.messageId)
      .then((result) => {
        if (result) {
          messageUtils.notifyWithUserIds(instance, [instance.userId]);
        }
        else {
          throw "No Message Found"
        }
      })
      .then(() => {
        next();
      })
      .catch((err) => {
        next(err);
      })
  });

  model.markDelivered = function(id, options, next) {
    markState(id, options, 'delivered', next);
  };

  model.markRead = function(id, options, next) {
    markState(id, options, 'read', next);
  };

  const markState = function(id, options, activeField, next) {
    let userId = options && options.accessToken && options.accessToken.userId;

    if (!userId) { next("Not logged in!"); }

    model.findById(id)
      .then((result) => {
        if (!result) { throw "Message not found!"}

        return result[activeField].create({
          timestamp: new Date().valueOf(),
          messageId: id,
          userId: userId
        }, options);
      })
      .then(() => { next(); })
      .catch((err) => { next(err); })
  };

  model.remoteMethod(
    'markDelivered',
    {
      http: {path: '/:id/delivered/', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Mark this message as delivered to you.",
    }
  );

  model.remoteMethod(
    'markRead',
    {
      http: {path: '/:id/read/', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
      ],
      description: "Mark this message as read by you.",
    }
  );










};