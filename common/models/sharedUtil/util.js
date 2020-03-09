"use strict"

let crypto = require('crypto');

module.exports = {
  createKey: function() {
    return crypto.randomBytes(16).toString('hex');
  },

  unauthorizedError: function() {
    new Error("Authorization Required");
    error.statusCode = error.status = 401;
    error.code = "AUTHORIZATION_REQUIRED";
    return error;
  }

}
