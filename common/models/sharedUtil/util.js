"use strict"

let loopback = require('loopback');
let crypto = require('crypto');

const versionUtil = require('../../../server/util/versionUtil');

module.exports = {
  createKey: function() {
    return crypto.randomBytes(16).toString('hex');
  },

  unauthorizedError: function() {
    new Error("Authorization Required");
    error.statusCode = error.status = 401;
    error.code = "AUTHORIZATION_REQUIRED";
    return error;
  },


  deviceIsMinimalVersion: function(options, version) {
    let userId = options.accessToken.userId;
    // hack to only allow the newest app access to the abilities. Will be removed later on.
    const DeviceModel = loopback.getModel("Device");

    return DeviceModel.findOne({where: {ownerId: userId}, include: "installations", order: "updatedAt DESC", limit: "1"})
      .then((device) => {
        if (device) {
          let installations = device.installations();
          for (let i = 0; i < installations.length; i++) {
            if (installations[i].appVersion) {
              if (versionUtil.isHigherOrEqual(installations[i].appVersion, version)) {
                return true;
              }
              else {
                return false;
              }
            }
          }
          return false;
        }
        else {
          return true
        }
      })
  }
}
