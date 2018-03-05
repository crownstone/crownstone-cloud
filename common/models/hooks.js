"use strict";

const OauthEventPermissions = require("./permissions/oauthEvents")
const loopback = require('loopback');
const crypto = require('crypto');
const parseDomain = require('parse-domain');


const PERMISSION_ID_PREFIX = "permission_";

module.exports = function(model) {

  const _getPermissionId = function(ctx) {
    let isOAuthAccess = ctx.options.accessToken.appId !== undefined;
    let permissionId = ctx.options.accessToken.userId;
    if (isOAuthAccess) {
      permissionId = ctx.options.accessToken.appId;
    }
    return PERMISSION_ID_PREFIX + permissionId;
  }

  /************************************
   **** Model Validation
   ************************************/

  model.observe('access', (context, callback) => {
    if (context.options && context.options.accessToken) {
      let filter = {permissionId: _getPermissionId(context)};
      const where = context.query.where ? { and: [ context.query.where, filter ] } : filter;
      context.query.where = where;
      callback();
    }
    else {
      callback();
    }
  });

  model.observe('before save', function (ctx, next) {
    if (!(ctx.instance && ctx.instance.uri)) {
      return next({statusCode: 400, message: "Invalid request."});
    }
    let uri = ctx.instance.uri;

    let production = true;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
      production = false;
    }
    let domainInfo = {};

    if (production === true) {
      domainInfo = parseDomain(String(uri), {customTlds: /localhost|\.local/});

      if (!domainInfo) {
        return next({statusCode: 400, message: 'Could not parse domain.'});
      }
    }

    if (!(ctx.options && ctx.options.accessToken)) {
      return next({statusCode: 400, message: "Access Denied (no keys in context)."});
    }

    let isOAuthAccess = ctx.options.accessToken.appId !== undefined;
    ctx.instance.permissionId = _getPermissionId(ctx);

    if (isOAuthAccess) {
      let parentModel = null;
      if (ctx.instance.sphereId    !== undefined) { parentModel = "Sphere";    }
      if (ctx.instance.locationId  !== undefined) { parentModel = "Location";  }
      if (ctx.instance.stoneId     !== undefined) { parentModel = "Stone";     }
      if (ctx.instance.deviceId    !== undefined) { parentModel = "Device";    }
      if (ctx.instance.applianceId !== undefined) { parentModel = "Appliance"; }

      if (!parentModel) {
        return next({statusCode: 400, message: 'Unknown parent model.'});
      }

      let scopes = ctx.options.accessToken.scopes;
      let events = ctx.instance.events;
      for (let i = 0; i < events.length; i++) {
        let allowedScopes = OauthEventPermissions[parentModel][events[i]];
        let allowed = false;
        for (let j = 0; j < scopes.length; j++) {
          if (allowedScopes[scopes[j]]) {
            allowed = true;
            break;
          }
        }
        if (allowed === false) {
          return next({statusCode: 400, message:
            'No access to this event with your OAuth2 scopes, allowed scopes: ' + JSON.stringify(Object.keys(allowedScopes))});
        }
      }
    }

    if (production === false) {
      console.log("Hooks: Bypassing URL whitelist check.");
      return next();
    }

    let whiteList = loopback.getModel('HooksWhitelist');
    whiteList.findOne({where: {and: [{domain: domainInfo.domain}, {tld:domainInfo.tld}]}})
      .then((result) => {
        if (result && result.enabled === true) {
          return next();
        }
        else if (result && result.enabled === false) {
          throw {statusCode: 403, message:"Requested domain is currently disabled."};
        }
        else {
          throw {statusCode: 403, message:"Requested domain is not allowed. You can contact Crownstone at team@crownstone.rocks to request the whitelisting of this domain."}
        }
      })
      .catch((err) => {
        next(err);
      });

  });

};
