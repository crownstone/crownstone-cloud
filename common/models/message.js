"use strict";

let loopback = require('loopback');

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
    //   - everything:
    //***************************
    model.settings.acls.push({
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$group:admin",
      "permission": "ALLOW"
    });

    //***************************
    // MEMBER:
    //   - everything except:
    //   	- delete messages
    //    - change recipients
    //***************************
    model.settings.acls.push(
      {
        "accessType": "EXECUTE",
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "ALLOW"
      }
    );
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "DENY",
      "property": "destroyById"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "DENY",
      "property": "deleteById"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "DENY",
      "property": "__link__recipients"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "DENY",
      "property": "__unlink__recipients"
    });

    //***************************
    // GUEST:
    //   - everything except:
    //   	- delete messages
    //    - change recipients
    //***************************
    model.settings.acls.push(
      {
        "accessType": "EXECUTE",
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW"
      }
    );
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "DENY",
      "property": "destroyById"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "DENY",
      "property": "deleteById"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "DENY",
      "property": "__link__recipients"
    });
    model.settings.acls.push({
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "DENY",
      "property": "__unlink__recipients"
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
  model.disableRemoteMethodByName('upsert');
  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('prototype.patchAttributes');

  model.disableRemoteMethodByName('prototype.__get__owner');
  model.disableRemoteMethodByName('prototype.__get__triggerLocation');

  model.disableRemoteMethodByName('prototype.__delete__delivered');
  model.disableRemoteMethodByName('prototype.__updateById__delivered');
  model.disableRemoteMethodByName('prototype.__deleteById__delivered');
  model.disableRemoteMethodByName('prototype.__destroyById__delivered');
  model.disableRemoteMethodByName('prototype.__findById__delivered');
  model.disableRemoteMethodByName('prototype.__count__delivered');

  model.disableRemoteMethodByName('prototype.__delete__read');
  model.disableRemoteMethodByName('prototype.__updateById__read');
  model.disableRemoteMethodByName('prototype.__deleteById__read');
  model.disableRemoteMethodByName('prototype.__destroyById__read');
  model.disableRemoteMethodByName('prototype.__findById__read');
  model.disableRemoteMethodByName('prototype.__count__read');

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


  model.afterRemote('*.__link__recipients', function(ctx, instance, next) {
    model.findById(instance.messageId)
      .then((result) => {
        if (result) {
          messageUtils.notifyWithUserIds(message, [instance.userId]);
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

};