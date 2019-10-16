"use strict"

let crypto = require('crypto');

module.exports = {
  createKey: function() {
    return crypto.randomBytes(16).toString('hex');
  },


}
