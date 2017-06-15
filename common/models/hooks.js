"use strict";

const loopback = require('loopback');
const crypto = require('crypto');
const parseDomain = require('parse-domain');

module.exports = function(model) {

  /************************************
   **** Model Validation
   ************************************/

  model.observe('before save', function (ctx, next) {
    if (!(ctx.instance && ctx.instance.uri)) {
      return next({statusCode: 400, message: "Invalid request."});
    }

    let uri = ctx.instance.uri;

    let domainInfo = parseDomain(String(uri), { customTlds:/localhost|\.local/ });

    if (!domainInfo) {
      return next({statusCode: 400, message: 'Could not parse domain.'});
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
