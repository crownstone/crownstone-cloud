"use strict"

let crypto = require('crypto');

module.exports = {
  createKey: function() {
    return crypto.randomBytes(16).toString('hex');
  },

  getUUID : () => {
    return (
      S4() + S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + S4() + S4()
    );
  },
}

const S4 = function () {
  return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
};
